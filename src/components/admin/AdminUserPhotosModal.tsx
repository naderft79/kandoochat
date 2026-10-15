"use client";

// مودال مدیریت عکس کاربر در پنل ادمین
import { useState, useRef } from "react";
import Image from "next/image";
import { X, Plus, Trash2, RefreshCw, Loader2, Camera } from "lucide-react";
import DefaultAvatar from "@/components/dashboard/DefaultAvatar";
import AlertModal from "@/components/AlertModal";
import { toPersianDigits } from "@/lib/format";

type Photo = {
  id: string;
  url: string;
  isProfile: boolean;
};

type User = {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  photos: Photo[];
};

type Props = {
  user: User;
  onClose: () => void;
  onUpdate: (userId: string, photos: Photo[]) => void;
};

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 50 * 1024 * 1024;

export default function AdminUserPhotosModal({ user, onClose, onUpdate }: Props) {
  const [photos, setPhotos] = useState<Photo[]>(user.photos);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [replacingId, setReplacingId] = useState<string | null>(null);
  const [uploadType, setUploadType] = useState<"profile" | "gallery">("gallery");
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const profilePhoto = photos.find((p) => p.isProfile) ?? null;
  const galleryPhotos = photos.filter((p) => !p.isProfile);

  function triggerFileInput(type: "profile" | "gallery", replaceId?: string) {
    setUploadType(type);
    setReplacingId(replaceId ?? null);
    fileRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setAlertMsg("فرمت فایل مجاز نیست (jpg, png, webp)");
      return;
    }
    if (file.size > MAX_SIZE) {
      setAlertMsg("حجم عکس بیش از حد مجاز است");
      return;
    }

    const type = uploadType;
    const replaceId = replacingId;
    setReplacingId(null);

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", user.id);
      formData.append("type", type);
      if (replaceId) formData.append("replaceId", replaceId);

      const res = await fetch("/api/admin/users/photos", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setAlertMsg(data.error || "خطا در آپلود");
        return;
      }

      const newPhoto: Photo = { id: data.photo.id, url: data.photo.url, isProfile: data.photo.isProfile };
      setPhotos((prev) => {
        const filtered = replaceId ? prev.filter((p) => p.id !== replaceId) : prev;
        const withoutProfile = type === "profile" ? filtered.filter((p) => !p.isProfile) : filtered;
        return [...withoutProfile, newPhoto];
      });
    } catch {
      setAlertMsg("خطای شبکه");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleDelete(photoId: string) {
    setDeletingId(photoId);
    try {
      const res = await fetch(`/api/admin/users/photos?id=${photoId}&userId=${user.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setPhotos((prev) => prev.filter((p) => p.id !== photoId));
      } else {
        setAlertMsg("خطا در حذف عکس");
      }
    } catch {
      setAlertMsg("خطای شبکه");
    } finally {
      setDeletingId(null);
    }
  }

  function handleClose() {
    onUpdate(user.id, photos);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 ig-glass flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div
        className="lux-card w-full max-w-md p-4 ig-modal-in max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-black text-[#e8e8e8]">
            عکس های {user.firstName} {user.lastName}
          </h3>
          <button onClick={handleClose} className="w-7 h-7 rounded-full bg-[rgba(212,175,55,0.08)] flex items-center justify-center">
            <X className="w-4 h-4 text-[#888]" />
          </button>
        </div>

        {/* عکس پروفایل */}
        <div className="mb-4">
          <p className="text-xs font-bold text-[#888] mb-2">عکس پروفایل</p>
          <div className="flex items-center gap-3">
            <div className="relative w-20 h-20 rounded-full bg-[#0d0d0d] overflow-hidden shrink-0">
              {profilePhoto ? (
                <Image src={profilePhoto.url} alt="پروفایل" fill className="object-cover" sizes="80px" />
              ) : (
                <DefaultAvatar size={80} />
              )}
            </div>
            <button
              onClick={() => triggerFileInput("profile")}
              disabled={uploading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg lux-btn-outline text-xs font-bold transition-all"
            >
              <Camera className="w-4 h-4" />
              {profilePhoto ? "تغییر عکس پروفایل" : "افزودن عکس پروفایل"}
            </button>
            {profilePhoto && (
              <button
                onClick={() => handleDelete(profilePhoto.id)}
                disabled={deletingId === profilePhoto.id}
                className="flex items-center justify-center w-9 h-9 rounded-lg bg-[rgba(239,68,68,0.1)] hover:bg-[rgba(239,68,68,0.15)] text-[#f87171] transition-all shrink-0"
                title="حذف عکس پروفایل"
              >
                {deletingId === profilePhoto.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* گالری */}
        <div>
          <p className="text-xs font-bold text-[#888] mb-2">
            گالری ({toPersianDigits(galleryPhotos.length)} عکس)
          </p>
          <div className="grid grid-cols-3 gap-2">
            {galleryPhotos.map((photo) => (
              <div key={photo.id} className="relative aspect-square rounded-xl overflow-hidden bg-[#0d0d0d] border border-[rgba(212,175,55,0.1)]">
                <Image src={photo.url} alt="عکس گالری" fill className="object-cover" sizes="120px" />
                <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                  <button
                    onClick={() => triggerFileInput("gallery", photo.id)}
                    disabled={uploading}
                    className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center"
                    title="جایگزین"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(photo.id)}
                    disabled={deletingId === photo.id}
                    className="w-7 h-7 rounded-full bg-white/90 text-red-600 flex items-center justify-center"
                    title="حذف"
                  >
                    {deletingId === photo.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            ))}

            {galleryPhotos.length < 3 && (
              <button
                onClick={() => triggerFileInput("gallery")}
                disabled={uploading}
                className="aspect-square rounded-xl border border-dashed border-[rgba(212,175,55,0.15)] bg-[rgba(212,175,55,0.02)] flex items-center justify-center hover:bg-[rgba(212,175,55,0.06)] transition-colors"
              >
                <Plus className="w-6 h-6 text-[rgba(212,175,55,0.3)]" />
              </button>
            )}
          </div>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* مودال هشدار عمومی */}
        <AlertModal
          open={alertMsg !== null}
          message={alertMsg ?? ""}
          variant="error"
          onClose={() => setAlertMsg(null)}
        />
      </div>
    </div>
  );
}
