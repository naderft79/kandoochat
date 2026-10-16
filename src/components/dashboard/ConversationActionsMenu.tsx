"use client";

// منوی اکشن گفتگو — نگه داشتن روی ردیف کاربر (یا راست کلیک در دسکتاپ) این شیت را باز می کند
// اکشن ها: دیدن پروفایل، لایک، انتقال سکه، بلاک، گزارش و حذف گفتگو
import { useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  UserRound,
  Heart,
  Coins,
  Ban,
  Flag,
  Trash2,
  Loader2,
  AlertCircle,
  Shield,
} from "lucide-react";
import { BottomSheet } from "@/components/ui/Modal";
import DefaultAvatar from "@/components/dashboard/DefaultAvatar";
import VerifiedBadge from "@/components/dashboard/VerifiedBadge";
import { useToast } from "@/components/ToastProvider";
import Input from "@/components/ui/Input";
import { normalizeDigits } from "@/lib/format";

type Mode = "menu" | "transfer" | "block" | "report" | "delete";

const REPORT_REASONS = [
  { value: "HARASSMENT", label: "آزار و اذیت" },
  { value: "FAKE_PROFILE", label: "پروفایل جعلی" },
  { value: "INAPPROPRIATE_CONTENT", label: "محتوای نامناسب" },
  { value: "SCAM", label: "کلاهبرداری" },
  { value: "OTHER", label: "سایر" },
] as const;

const LONG_PRESS_MS = 500;
const MOVE_CANCEL_PX = 10;

