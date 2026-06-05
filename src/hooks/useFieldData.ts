import { useState, useEffect } from 'react';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

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
    
    const docRef = doc(db, 'field_data', customerCode);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setData(docSnap.data() as CustomerFieldData);
      } else {
        setData({ meterNumber: '', coordinates: '', images: [] });
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching field data", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [customerCode]);

  const saveData = async (newData: CustomerFieldData) => {
    setData(newData);
    try {
      const docRef = doc(db, 'field_data', customerCode);
      await setDoc(docRef, newData);
    } catch (error) {
      console.error("Error saving data to Firestore", error);
    }
  };

  return { data, saveData, loading };
}
