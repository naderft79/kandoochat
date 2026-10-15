"use client";

// توست اعلان زنده — روی همه پلتفرم ها (وب، PWA، اپ اندروید) نمایش داده می شود
// وقتی کاربر داخل اپ است فقط همین توست داخلی می آید، نه نوتیفیکیشن سیستمی گوشی
// توست داخل هدر می آید — حباب کوچکی روبروی دکمه لایک
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { NOTIF_ICONS, DEFAULT_NOTIF_ICON } from "@/components/dashboard/notifConfig";

// توست زنده — نوع آیکن از روی نوع اعلان (یا MESSAGE برای پیام جدید) انتخاب می شود
export type LiveToast = {
  id: string;
  iconKey: string;
  text: string;
  label: string;
  href: string;
};

const AUTO_DISMISS_MS = 5000;

export default function LiveNotifBanner({ toast, onClose }: { toast: LiveToast | null; onClose: () => void }) {
  if (!toast) return null;
  // key روی id اعلان — state داخلی برای هر اعلان جدید تازه می شود
  return <Pill key={toast.id} toast={toast} onClose={onClose} />;
}

function Pill({ toast, onClose }: { toast: LiveToast; onClose: () => void }) {
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
    router.push(toast.href);
  }

  const style = NOTIF_ICONS[toast.iconKey] ?? DEFAULT_NOTIF_ICON;
  const Icon = style.icon;
  const filled = toast.iconKey === "LIKE" || toast.iconKey === "MATCH";

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
          <Icon className={`w-5 h-5 ig-heart-pop ${style.iconCls}`} fill={filled ? "currentColor" : "none"} strokeWidth={1.8} />
          <span className="text-sm font-bold whitespace-nowrap">{toast.text}</span>
          <span className="shrink-0 h-7 px-3 rounded-full bg-ig-blue text-white text-xs font-bold flex items-center justify-center hover:bg-ig-blue-hover transition-colors">
            {toast.label}
          </span>
        </button>
      </div>
    </div>
  );
}