export default function ConversationActionsMenu({
  conversationId,
  targetId,
  targetName,
  targetUsername,
  targetPhoto,
  targetVerified,
  isAdminProfile,
  isDeletedAccount = false,
  children,
}: {
  conversationId: string;
  targetId: string;
  targetName: string;
  targetUsername: string | null;
  targetPhoto: string | null;
  targetVerified: boolean;
  isAdminProfile: boolean;
  isDeletedAccount?: boolean;
  children: ReactNode;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("menu");
  const [loading, setLoading] = useState(false);
  const [coins, setCoins] = useState("");
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");

  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openedByPress = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });

  function openMenu() {
    setMode("menu");
    setCoins("");
    setReportReason("");
    setReportDetails("");
    setOpen(true);
  }

  function cancelPress() {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  }

  function onPointerDown(e: React.PointerEvent) {
    startPos.current = { x: e.clientX, y: e.clientY };
    openedByPress.current = false;
    cancelPress();
    pressTimer.current = setTimeout(() => {
      openedByPress.current = true;
      try {
        navigator.vibrate?.(15);
      } catch {}
      openMenu();
    }, LONG_PRESS_MS);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!pressTimer.current) return;
    const dx = e.clientX - startPos.current.x;
    const dy = e.clientY - startPos.current.y;
    if (Math.abs(dx) > MOVE_CANCEL_PX || Math.abs(dy) > MOVE_CANCEL_PX) cancelPress();
  }

  // جلوگیری از باز شدن چت بعد از لانگ پرس
  function onClickCapture(e: React.MouseEvent) {
    if (openedByPress.current) {
      openedByPress.current = false;
      e.preventDefault();
      e.stopPropagation();
    }
  }

  async function like() {
    setLoading(true);
    try {
      const res = await fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: targetId, type: "LIKE" }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toast(data.match ? "لایک شد — مچ شدیم!" : `${targetName} را لایک کردید`, "success");
        setOpen(false);
      } else {
        toast(data.error ?? "خطایی رخ داد", "error");
      }
    } catch {
      toast("خطا در ارتباط با سرور", "error");
    } finally {
      setLoading(false);
    }
  }

  async function transfer() {
    const amount = parseInt(coins, 10);
    if (!amount || amount < 1 || loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, receiverId: targetId, coins: amount }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toast("سکه ها منتقل شد", "success");
        setOpen(false);
      } else {
        toast(data.error ?? "خطایی رخ داد", "error");
      }
    } catch {
      toast("خطا در ارتباط با سرور", "error");
    } finally {
      setLoading(false);
    }
  }

  async function block() {
    setLoading(true);
    try {
      const res = await fetch("/api/block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blockedId: targetId }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toast(`${targetName} بلاک شد`, "success");
        setOpen(false);
        router.refresh();
      } else {
        toast(data.error ?? "خطایی رخ داد", "error");
      }
    } catch {
      toast("خطا در ارتباط با سرور", "error");
    } finally {
      setLoading(false);
    }
  }

  async function report() {
    if (!reportReason || loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportedId: targetId,
          reason: reportReason,
          details: reportDetails.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        // بلاک خودکار بعد از گزارش — هماهنگ با رفتار داخل چت
        await fetch("/api/block", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ blockedId: targetId }),
        });
        toast("گزارش ارسال شد و کاربر بلاک شد", "success");
        setOpen(false);
        router.refresh();
      } else {
        toast(data.error ?? "خطایی رخ داد", "error");
      }
    } catch {
      toast("خطا در ارتباط با سرور", "error");
    } finally {
      setLoading(false);
    }
  }

  async function deleteConversation() {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/conversations?conversationId=${conversationId}`,
        { method: "DELETE" }
      );
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toast("گفتگو حذف شد", "success");
        setOpen(false);
        router.refresh();
      } else {
        toast(data.error ?? "خطایی رخ داد", "error");
      }
    } catch {
      toast("خطا در ارتباط با سرور", "error");
    } finally {
      setLoading(false);
    }
  }

  const rowCls =
    "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-foreground hover:bg-ig-gray-bg active:bg-ig-btn2 transition-colors disabled:opacity-40";
  const rowIconCls =
    "w-9 h-9 rounded-lg bg-ig-gray-bg border border-ig-divider flex items-center justify-center shrink-0";
  const dangerRowCls =
    "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-ig-red hover:bg-ig-red/10 active:bg-ig-red/15 transition-colors disabled:opacity-40";

  const subTitle =
    mode === "transfer"
      ? "انتقال سکه"
      : mode === "block"
        ? "بلاک کردن"
        : mode === "report"
          ? "گزارش تخلف"
          : mode === "delete"
            ? "حذف گفتگو"
            : targetName;

  return (
    <>
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={cancelPress}
        onPointerCancel={cancelPress}
        onPointerLeave={cancelPress}
        onClickCapture={onClickCapture}
        onContextMenu={(e) => {
          e.preventDefault();
          openMenu();
        }}
        className="select-none"
        style={{ touchAction: "pan-y", WebkitTouchCallout: "none" }}
      >
        {children}
      </div>

      <BottomSheet open={open} onClose={() => setOpen(false)} title={subTitle} dismissible={!loading}>
        <div className="px-4 pt-4 pb-5">
          {mode === "menu" && (
            <>
              {/* سربرگ کاربر */}
              <div className="flex items-center gap-3 pb-4 border-b border-ig-divider">
                {targetPhoto ? (
                  <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0">
                    <Image src={targetPhoto} alt={targetName} fill className="object-cover" sizes="48px" />
                  </div>
                ) : (
                  <DefaultAvatar size={48} />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    {targetName}
                    {isDeletedAccount && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-ig-gray-bg text-ig-gray text-[10px] font-bold">
                        حذف شده
                      </span>
                    )}
                    {isAdminProfile && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-ig-gray-bg text-foreground text-[10px] font-bold">
                        <Shield className="w-3 h-3" />
                        مدیریتی
                      </span>
                    )}
                    {targetVerified && !isAdminProfile && (
                      <VerifiedBadge className="w-3.5 h-3.5" />
                    )}
                  </p>
                  {targetUsername && (
                    <p className="text-xs text-ig-gray truncate" dir="ltr">
                      @{targetUsername}
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-3 space-y-1">
                {isDeletedAccount && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-ig-gray-bg border border-ig-border mb-1">
                    <AlertCircle className="w-4 h-4 text-ig-gold shrink-0 mt-0.5" />
                    <p className="text-xs text-foreground leading-5">
                      این کاربر اکانت خود را حذف کرده و امکان گفتگو با او وجود ندارد.
                    </p>
                  </div>
                )}
                {targetUsername && !isDeletedAccount && (
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      router.push(`/profile/${targetUsername}`);
                    }}
                    className={rowCls}
                  >
                    <span className={rowIconCls}>
                      <UserRound className="w-4.5 h-4.5 text-foreground" />
                    </span>
                    مشاهده پروفایل
                  </button>
                )}
                {!isAdminProfile && !isDeletedAccount && (
                  <>
                    <button type="button" onClick={() => void like()} disabled={loading} className={rowCls}>
                      <span className={rowIconCls}>
                        <Heart className="w-4.5 h-4.5 text-ig-red" />
                      </span>
                      لایک کردن
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode("transfer")}
                      disabled={loading}
                      className={rowCls}
                    >
                      <span className={rowIconCls}>
                        <Coins className="w-4.5 h-4.5 text-ig-gold" />
                      </span>
                      انتقال سکه
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode("block")}
                      disabled={loading}
                      className={rowCls}
                    >
                      <span className={rowIconCls}>
                        <Ban className="w-4.5 h-4.5 text-ig-red" />
                      </span>
                      بلاک کردن
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode("report")}
                      disabled={loading}
                      className={rowCls}
                    >
                      <span className={rowIconCls}>
                        <Flag className="w-4.5 h-4.5 text-ig-red" />
                      </span>
                      گزارش تخلف
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setMode("delete")}
                  disabled={loading}
                  className={dangerRowCls}
                >
                  <span className={`${rowIconCls} border-ig-red/30`}>
                    <Trash2 className="w-4.5 h-4.5 text-ig-red" />
                  </span>
                  حذف گفتگو
                </button>
              </div>
            </>
          )}

          {mode === "transfer" && (
            <>
              <p className="text-xs text-ig-gray leading-5 mb-3">
                تعداد سکه ای که می خواهید برای {targetName} بفرستید را وارد کنید.
              </p>
              <Input
                type="tel"
                inputMode="numeric"
                dir="ltr"
                className="text-center text-lg font-black"
                placeholder="تعداد سکه"
                value={coins}
                onChange={(e) => setCoins(normalizeDigits(e.target.value).replace(/\D/g, ""))}
              />
              <button
                type="button"
                onClick={() => void transfer()}
                disabled={loading || !coins}
                className="mt-4 w-full h-11 rounded-lg bg-ig-blue text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-ig-blue-hover disabled:opacity-40 transition-all"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                ارسال سکه
              </button>
            </>
          )}

          {mode === "block" && (
            <>
              <div className="flex items-start gap-2 p-3 rounded-lg bg-ig-gray-bg border border-ig-border mb-4">
                <AlertCircle className="w-4 h-4 text-ig-gold shrink-0 mt-0.5" />
                <p className="text-xs text-foreground leading-5">
                  {targetName} بلاک می شود و دیگر نمی توانید با هم گفتگو کنید. از بخش بلاک ها می توانید رفع بلاک کنید.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void block()}
                disabled={loading}
                className="w-full h-11 rounded-lg bg-ig-red text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-40 transition-all"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                بلاک کردن {targetName}
              </button>
            </>
          )}

          {mode === "report" && (
            <>
              <p className="text-xs text-ig-gray mb-2">علت گزارش را انتخاب کنید (اجباری)</p>
              <div className="space-y-1.5">
                {REPORT_REASONS.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setReportReason(r.value)}
                    className={`w-full px-4 py-2.5 rounded-lg text-sm font-bold text-right transition-colors ${
                      reportReason === r.value
                        ? "bg-ig-blue text-white border border-neutral-800"
                        : "bg-ig-gray-bg text-foreground border border-transparent hover:bg-ig-btn2"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
              <textarea
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                placeholder="توضیحات بیشتر (اختیاری)"
                maxLength={500}
                className="w-full mt-2 px-3 py-2 rounded-lg border border-neutral-200 bg-ig-gray-bg text-sm text-foreground outline-none focus:border-neutral-800 transition-colors resize-none"
                rows={2}
              />
              <div className="flex items-start gap-2 mt-3 p-3 rounded-lg bg-ig-gray-bg border border-ig-border">
                <AlertCircle className="w-4 h-4 text-ig-gold shrink-0 mt-0.5" />
                <p className="text-xs text-foreground leading-5">
                  با ارسال گزارش، این کاربر توسط شما بلاک خواهد شد و دیگر نمی توانید با او در ارتباط باشید.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void report()}
                disabled={loading || !reportReason}
                className="mt-3 w-full h-11 rounded-lg bg-ig-red text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-40 transition-all"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                ارسال گزارش
              </button>
            </>
          )}

          {mode === "delete" && (
            <>
              <div className="flex items-start gap-2 p-3 rounded-lg bg-ig-gray-bg border border-ig-border mb-4">
                <AlertCircle className="w-4 h-4 text-ig-gold shrink-0 mt-0.5" />
                <p className="text-xs text-foreground leading-5">
                  گفتگو با {targetName} فقط برای شما حذف می شود و از لیست پیام هایتان پاک می شود.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void deleteConversation()}
                disabled={loading}
                className="w-full h-11 rounded-lg bg-ig-red text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-40 transition-all"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                حذف گفتگو
              </button>
            </>
          )}

          {mode !== "menu" && (
            <button
              type="button"
              onClick={() => {
                setMode("menu");
                setErrorReset();
              }}
              disabled={loading}
              className="mt-2 w-full h-11 rounded-lg bg-ig-btn2 text-foreground text-sm font-bold hover:bg-ig-btn2-hover disabled:opacity-40 transition-colors"
            >
              بازگشت
            </button>
          )}
        </div>
      </BottomSheet>
    </>
  );

  function setErrorReset() {
    setReportReason("");
    setReportDetails("");
    setCoins("");
  }
}
