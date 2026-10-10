"use client";

// توست اعلان زنده — فقط وب و PWA؛ در اپ اندروید هیچ توستی داخل برنامه نمی آید
// (اندروید: نوتیف بومی گوشی + بج عددی روی قلب)
// توست داخل هدر می آید — حباب کوچکی روبروی دکمه لایک
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { Capacitor } from "@capacitor/core";

export type LiveNotif = {
  id: string;
  type: string;
  title: string;
  body: string;
  data: string | null;
};

const AUTO_DISMISS_MS = 5000;

export default function LiveNotifBanner({ notif, onClose }: { notif: LiveNotif | null; onClose: () => void }) {
  // نسخه اندروید: توست داخل برنامه کاملا حذف است
  if (Capacitor.isNativePlatform()) return null;
  if (!notif) return null;
  // key روی id اعلان — state داخلی برای هر اعلان جدید تازه می شود
  return <Pill key={notif.id} onClose={onClose} />;
}

function Pill({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    setLeaving(true);
    setTimeout(onClose, 250);
  }, [onClose]);

  // بستن خودکار پس از چند ثانیه
  useEffect(() => {
    timer.current = setTimeout(dismiss, AUTO_DISMISS_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [dismiss]);

  function view() {
    dismiss();
    router.push("/dashboard/notifications");
  }

  return (
    // لایه هم‌پوشان روی هدر — فقط حباب کلیک می گیرد
    <div
      className="fixed top-0 inset-x-0 z-[80] pointer-events-none"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
      role="status"
      aria-live="polite"
    >
      {/* همان ارتفاع و پدینگ هدر — حباب دقیقا روبروی دکمه لایک (سمت راست/شروع) می ایستد */}
      <div className="h-14 md:h-16 px-4 md:px-6 flex items-center justify-start">
        <button
          onClick={view}
          className={`pointer-events-auto inline-flex items-center gap-2 h-10 ps-3 pe-2 rounded-full bg-ig-toast text-white shadow-xl active:scale-95 transition-transform ${
            leaving ? "ig-notif-out" : "ig-notif-drop"
          }`}
        >
          <Heart className="w-5 h-5 text-ig-red ig-heart-pop" fill="currentColor" strokeWidth={1.8} />
          <span className="text-sm font-bold whitespace-nowrap">پیامی جدید دارید</span>
          <span className="shrink-0 h-7 px-3 rounded-full bg-ig-blue text-white text-xs font-bold flex items-center justify-center hover:bg-ig-blue-hover transition-colors">
            مشاهده
          </span>
        </button>
      </div>
    </div>
  );
}
