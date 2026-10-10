"use client";

// اکشن های مشترک کارت/پروفایل کاربران: لایک (optimistic با بازگشت در خطا) و شروع گفتگو
import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ToastProvider";
import { hapticTap } from "@/lib/native";

export function useLike(receiverId: string, initial = false) {
  const { toast } = useToast();
  const [liked, setLiked] = useState(initial);
  const [incomplete, setIncomplete] = useState<string[] | null>(null);
  const [matched, setMatched] = useState(false);
  const busy = useRef(false);

  // لایک یک طرفه است — هیچ مسیر کلاینتی برای برداشتن لایک وجود ندارد
  const like = useCallback(async () => {
    if (busy.current || liked) return;
    busy.current = true;
    setLiked(true);
    void hapticTap("medium");
    try {
      const res = await fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId, type: "LIKE" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setLiked(false);
        if (res.status === 403 && data.error === "PROFILE_INCOMPLETE") setIncomplete(data.missing ?? []);
        else toast(data.error ?? "ثبت لایک ناموفق بود", "error");
      } else if (data.isMatch) {
        setMatched(true);
        void hapticTap("success");
      }
    } catch {
      setLiked(false);
      toast("خطا در ارتباط با سرور", "error");
    } finally {
      busy.current = false;
    }
  }, [liked, receiverId, toast]);

  return {
    liked,
    like,
    // لایک غیرقابل بازگشت است — کلیک روی «لایک شد» کاری نمی کند
    toggle: () => {
      if (!liked) void like();
    },
    incomplete,
    clearIncomplete: () => setIncomplete(null),
    matched,
    clearMatched: () => setMatched(false),
  };
}

export function useStartChat(targetUserId: string) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const start = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId }),
      });
      const data = await res.json().catch(() => ({}));
      // شرط تکمیل پروفایل حذف شد — فقط نیاز به اشتراک (402) بررسی می شود
      if (res.status === 402) return router.push("/dashboard/subscription");
      if (res.ok && data.conversationId) return router.push(`/dashboard/chat/${data.conversationId}`);
      toast(data.error ?? "شروع گفتگو ناموفق بود", "error");
    } catch {
      toast("خطا در ارتباط با سرور", "error");
    } finally {
      setLoading(false);
    }
  }, [loading, router, targetUserId, toast]);

  return { start, loading };
}
