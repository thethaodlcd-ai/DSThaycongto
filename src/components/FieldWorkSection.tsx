import React, { useRef, useState } from 'react';
import { Camera, MapPin, Hash, Trash2, Tag, Crosshair } from 'lucide-react';
import { useFieldData, compressImage } from '../hooks/useFieldData';
import { twMerge } from 'tailwind-merge';

export function FieldWorkSection({ customerCode }: { customerCode: string }) {
  const { data, saveData, loading, addImage, removeImage } = useFieldData(customerCode);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadType, setUploadType] = useState<'general' | 'meter'>('general');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  if (loading) return <div className="animate-pulse h-32 bg-slate-100 rounded-xl mt-6"></div>;

  const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setIsUploading(true);
    let lat: number | undefined;
    let lng: number | undefined;
    
    try {
      if (navigator.geolocation) {
        setIsGettingLocation(true);
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
           navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
        });
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      }
    } catch (err) {
      console.warn("Could not get location", err);
    } finally {
      setIsGettingLocation(false);
    }

    let latestCoordinates = data.coordinates;
    
    for (let i = 0; i < e.target.files.length; i++) {
      const file = e.target.files[i];
      const compressedUrl = await compressImage(file);
      const newImg = {
        id: Date.now().toString() + i,
        url: compressedUrl,
        lat,
        lng,
        timestamp: Date.now(),
        type: uploadType
      };
      
      await addImage(newImg);
      
      // Use the first image's coordinates if no manual coordinates are set
      if (!latestCoordinates && lat && lng) {
        latestCoordinates = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        saveData({ ...data, coordinates: latestCoordinates });
      }
    }
    
    setIsUploading(false);
  };

  const updateCoordinatesFromLocation = async () => {
    setIsGettingLocation(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
         navigator.geolocation.getCurrentPosition(resolve, reject);
      });
      saveData({ ...data, coordinates: `${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}` });
    } catch (err) {
      alert('Không thể tự động lấy được vị trí. Hãy kiểm tra lại quyền Location của trình duyệt.');
    }
    setIsGettingLocation(false);
  };

  return (
    <div className="mt-8 border-t border-slate-200 pt-8">
      <div className="flex items-center gap-2 mb-4">
        <Camera className="w-5 h-5 text-indigo-600" />
        <h3 className="text-lg font-black text-slate-900">Khảo Sát Hiện Trường</h3>
      </div>
      
      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tọa độ */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
              <MapPin className="w-3 h-3" /> Tọa độ hiện trường
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="VD: 10.762622, 106.660172"
                value={data.coordinates || ''}
                onChange={(e) => saveData({ ...data, coordinates: e.target.value })}
                className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
              <button
                onClick={updateCoordinatesFromLocation}
                disabled={isGettingLocation}
                className="px-3 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors flex items-center justify-center shrink-0"
                title="Lấy tọa độ hiện tại"
              >
                <Crosshair className={twMerge("w-4 h-4", isGettingLocation && "animate-spin")} />
              </button>
            </div>
          </div>

          {/* Số công tơ treo */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
              <Hash className="w-3 h-3" /> Số công tơ treo
            </label>
            <input
              type="text"
              placeholder="Nhập số công tơ..."
              value={data.meterNumber || ''}
              onChange={(e) => saveData({ ...data, meterNumber: e.target.value })}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-mono font-bold"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <input
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            ref={fileInputRef}
            className="hidden"
            onChange={handleCapture}
          />
          <button
            disabled={isUploading}
            onClick={() => { setUploadType('general'); fileInputRef.current?.click(); }}
            className={twMerge("flex flex-1 items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl shadow-sm transition-colors", isUploading ? "opacity-50 cursor-not-allowed" : "hover:border-indigo-300 hover:text-indigo-600")}
          >
            <Camera className={twMerge("w-4 h-4", isUploading && "animate-pulse")} /> {isUploading ? "Đang xử lý..." : "Thêm ảnh chung"}
          </button>
          <button
            disabled={isUploading}
            onClick={() => { setUploadType('meter'); fileInputRef.current?.click(); }}
            className={twMerge("flex flex-1 items-center justify-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold py-2.5 px-4 rounded-xl shadow-sm transition-colors", isUploading ? "opacity-50 cursor-not-allowed" : "hover:bg-indigo-100")}
          >
            <Tag className={twMerge("w-4 h-4", isUploading && "animate-pulse")} /> {isUploading ? "Đang xử lý..." : "Chụp ảnh công tơ"}
          </button>
        </div>

        {/* Image Grid */}
        {data.images.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-200">
            {data.images.map((img) => (
              <div key={img.id} className="relative group rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm">
                <div className="aspect-square bg-slate-100">
                  <img src={img.url} alt="Field" className="w-full h-full object-cover" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute top-2 left-2 flex gap-1">
                  {img.type === 'meter' && <span className="bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">Công tơ</span>}
                </div>
                <button
                  onClick={() => removeImage(img.id)}
                  className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
                {(img.lat && img.lng) && (
                  <div className="absolute bottom-2 left-2 right-2 text-[9px] text-white/90 font-mono flex items-center gap-1 drop-shadow-md">
                    <MapPin className="w-2.5 h-2.5 shrink-0" />
                    <span className="truncate">{img.lat.toFixed(4)}, {img.lng.toFixed(4)}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
