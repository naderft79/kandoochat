"use client";

// اکشن های پروفایل عمومی: گفتگو آبی + لایک خاکستری + منوی سه نقطه (گزارش/بلاک/کپی لینک)
import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessagesSquare, Heart, Crown, Loader2, MoreHorizontal } from "lucide-react";
import UserActionsSheet from "@/components/dashboard/UserActionsSheet";
import { useToast } from "@/components/ToastProvider";

type Props = {
  targetUserId: string;
  username: string;
  firstName: string;
  initialLiked: boolean;
  loggedIn: boolean;
};

export default function PublicProfileActions({ targetUserId, username, firstName, initialLiked, loggedIn }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [liked, setLiked] = useState(initialLiked);
  const [needSub, setNeedSub] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  async function startChat() {
    if (!loggedIn) { router.push("/login"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId }),
      });
      const data = await res.json();
      // شرط تکمیل پروفایل حذف شد — فقط نیاز به اشتراک (402) بررسی می شود
      if (res.status === 402) { setNeedSub(true); return; }
      if (res.ok && data.conversationId) router.push(`/dashboard/chat/${data.conversationId}`);
    } finally {
      setLoading(false);
    }
  }

  async function sendLike() {
    if (!loggedIn) { router.push("/login"); return; }
    if (liked) return;
    setLiked(true);
    setLikeLoading(true);
    try {
      const res = await fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: targetUserId, type: "LIKE" }),
      });
      const data = await res.json().catch(() => ({}));        if (!res.ok) {
          setLiked(false);
          toast(data.error ?? "لایک ثبت نشد", "error");
        }
    } catch {
      setLiked(false);
      toast("خطا در ارتباط با سرور", "error");
    } finally {
      setLikeLoading(false);
    }
  }

  return (
    <>
      <div className="flex gap-2 mt-4">
        {needSub ? (
          <button
            onClick={() => router.push("/dashboard/subscription")}
            className="flex-1 py-2 rounded-lg bg-ig-blue text-white text-sm font-bold flex items-center justify-center gap-1.5 hover:bg-ig-blue-hover transition-colors"
          >
            <Crown className="w-4 h-4" />
            برای گفتگو اشتراک بخرید
          </button>
        ) : (
          <button
            onClick={startChat}
            disabled={loading}
            className="flex-1 py-2 rounded-lg bg-ig-blue text-white text-sm font-bold flex items-center justify-center gap-1.5 hover:bg-ig-blue-hover transition-colors disabled:opacity-50"
          >
            <MessagesSquare className="w-4 h-4" />
            {loading ? "..." : "گفتگو"}
          </button>
        )}
        <button
          onClick={sendLike}
          disabled={likeLoading}
          className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-1.5 transition-colors active:scale-[0.98] disabled:opacity-50 ${
            liked ? "bg-ig-gray-bg text-foreground" : "bg-ig-btn2 text-foreground hover:bg-ig-btn2-hover"
          }`}
        >
          {likeLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Heart className={`w-4 h-4 ${liked ? "fill-ig-red text-ig-red" : ""}`} />
          )}
          {liked ? "لایک شد" : "لایک"}
        </button>
        <button
          onClick={() => setMenuOpen(true)}
          aria-label="گزینه های بیشتر"
          className="w-11 py-2 rounded-lg bg-ig-btn2 text-foreground flex items-center justify-center hover:bg-ig-btn2-hover transition-colors active:scale-[0.98]"
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      <UserActionsSheet
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        target={{ id: targetUserId, username, firstName }}
      />
    </>
  );
}
