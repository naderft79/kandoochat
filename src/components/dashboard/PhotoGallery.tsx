"use client";

// گالری عکس کاربر — 3 عکس با کراپ مربع اجباری
import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { Plus, Loader2, Trash2, RefreshCw, Clock } from "lucide-react";
import dynamic from "next/dynamic";
import AlertModal from "@/components/AlertModal";
import Portal from "@/components/ui/Portal";

// مودال های سنگین فقط هنگام نیاز بارگذاری می شوند
const ImageCropperModal = dynamic(() => import("@/components/dashboard/ImageCropperModal"));
const FacePhotoWarningModal = dynamic(() => import("@/components/dashboard/FacePhotoWarningModal"));
import { readFile } from "@/lib/cropImage";

type Photo = {
  id: string;
  url: string;
  order: number;
  isVerified?: boolean;
  isRejected?: boolean;
};

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 10 * 1024 * 1024; // ۱۰ مگابایت

export default function PhotoGallery({ initialPhotos }: { initialPhotos: Photo[] }) {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [uploading, setUploading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [replacingId, setReplacingId] = useState<string | null>(null);
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [showFaceWarning, setShowFaceWarning] = useState(false);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setAlertMsg("فرمت فایل مجاز نیست (jpg, png, webp)");
      return;
    }
    if (file.size > MAX_SIZE) {
      setAlertMsg("حداکثر حجم فایل ۱۰ مگابایت است");
      return;
    }

    setShowFaceWarning(false);
    const imageUrl = await readFile(file);
    setCropImage(imageUrl);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleUpload(file: File) {
    const targetId = replacingId;
    setReplacingId(null);

    setUploading(true);
    try {
      if (targetId) {
        const delRes = await fetch(`/api/profile/photos?id=${targetId}`, {
          method: "DELETE",
        });
        if (delRes.ok) {
          setPhotos((prev) => prev.filter((p) => p.id !== targetId));
        } else {
          const delData = await delRes.json().catch(() => ({}));
          throw new Error(delData.error ?? "حذف عکس قبلی ناموفق بود");
        }
      } else if (photos.length >= 3) {
        setAlertMsg("حداکثر ۳ عکس در گالری مجاز است");
        return;
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "gallery");
      const res = await fetch("/api/profile/photos", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.photo) {
        setPhotos((prev) => [...prev, { id: data.photo.id, url: data.photo.url, order: data.photo.order, isVerified: false }]);
      } else if (!res.ok && data.error) {
        setAlertMsg(data.error);
      }
    } catch (e) {
      setAlertMsg(e instanceof Error ? e.message : "خطای شبکه");
    } finally {
      setUploading(false);
      setCropImage(null);
    }
  }

  const handleDelete = useCallback(async (photoId: string) => {
    try {
      const res = await fetch(`/api/profile/photos?id=${photoId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setPhotos((prev) => prev.filter((p) => p.id !== photoId));
      } else {
        const data = await res.json().catch(() => ({}));
        setAlertMsg(data.error ?? "خطا در حذف عکس");
      }
    } catch {
      // خطای شبکه
    }
  }, []);

  const startReplace = (photo: Photo) => {
    setSelectedPhoto(null);
    setReplacingId(photo.id);
    setShowFaceWarning(true);
  };

  const slots = 3;
  const filled = photos.length;

  return (
    <div>
      <h3 className="text-sm font-black text-foreground mb-3">گالری عکس</h3>
      <div className="grid grid-cols-3 gap-[2px]">
        {photos.map((photo) => (
          <button
            key={photo.id}
            onClick={() => setSelectedPhoto(photo)}
            className="relative aspect-square overflow-hidden group bg-ig-btn2 text-left"
          >
            <Image
              src={photo.url}
              alt="عکس گالری"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 33vw, 200px"
            />
            {!photo.isVerified && (
              <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center" title="در انتظار تایید">
                <Clock className="w-3 h-3 text-white" />
              </span>
            )}
          </button>
        ))}

        {Array.from({ length: slots - filled }).map((_, i) => (
          <button
            key={`empty-${i}`}
            onClick={() => !uploading && setShowFaceWarning(true)}
            disabled={uploading}
            className="aspect-square border border-dashed border-neutral-300 bg-ig-gray-bg flex items-center justify-center hover:bg-ig-btn2 transition-colors"
          >
            {uploading ? (
              <Loader2 className="w-5 h-5 text-neutral-400 animate-spin" />
            ) : (
              <Plus className="w-6 h-6 text-neutral-400" />
            )}
          </button>
        ))}
      </div>
      <p className="text-xs text-neutral-400 mt-2">حداکثر ۳ عکس در گالری</p>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* مودال نمایش بزرگ + دکمه ها */}
      {selectedPhoto && (
        <Portal>
        <div
          className="fixed inset-0 z-50 bg-black/80 ig-glass flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="bg-surface rounded-2xl max-w-sm w-full p-4 ig-modal-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-ig-btn2 mb-4">
              <Image
                src={selectedPhoto.url}
                alt="عکس گالری"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 90vw, 400px"
              />
            </div>
            {!selectedPhoto.isVerified && (
              <div className="mb-3 flex items-center justify-center gap-2 p-2.5 rounded-xl bg-ig-gray-bg text-foreground">
                <Clock className="w-4 h-4" />
                <span className="text-xs font-bold">این عکس در انتظار تایید مدیر است</span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => startReplace(selectedPhoto)}
                className="flex items-center justify-center gap-2 p-3 rounded-xl bg-ig-btn2 hover:bg-neutral-200 transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
                <span className="text-sm font-bold">تغییر عکس</span>
              </button>
              <button
                onClick={() => {
                  handleDelete(selectedPhoto.id);
                  setSelectedPhoto(null);
                }}
                className="flex items-center justify-center gap-2 p-3 rounded-xl bg-ig-gray-bg hover:bg-ig-gray-bg text-ig-red transition-colors"
              >
                <Trash2 className="w-5 h-5" />
                <span className="text-sm font-bold">حذف عکس</span>
              </button>
            </div>
          </div>
        </div>
        </Portal>
      )}

      {/* مودال هشدار چهره */}
      <FacePhotoWarningModal
        open={showFaceWarning}
        title="قوانین انتخاب عکس گالری"
        showDuplicateRule
        onCancel={() => {
          setShowFaceWarning(false);
          setReplacingId(null);
        }}
        onConfirm={() => {
          setShowFaceWarning(false);
          fileRef.current?.click();
        }}
      />

      {/* مودال هشدار عمومی */}
      <AlertModal
        open={alertMsg !== null}
        message={alertMsg ?? ""}
        variant="error"
        onClose={() => setAlertMsg(null)}
      />

      {/* مودال کراپ */}
      {cropImage && (
        <ImageCropperModal
          image={cropImage}
          onCrop={handleUpload}
          onCancel={() => {
            setCropImage(null);
            setReplacingId(null);
          }}
        />
      )}
    </div>
  );
}
