"use client";

// دکمه شروع گفتگو با مدیریت خطای نیاز به اشتراک
import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessagesSquare, Crown } from "lucide-react";

export default function StartChatButton({ targetUserId }: { targetUserId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [needSub, setNeedSub] = useState(false);

  async function startChat() {
    setLoading(true);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId }),
      });
      const data = await res.json();
      // شرط تکمیل پروفایل حذف شد — فقط نیاز به اشتراک (402) بررسی می شود
      if (res.status === 402) {
        setNeedSub(true);
        return;
      }
      if (res.ok && data.conversationId) {
        router.push(`/dashboard/chat/${data.conversationId}`);
      }
    } finally {
      setLoading(false);
    }
  }

  if (needSub) {
    return (
      <button
        onClick={() => router.push("/dashboard/subscription")}
        className="w-full py-2.5 rounded-xl bg-ig-blue text-white text-sm font-black flex items-center justify-center gap-1.5 hover:bg-ig-blue transition-all"
      >
        <Crown className="w-4 h-4" />
        برای گفتگو اشتراک بخرید
      </button>
    );
  }

  return (
    <>
    <button
      onClick={startChat}
      disabled={loading}
      className="w-full py-2.5 rounded-xl bg-ig-blue text-white text-sm font-black flex items-center justify-center gap-1.5 hover:bg-ig-blue transition-colors disabled:opacity-50"
    >
      <MessagesSquare className="w-4 h-4" />
      {loading ? "..." : "شروع گفتگو"}
    </button>
    </>
  );
}
