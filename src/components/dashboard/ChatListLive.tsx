"use client";

// تازه سازی زنده لیست گفتگوها — با رسیدن پیام جدید از SSE، سرور کامپوننت
// دوباره رندر می شود تا آخرین پیام، ترتیب و تعداد نخوانده بلافاصله درست شود
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useLiveData } from "@/components/dashboard/LiveDataProvider";

export default function ChatListLive() {
  const { lastMessage } = useLiveData();
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!lastMessage) return;
    // دیبونس — با پیام های پشت سر هم فقط یک بار تازه سازی می شود
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      timer.current = null;
      router.refresh();
    }, 800);
  }, [lastMessage, router]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  return null;
}
