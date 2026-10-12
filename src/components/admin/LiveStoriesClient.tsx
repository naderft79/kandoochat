"use client";

// استوری زنده — نمایش استوری های فعال در آنالیز لحظه ای
import { useState, useEffect, useCallback } from "react";
import { Eye, Heart, MessageCircle, Clock, Loader2, CircleDot, Check, X } from "lucide-react";
import { toPersianDigits, formatDateTimeCustom } from "@/lib/format";
import DefaultAvatar from "@/components/dashboard/DefaultAvatar";
import UserLink from "@/components/admin/user-modal/UserLink";

type LiveStory = {
  id: string;
  url: string;
  type: string;
  caption: string | null;
  isApproved: boolean;
  createdAt: string;
  expiresAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
    isVerified: boolean;
    gender: string;
    photos: { url: string }[];
  };
  _count: { views: number; likes: number; replies: number };
};

export default function LiveStoriesClient() {
  const [stories, setStories] = useState<LiveStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<LiveStory | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchStories = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/stories?status=all");
      if (!res.ok) return;
      const data = await res.json();
      setStories(data.stories || []);
    } catch {
      // خطا
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStories();
    const interval = setInterval(fetchStories, 10000);
    return () => clearInterval(interval);
  }, [fetchStories]);

  async function handleAction(storyId: string, action: "approve" | "reject") {
    setActionLoading(storyId);
    try {
      const res = await fetch("/api/admin/stories", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storyId, action }),
      });
      if (res.ok) {
        await fetchStories();
      }
    } catch {
      // خطا
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-[#d4af37] animate-spin" />
      </div>
    );
  }

  if (stories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <CircleDot className="w-10 h-10 text-[rgba(212,175,55,0.3)] mb-3" strokeWidth={1.5} />
        <p className="text-sm font-bold text-[#888]">استوری فعالی وجود ندارد</p>
      </div>
    );
  }

  const pendingCount = stories.filter((s) => !s.isApproved).length;

  return (
    <div>
      {/* خلاصه */}
      <div className="flex items-center gap-3 mb-4 text-xs">
        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[rgba(212,175,55,0.08)] text-[#d4af37] font-bold">
          <CircleDot className="w-3.5 h-3.5" />
          {toPersianDigits(stories.length)} استوری فعال
        </span>
        {pendingCount > 0 && (
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[rgba(245,158,11,0.1)] text-[#f59e0b] font-bold">
            <Clock className="w-3.5 h-3.5" />
            {toPersianDigits(pendingCount)} در انتظار
          </span>
        )}
      </div>

      {/* گرید استوری ها */}
      <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
        {stories.map((story) => (
          <div
            key={story.id}
            className="lux-card overflow-hidden"
          >
            <button
              onClick={() => setPreview(story)}
              className="relative w-full aspect-[9/16] bg-[#0d0d0d] overflow-hidden"
            >
              {story.type === "VIDEO" ? (
                <video src={story.url} muted className="w-full h-full object-cover" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={story.url} alt="" className="w-full h-full object-cover" />
              )}
              <span className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ${story.isApproved ? "bg-green-500" : "bg-amber-500"}`} />
              <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/70 to-transparent" />
              <p className="absolute bottom-1.5 right-1.5 text-[10px] text-white font-bold truncate">
                <UserLink userId={story.user.id}>{story.user.firstName}</UserLink>
              </p>
            </button>

            {/* آمار */}
            <div className="flex items-center justify-around px-1.5 py-1.5 border-b border-[rgba(212,175,55,0.08)]">
              <span className="flex items-center gap-0.5 text-[9px] text-[#888]">
                <Eye className="w-3 h-3" />
                {toPersianDigits(story._count.views)}
              </span>
              <span className="flex items-center gap-0.5 text-[9px] text-[#888]">
                <Heart className="w-3 h-3" />
                {toPersianDigits(story._count.likes)}
              </span>
              <span className="flex items-center gap-0.5 text-[9px] text-[#888]">
                <MessageCircle className="w-3 h-3" />
                {toPersianDigits(story._count.replies)}
              </span>
            </div>

            {/* دکمه سریع */}
            {!story.isApproved && (
              <div className="flex gap-1 p-1">
                <button
                  onClick={() => handleAction(story.id, "approve")}
                  disabled={actionLoading === story.id}
                  className="flex-1 flex items-center justify-center py-1 rounded lux-btn-gold transition-all"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleAction(story.id, "reject")}
                  disabled={actionLoading === story.id}
                  className="flex-1 flex items-center justify-center py-1 rounded bg-[rgba(239,68,68,0.1)] text-[#f87171] border border-[rgba(239,68,68,0.2)] hover:bg-[rgba(239,68,68,0.15)] transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* مودال پیش نمایش */}
      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 ig-fade-in"
          onClick={() => setPreview(null)}
        >
          <div
            className="relative max-w-sm w-full mx-4 rounded-2xl overflow-hidden ig-modal-in"
            onClick={(e) => e.stopPropagation()}
          >
            {preview.type === "VIDEO" ? (
              <video src={preview.url} controls autoPlay className="w-full max-h-[80vh] object-contain bg-black" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview.url} alt="" className="w-full max-h-[80vh] object-contain bg-black" />
            )}
            {preview.caption && (
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                <p className="text-sm text-white">{preview.caption}</p>
              </div>
            )}
            <div className="absolute top-3 right-3 flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${preview.isApproved ? "bg-green-500 text-white" : "bg-amber-500 text-white"}`}>
                {preview.isApproved ? "تایید شده" : "در انتظار"}
              </span>
              <button
                onClick={() => setPreview(null)}
                className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            <div className="absolute top-3 left-3 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-white/20">
                {preview.user.photos?.[0]?.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={preview.user.photos[0].url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <DefaultAvatar size={32} />
                )}
              </div>
              <div>
                <p className="text-xs font-bold text-white"><UserLink userId={preview.user.id}>{preview.user.firstName} {preview.user.lastName}</UserLink></p>
                <p className="text-[10px] text-white/70">{formatDateTimeCustom(preview.createdAt)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
