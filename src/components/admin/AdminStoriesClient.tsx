"use client";

// پنل مدیریت استوری: تایید/رد استوری + استوری زنده
import { useState, useEffect, useCallback } from "react";
import { Check, X, Eye, Heart, MessageCircle, Clock, Loader2, CircleDot, AlertCircle } from "lucide-react";
import { toPersianDigits, formatDateTimeCustom } from "@/lib/format";
import DefaultAvatar from "@/components/dashboard/DefaultAvatar";
import RejectReasonModal from "@/components/admin/RejectReasonModal";

type StoryItem = {
  id: string;
  url: string;
  type: string;
  caption: string | null;
  isApproved: boolean;
  isRejected: boolean;
  rejectReason: string | null;
  createdAt: string;
  expiresAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
    phone: string;
    isVerified: boolean;
    gender: string;
    photos: { url: string }[];
  };
  _count: { views: number; likes: number; replies: number };
};

export default function AdminStoriesClient() {
  const [stories, setStories] = useState<StoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"pending" | "approved" | "rejected" | "deleted" | "expired" | "all">("pending");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [previewStory, setPreviewStory] = useState<StoryItem | null>(null);
  const [stats, setStats] = useState<{ total: number; pending: number; approved: number; rejected: number; deleted: number; expired: number } | null>(null);
  const [rejectModal, setRejectModal] = useState<{ storyId: string } | null>(null);
  const [rejecting, setRejecting] = useState(false);

  const fetchStories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/stories?status=${status}`);
      if (!res.ok) return;
      const data = await res.json();
      setStories(data.stories || []);
      setStats(data.stats || null);
    } catch {
      // خطا
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  async function handleAction(storyId: string, action: "approve" | "reject", reason?: string) {
    setActionLoading(storyId);
    try {
      const res = await fetch("/api/admin/stories", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storyId, action, reason }),
      });
      if (res.ok) {
        if (action === "reject") {
          setStories((prev) =>
            prev.map((s) => (s.id === storyId ? { ...s, isRejected: true } : s))
          );
        } else {
          setStories((prev) =>
            prev.map((s) => (s.id === storyId ? { ...s, isApproved: true } : s))
          );
        }
      }
    } catch {
      // خطا
    } finally {
      setActionLoading(null);
    }
  }

  const tabs = [
    { key: "all" as const, label: "همه" },
    { key: "pending" as const, label: "در انتظار" },
    { key: "approved" as const, label: "تایید شده" },
    { key: "rejected" as const, label: "رد شده" },
    { key: "deleted" as const, label: "حذف شده" },
    { key: "expired" as const, label: "اتمام تایم" },
  ];

  return (
    <div className="space-y-4">
      {/* هدر + آمار */}
      <div className="lux-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-black text-[#e8e8e8] flex items-center gap-2">
              <CircleDot className="w-5 h-5 text-[#d4af37]" />
              مدیریت استوری ها
            </h1>
            <p className="text-[#888] mt-1 text-xs">تایید، رد و مشاهده استوری های کاربران</p>
          </div>
          {stats && (
            <div className="hidden sm:flex gap-2">
              <div className="lux-card px-3 py-2 text-center min-w-[80px]">
                <p className="text-[10px] text-[#888]">همه</p>
                <p className="text-sm font-black text-[#d4af37]">{toPersianDigits(stats.total)}</p>
              </div>
              <div className="lux-card px-3 py-2 text-center min-w-[80px]">
                <p className="text-[10px] text-[#888]">در انتظار</p>
                <p className="text-sm font-black text-[#f87171]">{toPersianDigits(stats.pending)}</p>
              </div>
              <div className="lux-card px-3 py-2 text-center min-w-[80px]">
                <p className="text-[10px] text-[#888]">تایید شده</p>
                <p className="text-sm font-black text-[#4ade80]">{toPersianDigits(stats.approved)}</p>
              </div>
              <div className="lux-card px-3 py-2 text-center min-w-[80px]">
                <p className="text-[10px] text-[#888]">رد شده</p>
                <p className="text-sm font-black text-[#f87171]">{toPersianDigits(stats.rejected)}</p>
              </div>
              <div className="lux-card px-3 py-2 text-center min-w-[80px]">
                <p className="text-[10px] text-[#888]">حذف شده</p>
                <p className="text-sm font-black text-[#888]">{toPersianDigits(stats.deleted)}</p>
              </div>
              <div className="lux-card px-3 py-2 text-center min-w-[80px]">
                <p className="text-[10px] text-[#888]">اتمام تایم</p>
                <p className="text-sm font-black text-[#a78bfa]">{toPersianDigits(stats.expired)}</p>
              </div>
            </div>
          )}
        </div>
        {stats && (
          <div className="flex sm:hidden gap-2 mt-3">
            <div className="flex-1 lux-card px-2 py-1.5 text-center">
              <p className="text-[9px] text-[#888]">همه</p>
              <p className="text-xs font-black text-[#d4af37]">{toPersianDigits(stats.total)}</p>
            </div>
            <div className="flex-1 lux-card px-2 py-1.5 text-center">
              <p className="text-[9px] text-[#888]">در انتظار</p>
              <p className="text-xs font-black text-[#f87171]">{toPersianDigits(stats.pending)}</p>
            </div>
            <div className="flex-1 lux-card px-2 py-1.5 text-center">
              <p className="text-[9px] text-[#888]">تایید شده</p>
              <p className="text-xs font-black text-[#4ade80]">{toPersianDigits(stats.approved)}</p>
            </div>
            <div className="flex-1 lux-card px-2 py-1.5 text-center">
              <p className="text-[9px] text-[#888]">رد شده</p>
              <p className="text-xs font-black text-[#f87171]">{toPersianDigits(stats.rejected)}</p>
            </div>
            <div className="flex-1 lux-card px-2 py-1.5 text-center">
              <p className="text-[9px] text-[#888]">حذف شده</p>
              <p className="text-xs font-black text-[#888]">{toPersianDigits(stats.deleted)}</p>
            </div>
            <div className="flex-1 lux-card px-2 py-1.5 text-center">
              <p className="text-[9px] text-[#888]">اتمام تایم</p>
              <p className="text-xs font-black text-[#a78bfa]">{toPersianDigits(stats.expired)}</p>
            </div>
          </div>
        )}
      </div>

      {/* تب ها */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {tabs.map((tab) => {
          const active = status === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setStatus(tab.key)}
              className={`shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                active ? "lux-btn-gold border-transparent" : "lux-card text-[#888] hover:text-[#d4af37]"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* لیست استوری ها */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#d4af37] animate-spin" />
        </div>
      ) : stories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <AlertCircle className="w-12 h-12 mb-2 text-[rgba(212,175,55,0.3)]" />
          <p className="text-sm font-bold text-[#e8e8e8] mb-1">استوری ای وجود ندارد</p>
          <p className="text-xs text-[#666]">در این بخش استوری ای یافت نشد</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {stories.map((story) => (
            <div
              key={story.id}
              className="lux-card overflow-hidden"
            >
              {/* پیش نمایش */}
              <button
                onClick={() => setPreviewStory(story)}
                className="relative w-full aspect-[9/16] bg-[#0d0b14] overflow-hidden"
              >
                {story.type === "VIDEO" ? (
                  <video
                    src={story.url}
                    muted
                    className="w-full h-full object-cover"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={story.url} alt={story.user.firstName} className="w-full h-full object-cover" />
                )}
                {/* نشان تایید/عدم تایید */}
                <span className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  story.isApproved ? "bg-green-500 text-white" : story.isRejected ? "bg-red-500 text-white" : "bg-amber-500 text-white"
                }`}>
                  {story.isApproved ? "تایید شده" : story.isRejected ? "رد شده" : "در انتظار"}
                </span>
                {/* گرادیان پایین */}
                <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/70 to-transparent" />
                {/* اطلاعات کاربر */}
                <div className="absolute bottom-2 right-2 left-2 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full overflow-hidden bg-white/20 shrink-0">
                    {story.user.photos?.[0]?.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={story.user.photos[0].url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <DefaultAvatar size={28} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{story.user.firstName} {story.user.lastName}</p>
                    <p className="text-[10px] text-white/70 truncate">@{story.user.username}</p>
                  </div>
                </div>
              </button>

              {/* آمار */}
              <div className="flex items-center justify-between px-3 py-2 border-b border-[rgba(212,175,55,0.08)]">
                <span className="flex items-center gap-1 text-[10px] text-[#888]">
                  <Eye className="w-3.5 h-3.5" />
                  {toPersianDigits(story._count.views)}
                </span>
                <span className="flex items-center gap-1 text-[10px] text-[#888]">
                  <Heart className="w-3.5 h-3.5" />
                  {toPersianDigits(story._count.likes)}
                </span>
                <span className="flex items-center gap-1 text-[10px] text-[#888]">
                  <MessageCircle className="w-3.5 h-3.5" />
                  {toPersianDigits(story._count.replies)}
                </span>
                <span className="flex items-center gap-1 text-[10px] text-[#888]">
                  <Clock className="w-3.5 h-3.5" />
                  {formatDateTimeCustom(story.createdAt).split(" - ")[1]}
                </span>
              </div>

              {/* دکمه ها — فقط روی دسکتاپ بزرگ */}
              <div className="hidden xl:flex gap-2 p-2">
                {!story.isApproved && !story.isRejected && (
                  <button
                    onClick={() => handleAction(story.id, "approve")}
                    disabled={actionLoading === story.id}
                    className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg lux-btn-gold text-xs font-bold disabled:opacity-50"
                  >
                    {actionLoading === story.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    تایید
                  </button>
                )}
                {!story.isRejected && (
                  <button
                    onClick={() => setRejectModal({ storyId: story.id })}
                    disabled={actionLoading === story.id}
                    className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-[rgba(239,68,68,0.1)] text-[#f87171] border border-[rgba(239,68,68,0.2)] text-xs font-bold hover:bg-[rgba(239,68,68,0.15)] transition-all disabled:opacity-50"
                  >
                    {actionLoading === story.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <X className="w-4 h-4" />
                    )}
                    {story.isApproved ? "حذف" : "رد"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* مودال پیش نمایش */}
      {previewStory && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 ig-fade-in"
          onClick={() => setPreviewStory(null)}
        >
          <div
            className="relative max-w-sm w-full mx-4 rounded-2xl overflow-hidden ig-modal-in"
            onClick={(e) => e.stopPropagation()}
          >
            {previewStory.type === "VIDEO" ? (
              <video src={previewStory.url} controls autoPlay className="w-full max-h-[80vh] object-contain bg-black" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewStory.url} alt="" className="w-full max-h-[80vh] object-contain bg-black" />
            )}
            {previewStory.caption && (
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                <p className="text-sm text-white">{previewStory.caption}</p>
              </div>
            )}
            <button
              onClick={() => setPreviewStory(null)}
              className="absolute top-3 left-3 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* دکمه های تایید/رد داخل مودال */}
          <div className="flex gap-2 p-3 bg-[#12101c]">
            {!previewStory.isApproved && !previewStory.isRejected && (
              <button
                onClick={() => handleAction(previewStory.id, "approve")}
                disabled={actionLoading === previewStory.id}
                className="flex-1 py-3 rounded-xl lux-btn-gold text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {actionLoading === previewStory.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                تایید
              </button>
            )}
            {!previewStory.isRejected && (
              <button
                onClick={() => { setRejectModal({ storyId: previewStory.id }); }}
                disabled={actionLoading === previewStory.id}
                className="flex-1 py-3 rounded-xl bg-[rgba(239,68,68,0.1)] text-[#f87171] border border-[rgba(239,68,68,0.2)] text-sm font-bold hover:bg-[rgba(239,68,68,0.15)] transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {actionLoading === previewStory.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                {previewStory.isApproved ? "حذف" : "رد"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* مودال دلیل رد */}
      <RejectReasonModal
        open={!!rejectModal}
        onClose={() => setRejectModal(null)}
        loading={rejecting}
        title="رد استوری"
        onConfirm={async (reason) => {
          if (!rejectModal) return;
          setRejecting(true);
          await handleAction(rejectModal.storyId, "reject", reason);
          setRejecting(false);
          setRejectModal(null);
        }}
      />
    </div>
  );
}
