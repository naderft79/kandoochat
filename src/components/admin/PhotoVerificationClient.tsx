"use client";

// مدیریت تایید عکس های کاربران توسط ادمین
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, ZoomIn, Loader2, BadgeCheck, AlertCircle, ChevronRight, ChevronLeft, Image as ImageIcon } from "lucide-react";
import RejectReasonModal from "@/components/admin/RejectReasonModal";
import { toPersianDigits } from "@/lib/format";

type UserInfo = {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  gender: string;
};

type Photo = {
  id: string;
  url: string;
  isVerified: boolean;
  isRejected: boolean;
  createdAt: string;
  order?: number;
  user?: UserInfo;
};

type GalleryGroup = {
  userId: string;
  user: UserInfo;
  photos: Photo[];
};

type Stats = {
  totalProfile: number;
  unverifiedProfile: number;
  totalGallery: number;
  unverifiedGallery: number;
  profileTotal: number;
  galleryTotal: number;
  page: number;
  profilePageSize: number;
  galleryPageSize: number;
  totalPages: number;
  global?: {
    total: number;
    unverified: number;
    verified: number;
    rejected: number;
    deleted: number;
    profileUnverified: number;
    galleryUnverified: number;
  };
};

export default function PhotoVerificationClient() {
  const [profilePhotos, setProfilePhotos] = useState<Photo[]>([]);
  const [galleryGroups, setGalleryGroups] = useState<GalleryGroup[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unverified" | "verified" | "rejected" | "deleted">("unverified");
  const [zoomPhoto, setZoomPhoto] = useState<Photo | null>(null);
  const [zoomUser, setZoomUser] = useState<UserInfo | null>(null);
  const [acting, setActing] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [rejectModal, setRejectModal] = useState<{ photoId: string; user?: UserInfo } | null>(null);
  const [rejecting, setRejecting] = useState(false);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch(`/api/admin/photos?filter=${filter}&page=${page}&profilePageSize=250&galleryPageSize=50`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setProfilePhotos(data.profilePhotos);
      setGalleryGroups(data.galleryGroups);
      setStats(data.stats);
      setTotalPages(data.stats.totalPages);
    } catch {
      // خطا
    } finally {
      if (!silent) setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => {
    setPage(1);
  }, [filter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleAction(photoId: string, action: "approve" | "reject", reason?: string) {
    setActing(photoId);
    try {
      const res = await fetch("/api/admin/photos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoId, action, reason }),
      });
      if (!res.ok) throw new Error();
      // به روز رسانی محلی بدون رفرش کامل
      if (action === "reject") {
        const updatePhoto = (p: Photo) => p.id === photoId ? { ...p, isVerified: false, isRejected: true } : p;
        setProfilePhotos((prev) => prev.map(updatePhoto));
        setGalleryGroups((prev) => prev.map((g) => ({ ...g, photos: g.photos.map(updatePhoto) })));
      } else {
        const updatePhoto = (p: Photo) => p.id === photoId ? { ...p, isVerified: true, isRejected: false } : p;
        setProfilePhotos((prev) => prev.map(updatePhoto));
        setGalleryGroups((prev) => prev.map((g) => ({ ...g, photos: g.photos.map(updatePhoto) })));
      }
      // رفرش آمار به صورت خاموش
      fetchData(true);
      if (zoomPhoto?.id === photoId) {
        if (action === "reject") {
          setZoomPhoto(null);
        } else {
          setZoomPhoto({ ...zoomPhoto, isVerified: true });
        }
      }
    } catch {
      // خطا
    } finally {
      setActing(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* هدر + آمار */}
      <div className="lux-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-black text-[#e8e8e8] flex items-center gap-2">
              <BadgeCheck className="w-5 h-5 text-[#d4af37]" />
              تایید عکس
            </h1>
            <p className="text-[#888] mt-1 text-xs">تایید عکس های پروفایل و گالری کاربران</p>
          </div>
          {stats?.global && (
            <div className="hidden sm:flex gap-2">
              <div className="lux-card px-3 py-2 text-center min-w-[80px]">
                <p className="text-[10px] text-[#888]">همه</p>
                <p className="text-sm font-black text-[#d4af37]">{toPersianDigits(stats.global.total)}</p>
              </div>
              <div className="lux-card px-3 py-2 text-center min-w-[80px]">
                <p className="text-[10px] text-[#888]">در انتظار</p>
                <p className="text-sm font-black text-[#f87171]">{toPersianDigits(stats.global.unverified)}</p>
              </div>
              <div className="lux-card px-3 py-2 text-center min-w-[80px]">
                <p className="text-[10px] text-[#888]">تایید شده</p>
                <p className="text-sm font-black text-[#4ade80]">{toPersianDigits(stats.global.verified)}</p>
              </div>
              <div className="lux-card px-3 py-2 text-center min-w-[80px]">
                <p className="text-[10px] text-[#888]">رد شده</p>
                <p className="text-sm font-black text-[#f87171]">{toPersianDigits(stats.global.rejected)}</p>
              </div>
              <div className="lux-card px-3 py-2 text-center min-w-[80px]">
                <p className="text-[10px] text-[#888]">حذف شده</p>
                <p className="text-sm font-black text-[#888]">{toPersianDigits(stats.global.deleted)}</p>
              </div>
            </div>
          )}
        </div>
        {stats?.global && (
          <div className="flex sm:hidden gap-2 mt-3">
            <div className="flex-1 lux-card px-2 py-1.5 text-center">
              <p className="text-[9px] text-[#888]">همه</p>
              <p className="text-xs font-black text-[#d4af37]">{toPersianDigits(stats.global.total)}</p>
            </div>
            <div className="flex-1 lux-card px-2 py-1.5 text-center">
              <p className="text-[9px] text-[#888]">در انتظار</p>
              <p className="text-xs font-black text-[#f87171]">{toPersianDigits(stats.global.unverified)}</p>
            </div>
            <div className="flex-1 lux-card px-2 py-1.5 text-center">
              <p className="text-[9px] text-[#888]">تایید شده</p>
              <p className="text-xs font-black text-[#4ade80]">{toPersianDigits(stats.global.verified)}</p>
            </div>
            <div className="flex-1 lux-card px-2 py-1.5 text-center">
              <p className="text-[9px] text-[#888]">رد شده</p>
              <p className="text-xs font-black text-[#f87171]">{toPersianDigits(stats.global.rejected)}</p>
            </div>
            <div className="flex-1 lux-card px-2 py-1.5 text-center">
              <p className="text-[9px] text-[#888]">حذف شده</p>
              <p className="text-xs font-black text-[#888]">{toPersianDigits(stats.global.deleted)}</p>
            </div>
          </div>
        )}
      </div>

      {/* فیلتر */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {[
          { key: "all" as const, label: "همه" },
          { key: "unverified" as const, label: "در انتظار" },
          { key: "verified" as const, label: "تایید شده" },
          { key: "rejected" as const, label: "رد شده" },
          { key: "deleted" as const, label: "حذف شده" },
        ].map((f) => {
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                active ? "lux-btn-gold border-transparent" : "lux-card text-[#888] hover:text-[#d4af37]"
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#d4af37] animate-spin" />
        </div>
      )}

      {!loading && profilePhotos.length === 0 && galleryGroups.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-[#666]">
          <AlertCircle className="w-12 h-12 mb-2 text-[rgba(212,175,55,0.3)]" />
          <p className="text-sm font-bold">عکسی برای نمایش وجود ندارد</p>
        </div>
      )}

      {/* دو ستون همزمان */}
      {!loading && (profilePhotos.length > 0 || galleryGroups.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* ستون اول: عکس های پروفایل */}
          <div className="space-y-3">
            <h2 className="text-sm font-black text-[#d4af37] sticky top-0 bg-[#12101c] py-2 z-10 border-b border-[rgba(212,175,55,0.1)]">
              عکس های پروفایل ({profilePhotos.length})
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {profilePhotos.map((photo, i) => (
                <PhotoCard
                  key={photo.id}
                  photo={photo}
                  user={photo.user}
                  acting={acting}
                  onZoom={() => { setZoomPhoto(photo); setZoomUser(photo.user ?? null); }}
                  onAction={handleAction}
                  onReject={(photoId, user) => setRejectModal({ photoId, user })}
                  index={i}
                />
              ))}
            </div>
            {profilePhotos.length === 0 && (
              <p className="text-xs text-[#666] text-center py-8">عکس پروفایلی وجود ندارد</p>
            )}
          </div>

          {/* ستون دوم: عکس های گالری */}
          <div className="space-y-3">
            <h2 className="text-sm font-black text-[#d4af37] sticky top-0 bg-[#12101c] py-2 z-10 border-b border-[rgba(212,175,55,0.1)]">
              عکس های گالری ({galleryGroups.length} کاربر)
            </h2>
            <div className="space-y-3">
              {galleryGroups.map((group, gi) => (
                <div key={group.userId} className="lux-card p-3">
                  <p className="text-xs font-bold text-[#e8e8e8] mb-2">
                    {group.user.firstName} {group.user.lastName}
                    <span className="text-[#888] font-normal mr-1">@{group.user.username}</span>
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {group.photos.map((photo, pi) => (
                      <PhotoCard
                        key={photo.id}
                        photo={photo}
                        acting={acting}
                        onZoom={() => { setZoomPhoto(photo); setZoomUser(group.user); }}
                        onAction={handleAction}
                        onReject={(photoId) => setRejectModal({ photoId, user: group.user })}
                        index={pi}
                      />
                    ))}
                    {/* اسلات های خالی */}
                    {Array.from({ length: 3 - group.photos.length }).map((_, i) => (
                      <div key={`empty-${i}`} className="aspect-square rounded-lg border border-dashed border-[rgba(212,175,55,0.1)] bg-[rgba(212,175,55,0.02)]" />
                    ))}
                  </div>
                </div>
              ))}
              {galleryGroups.length === 0 && (
                <p className="text-xs text-[#666] text-center py-8">عکس گالری وجود ندارد</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* صفحه بندی */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 py-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="w-9 h-9 rounded-lg lux-btn-outline flex items-center justify-center disabled:opacity-30"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-[#888]">
            صفحه {page} از {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="w-9 h-9 rounded-lg lux-btn-outline flex items-center justify-center disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* مودال بزرگنمایی */}
      <AnimatePresence>
        {zoomPhoto && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80"
              onClick={() => setZoomPhoto(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative lux-card max-w-md w-full overflow-hidden"
            >
              {/* هدر */}
              <div className="flex items-center justify-between p-3 border-b border-[rgba(212,175,55,0.1)]">
                <div>
                  {zoomUser && (
                    <p className="text-sm font-bold text-[#e8e8e8]">
                      {zoomUser.firstName} {zoomUser.lastName}
                    </p>
                  )}
                  <p className="text-[10px] text-[#888]">
                    {zoomPhoto.isVerified ? "تایید شده" : zoomPhoto.isRejected ? "رد شده" : "تایید نشده"}
                  </p>
                </div>
                <button
                  onClick={() => setZoomPhoto(null)}
                  className="w-8 h-8 rounded-full bg-[rgba(212,175,55,0.08)] hover:bg-[rgba(212,175,55,0.15)] flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-[#888]" />
                </button>
              </div>

              {/* عکس بزرگ */}
              <div className="relative w-full aspect-square bg-[#0d0b14]">
                <Image src={zoomPhoto.url} alt="عکس" fill className="object-cover" sizes="(max-width: 768px) 90vw, 448px" priority />
                {zoomPhoto.isVerified && (
                  <div className="absolute top-3 right-3 w-10 h-10 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
                    <Check className="w-6 h-6 text-white" strokeWidth={3} />
                  </div>
                )}
              </div>

              {/* دکمه های تایید/عدم تایید */}
              <div className="flex gap-2 p-3">
                <button
                  onClick={() => {
                    setRejectModal({ photoId: zoomPhoto.id, user: zoomUser ?? undefined });
                  }}
                  disabled={acting === zoomPhoto.id}
                  className="flex-1 py-3 rounded-xl bg-[rgba(239,68,68,0.1)] text-[#f87171] border border-[rgba(239,68,68,0.2)] text-sm font-bold hover:bg-[rgba(239,68,68,0.15)] transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {acting === zoomPhoto.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                  عدم تایید
                </button>
                <button
                  onClick={() => handleAction(zoomPhoto.id, "approve")}
                  disabled={acting === zoomPhoto.id}
                  className="flex-1 py-3 rounded-xl lux-btn-gold text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {acting === zoomPhoto.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  تایید
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* مودال دلیل رد */}
      <RejectReasonModal
        open={!!rejectModal}
        onClose={() => setRejectModal(null)}
        loading={rejecting}
        onConfirm={async (reason) => {
          if (!rejectModal) return;
          setRejecting(true);
          await handleAction(rejectModal.photoId, "reject", reason);
          setRejecting(false);
          setRejectModal(null);
          if (zoomPhoto?.id === rejectModal.photoId) {
            setZoomPhoto(null);
          }
        }}
      />
    </div>
  );
}

function PhotoCard({
  photo,
  user,
  acting,
  onZoom,
  onAction,
  onReject,
  index,
}: {
  photo: Photo;
  user?: UserInfo;
  acting: string | null;
  onZoom: () => void;
  onAction: (id: string, action: "approve" | "reject") => void;
  onReject: (photoId: string, user?: UserInfo) => void;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.03 }}
      className="relative aspect-square rounded-lg overflow-hidden border border-[rgba(212,175,55,0.15)] group bg-[#0d0b14]"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <Image src={photo.url} alt="عکس" fill className="object-cover" sizes="120px" />

      {/* تیک تایید */}
      {photo.isVerified && (
        <div className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-green-500 flex items-center justify-center shadow-lg z-10">
          <Check className="w-4 h-4 text-white" strokeWidth={3} />
        </div>
      )}

      {/* نشان رد شده */}
      {photo.isRejected && (
        <div className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-red-500 flex items-center justify-center shadow-lg z-10">
          <X className="w-4 h-4 text-white" strokeWidth={3} />
        </div>
      )}

      {/* نام کاربر زیر عکس */}
      {user && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-1 py-0.5">
          <p className="text-[9px] text-white font-bold truncate text-center">{user.firstName} {user.lastName}</p>
        </div>
      )}

      {/* overlay اکشن ها — فقط روی دسکتاپ بزرگ با hover */}
      <div className="hidden xl:flex absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex-col items-center justify-center gap-1.5">
        <button
          onClick={onZoom}
          className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
        >
          <ZoomIn className="w-4 h-4 text-white" />
        </button>
        <div className="flex gap-1.5">
          <button
            onClick={() => onReject(photo.id, user)}
            disabled={acting === photo.id}
            className="w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors disabled:opacity-50"
          >
            {acting === photo.id ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <X className="w-4 h-4 text-white" />}
          </button>
          <button
            onClick={() => onAction(photo.id, "approve")}
            disabled={acting === photo.id}
            className="w-8 h-8 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center transition-colors disabled:opacity-50"
          >
            {acting === photo.id ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Check className="w-4 h-4 text-white" />}
          </button>
        </div>
      </div>

      {/* روی موبایل/تبلت فقط بزرگنمایی */}
      <button
        onClick={onZoom}
        className="xl:hidden absolute inset-0 flex items-center justify-center"
      >
        <div className="w-9 h-9 rounded-full bg-black/50 flex items-center justify-center">
          <ZoomIn className="w-5 h-5 text-white" />
        </div>
      </button>
    </motion.div>
  );
}
