"use client";

// مودال کراپ مربع عکس
import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { X, Check } from "lucide-react";
import Portal from "@/components/ui/Portal";
import { getCroppedImg } from "@/lib/cropImage";

type Point = { x: number; y: number };
type Area = { x: number; y: number; width: number; height: number };

type Props = {
  image: string;
  onCrop: (file: File) => void;
  onCancel: () => void;
};

export default function ImageCropperModal({ image, onCrop, onCancel }: Props) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [loading, setLoading] = useState(false);

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  async function handleConfirm() {
    if (!croppedAreaPixels) return;
    setLoading(true);
    try {
      const blob = await getCroppedImg(image, croppedAreaPixels);
      const file = new File([blob], "cropped.jpg", { type: "image/jpeg" });
      onCrop(file);
    } catch {
      // خطای کراپ
    } finally {
      setLoading(false);
    }
  }

  return (
    <Portal>
    <div className="fixed inset-0 z-50 bg-black/80 ig-glass flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-4 ig-modal-in">
        <div className="flex items-center justify-end mb-2">
          <button
            onClick={onCancel}
            className="w-7 h-7 rounded-full bg-neutral-100 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-neutral-100 mb-4">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="rect"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <div className="mb-4">
          <label className="text-xs text-neutral-500 font-bold block mb-1.5">بزرگنمایی</label>
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full accent-neutral-900"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onCancel}
            className="py-2.5 rounded-xl bg-neutral-100 text-sm font-bold hover:bg-neutral-200 transition-colors"
          >
            انصراف
          </button>
          <button
            onClick={handleConfirm}
            disabled={!croppedAreaPixels || loading}
            className="py-2.5 rounded-xl bg-ig-blue text-white text-sm font-bold flex items-center justify-center gap-1.5 hover:bg-ig-blue-hover transition-colors disabled:opacity-50"
          >
            {loading ? (
              <span>در حال پردازش...</span>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>تایید</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
    </Portal>
  );
}
