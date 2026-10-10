"use client";

// بنر اعلان زنده — وقتی اعلان جدید برسد، هرجای برنامه که باشد
// هدری شبیه هدر خانه بالا می آید و توست انیمیشنی از آیکن قلب بیرون می آید
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Heart, X, MessageCircle, ChevronLeft } from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import KandooLogo from "@/components/KandooLogo";
import CoinBadge from "@/components/dashboard/CoinBadge";
import { NOTIF_ICONS, getNotifAction } from "@/components/dashboard/notifConfig";

export type LiveNotif = {
  id: string;
  type: string;
  title: string;
  body: string;
  data: string | null;
};

const AUTO_DISMISS_MS = 8000;

export default function LiveNotifBanner({ notif, onClose }: { notif: LiveNotif | null; onClose: () => void }) {
  if (!notif) return null;
  // key روی id اعلان — state داخلی برای هر اعلان جدید تازه می شود
  return <Banner key={notif.id} notif={notif} onClose={onClose} />;
}

function Banner({ notif, onClose }: { notif: LiveNotif; onClose: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [leaving, setLeaving] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
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

  // اکشن اعلان — گفتگو یا لینک (از کانفیگ مشترک)
  const action = getNotifAction(notif.type, notif.data);

  function markRead() {
    void fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: notif.id }),
    }).catch(() => {});
  }

  async function runAction() {
    if (!action || chatLoading) return;
    if (action.kind === "link") {
      markRead();
      onClose();
      router.push(action.href);
      return;
    }
    setChatLoading(true);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: action.userId }),
      });
      if (res.status === 402) {
        markRead();
        onClose();
        router.push("/dashboard/subscription");
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast(data.error ?? "شروع گفتگو ناموفق بود", "error");
        return;
      }
      const data = await res.json();
      markRead();
      onClose();
      router.push(`/dashboard/chat/${data.conversationId}`);
    } catch {
      toast("خطا در ارتباط با سرور", "error");
    } finally {
      setChatLoading(false);
    }
  }

  function openNotifications() {
    dismiss();
    router.push("/dashboard/notifications");
  }

  const isLike = notif.type === "LIKE" || notif.type === "SUPER_LIKE" || notif.type === "MATCH";
  // آیکون و رنگ بر اساس نوع اعلان (از کانفیگ مشترک)
  const iconStyle = NOTIF_ICONS[notif.type] ?? { icon: Heart, iconCls: "text-white", bgCls: "" };
  const TypeIcon = iconStyle.icon;
  // روی صفحه خانه هدر بنر دقیقا عین هدر خانه است (قلب + لوگو + سکه)
  const isHome = pathname === "/dashboard";

  const heartButton = (
    <button
      onClick={openNotifications}
      aria-label="اعلان ها"
      className="pointer-events-auto relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-ig-divider transition-colors active:scale-95"
    >
      <Heart
        className="w-6 h-6 text-ig-red ig-heart-ring"
        fill="currentColor"
        strokeWidth={1.8}
      />
      <span className="absolute -top-0.5 -end-0.5 w-2.5 h-2.5 rounded-full bg-ig-red ring-2 ring-white ig-pulse" />
    </button>
  );

  return (
    <div className="fixed top-0 inset-x-0 z-[80] pointer-events-none" role="status" aria-live="polite">
      {/* هدر بنر — در صفحه خانه عین هدر اصلی، در بقیه صفحات فقط قلب */}
      <div className="h-14 md:h-16 px-4 md:px-6 flex items-center gap-2 bg-white/80 ig-glass border-b border-ig-border">
        {isHome ? (
          <>
            <div className="flex items-center gap-1.5 flex-1 justify-start min-w-0">{heartButton}</div>
            <div className="flex items-center justify-center shrink-0 pointer-events-auto">
              <KandooLogo href="/dashboard" textClassName="text-3xl" hideIcon />
            </div>
            <div className="flex items-center gap-1.5 flex-1 justify-end min-w-0">
              <div className="pointer-events-auto"><CoinBadge /></div>
            </div>
          </>
        ) : (
          heartButton
        )}
      </div>

      {/* توست انیمیشنی که از زیر آیکن قلب بیرون می آید */}
      <div className="px-4 pt-2 flex justify-start">
        <div
          className={`pointer-events-auto relative w-full max-w-sm bg-ig-toast text-white rounded-2xl shadow-xl ${
            leaving ? "ig-notif-out" : "ig-notif-drop"
          }`}
        >
          {/* دکمه بستن شناور گوشه کارت */}
          <button
            onClick={dismiss}
            aria-label="بستن"
            className="absolute -top-2 -start-2 z-10 w-7 h-7 flex items-center justify-center rounded-full bg-white text-black shadow-md hover:scale-110 active:scale-95 transition"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3 px-4 py-3.5">
            <div className="w-11 h-11 rounded-full bg-white/15 flex items-center justify-center shrink-0">
              <TypeIcon
                className={`w-5 h-5 ${iconStyle.iconCls === "text-foreground" ? "text-white" : iconStyle.iconCls} ${isLike ? "ig-heart-pop" : ""}`}
                fill={isLike ? "currentColor" : "none"}
                strokeWidth={1.8}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold leading-5">{notif.title}</p>
              <p className="text-xs text-white/80 mt-0.5 leading-5">{notif.body}</p>
            </div>
            {/* دکمه اکشن — سمت چپ، روبروی متن */}
            {action && (
              <button
                onClick={runAction}
                disabled={chatLoading}
                className={`shrink-0 inline-flex items-center gap-1.5 h-9 px-4 rounded-full text-xs font-bold active:scale-95 transition-all disabled:opacity-60 ${
                  action.kind === "chat"
                    ? "bg-ig-blue text-white hover:bg-ig-blue-hover"
                    : "bg-white text-black hover:bg-neutral-200"
                }`}
              >
                {action.kind === "chat" ? (
                  <MessageCircle className="w-4 h-4" />
                ) : (
                  <ChevronLeft className="w-4 h-4" />
                )}
                {chatLoading ? "..." : action.label}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
