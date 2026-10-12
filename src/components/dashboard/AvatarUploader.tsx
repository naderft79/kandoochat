"use client";

// آواتار پروفایل — کراپ مربع اجباری
import { useState, useRef } from "react";
import Image from "next/image";
import { Camera, Loader2, Plus, Trash2, RefreshCw, X, Clock } from "lucide-react";
import Portal from "@/components/ui/Portal";
import dynamic from "next/dynamic";
import DefaultAvatar from "@/components/dashboard/DefaultAvatar";
import AlertModal from "@/components/AlertModal";

// مودال های سنگین فقط هنگام نیاز بارگذاری می شوند
const ImageCropperModal = dynamic(() => import("@/components/dashboard/ImageCropperModal"));
const FacePhotoWarningModal = dynamic(() => import("@/components/dashboard/FacePhotoWarningModal"));
import { readFile } from "@/lib/cropImage";

type Props = {
  initialUrl: string | null;
  firstName: string;
  gender?: string;
  isVerified: boolean;
  photoVerified?: boolean;
};

export default function AvatarUploader({ initialUrl, firstName, isVerified, photoVerified = true }: Props) {
  const [url, setUrl] = useState<string | null>(initialUrl);
  const [uploading, setUploading] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [showFaceWarning, setShowFaceWarning] = useState(false);
  const [pendingUpload, setPendingUpload] = useState(false);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setShowFaceWarning(false);
    const imageUrl = await readFile(file);
    setCropImage(imageUrl);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "profile");
      const res = await fetch("/api/profile/photos", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.photo) {
        setUrl(data.photo.url);
        setPendingUpload(true);
        setShowOptions(false);
      } else if (!res.ok && data.error) {
        setAlertMsg(data.error);
      }
    } catch {
      setAlertMsg("خطای شبکه");
    } finally {
      setUploading(false);
      setCropImage(null);
    }
  }

  async function handleDelete() {
    try {
      const res = await fetch("/api/profile/photos?type=profile", {
        method: "DELETE",
      });
      if (res.ok) {
        setUrl(null);
        setPendingUpload(false);
      } else {
        const data = await res.json();
        setAlertMsg(data.error ?? "خطا در حذف عکس");
      }
    } catch {
      setAlertMsg("خطای شبکه");
    }
  }

  const isPending = pendingUpload || (url !== null && !photoVerified);

  return (
    <>
      <div
        className="shrink-0 relative cursor-pointer"
        onClick={() => !uploading && (url ? setShowOptions(true) : setShowFaceWarning(true))}
      >
        <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-neutral-200 p-0.5 relative overflow-hidden group flex items-center justify-center">
          {url ? (
            <Image
              src={url}
              alt={firstName}
              fill
              className={`rounded-full object-cover ${isPending ? "opacity-50" : ""}`}
              sizes="96px"
            />
          ) : (
            <DefaultAvatar size={76} className="md:!w-[92px] md:!h-[92px]" />
          )}

          {/* overlay در انتظار تایید */}
          {isPending && url && (
            <div className="absolute inset-0 bg-black/50 rounded-full flex flex-col items-center justify-center gap-0.5">
              <Clock className="w-5 h-5 text-white animate-pulse" />
              <span className="text-[7px] text-white font-bold text-center leading-tight">در انتظار<br />تایید مدیر</span>
            </div>
          )}

          {/* overlay دوربین — فقط وقتی pending نیست */}
          {!isPending && (
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              {uploading ? (
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <Camera className="w-5 h-5 text-white" />
                  <span className="text-xs text-white font-bold">{url ? "تغییر" : "افزودن عکس"}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {isVerified && (
          <div className="absolute -bottom-1 -left-1 w-6 h-6 rounded-full bg-ig-blue-bright flex items-center justify-center border-2 border-white z-10">
            <Plus className="w-4 h-4 text-white" strokeWidth={3} />
          </div>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* دیالوگ انتخاب */}
      {showOptions && (
        <Portal>
        <div
          className="fixed inset-0 z-50 bg-black/60 ig-glass flex items-center justify-center p-4"
          onClick={() => setShowOptions(false)}
        >
          <div
            className="bg-surface rounded-2xl max-w-xs w-full p-4 ig-modal-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black text-foreground">عکس پروفایل</h3>
              <button
                onClick={() => setShowOptions(false)}
                className="w-7 h-7 rounded-full bg-ig-btn2 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setShowOptions(false);
                  setShowFaceWarning(true);
                }}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-ig-btn2 hover:bg-neutral-200 transition-colors"
              >
                <RefreshCw className="w-6 h-6 text-foreground" />
                <span className="text-xs font-bold">تغییر عکس</span>
              </button>
              <button
                onClick={() => {
                  setShowOptions(false);
                  handleDelete();
                }}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-ig-gray-bg hover:bg-ig-gray-bg text-ig-red transition-colors"
              >
                <Trash2 className="w-6 h-6" />
                <span className="text-xs font-bold">حذف عکس</span>
              </button>
            </div>
          </div>
        </div>
        </Portal>
      )}

      {/* مودال هشدار عمومی */}
      <AlertModal
        open={alertMsg !== null}
        message={alertMsg ?? ""}
        variant="error"
        onClose={() => setAlertMsg(null)}
      />

      {/* مودال هشدار چهره */}
      <FacePhotoWarningModal
        open={showFaceWarning}
        onCancel={() => setShowFaceWarning(false)}
        onConfirm={() => {
          setShowFaceWarning(false);
          fileRef.current?.click();
        }}
      />

      {/* مودال کراپ */}
      {cropImage && (
        <ImageCropperModal
          image={cropImage}
          onCrop={handleUpload}
          onCancel={() => setCropImage(null)}
        />
      )}
    </>
  );
}
