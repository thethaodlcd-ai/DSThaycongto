import { useState, useEffect, useRef, useCallback } from 'react';
import { doc, setDoc, deleteDoc, onSnapshot, collection } from 'firebase/firestore';
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
  constructionStatus?: 'Chờ thay' | 'Đã thay' | 'Tạm hoãn';
  meterReplacementDate?: string;
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
        const MAX_WIDTH = 800;
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
        resolve(canvas.toDataURL('image/webp', 0.6));
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
    
    const unsubDoc = onSnapshot(docRef, (docSnap) => {
      setData(prev => {
        if (docSnap.exists()) {
          const d = docSnap.data();
          const legacyImages = d.images || [];
          return { ...prev, meterNumber: d.meterNumber || '', coordinates: d.coordinates || '', constructionStatus: d.constructionStatus, meterReplacementDate: d.meterReplacementDate, images: [...legacyImages, ...prev.images.filter(x => !legacyImages.find((y: any) => y.id === x.id))] };
        } else {
          return { ...prev, meterNumber: '', coordinates: '', constructionStatus: undefined, meterReplacementDate: undefined };
        }
      });
      setLoading(false);
    }, (error) => {
      console.error("Error fetching field data", error);
      setLoading(false);
    });

    const unsubImages = onSnapshot(collection(db, 'field_data', customerCode, 'images'), (snapshot) => {
      setData(prev => {
        const subImages = snapshot.docs.map(d => d.data() as ImageData);
        const combined = [...prev.images];
        for (const img of subImages) {
          const idx = combined.findIndex(x => x.id === img.id);
          if (idx >= 0) combined[idx] = img;
          else combined.push(img);
        }
        return { ...prev, images: combined };
      });
    }, (error) => {
      console.error("Error fetching subcollection images", error);
    });

    return () => { unsubDoc(); unsubImages(); };
  }, [customerCode]);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const saveData = useCallback((newData: CustomerFieldData) => {
    setData(newData);
    
    if (debounceRef.current) clearTimeout(debounceRef.current);
    
    debounceRef.current = setTimeout(async () => {
      try {
        const docRef = doc(db, 'field_data', customerCode);
        await setDoc(docRef, { 
          meterNumber: newData.meterNumber, 
          coordinates: newData.coordinates,
          constructionStatus: newData.constructionStatus || null,
          meterReplacementDate: newData.meterReplacementDate || null
        }, { merge: true });
      } catch (error) {
        console.error("Error saving data to Firestore", error);
      }
    }, 600);
  }, [customerCode]);

  const addImage = async (img: ImageData) => {
    try {
      const imgDoc = doc(db, 'field_data', customerCode, 'images', img.id);
      await setDoc(imgDoc, img);
    } catch (error) {
      console.error("Error saving image to subcollection", error);
    }
  };

  const removeImage = async (id: string) => {
    try {
      // Optimistic URL removal for responsiveness
      setData(prev => ({ ...prev, images: prev.images.filter(x => x.id !== id) }));
      const imgDoc = doc(db, 'field_data', customerCode, 'images', id);
      await deleteDoc(imgDoc);
    } catch (e) {
      console.error("Error deleting", e);
    }
    // Also remove from array if it was legacy
    try {
      if (data.images.find(x => x.id === id)) {
         const docRef = doc(db, 'field_data', customerCode);
         await setDoc(docRef, { images: data.images.filter(x => x.id !== id) }, { merge: true });
      }
    } catch (e) {}
  };

  return { data, saveData, loading, addImage, removeImage };
}
