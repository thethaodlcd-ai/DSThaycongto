import { useState, useEffect } from 'react';
import { get, set } from 'idb-keyval';

export interface ImageData {
  id: string;
  url: string;
  lat?: number;
  lng?: number;
  timestamp: number;
  type: 'general' | 'meter';
}

export interface CustomerFieldData {
  meterNumber: string;
  coordinates: string;
  images: ImageData[];
}

export const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1024;
        let width = img.width;
        let height = img.height;
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
    };
  });
};

export function useFieldData(customerCode: string) {
  const [data, setData] = useState<CustomerFieldData>({ meterNumber: '', coordinates: '', images: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!customerCode) return;
    setLoading(true);
    get(`field_data_${customerCode}`).then(val => {
      if (val) setData(val);
      else setData({ meterNumber: '', coordinates: '', images: [] });
      setLoading(false);
    });
  }, [customerCode]);

  const saveData = async (newData: CustomerFieldData) => {
    // Optimistic UI update
    setData(newData);
    // Write to persistent IndexedDB
    await set(`field_data_${customerCode}`, newData);
  };

  return { data, saveData, loading };
}
