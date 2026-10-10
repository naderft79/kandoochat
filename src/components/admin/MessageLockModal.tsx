"use client";

// مودال قفل ارسال پیام کاربر توسط مدیر
import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Loader2, Lock, Unlock, AlertTriangle } from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import { formatDateTime, toPersianDigits } from "@/lib/format";

type Props = {
  userId: string;
  messageLockUntil: string | null;
  messageLockReason: string | null;
  onClose: () => void;
  onSuccess?: () => void;
};

export default function MessageLockModal({ userId, messageLockUntil, messageLockReason, onClose, onSuccess }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [confirmUnlock, setConfirmUnlock] = useState(false);
  const [days, setDays] = useState("");
  const [reason, setReason] = useState("");

  const parsedDays = parseInt(days, 10);
  const isValidDays = !isNaN(parsedDays) && parsedDays > 0;

  const now = new Date();
  const isLocked = messageLockUntil ? new Date(messageLockUntil) > now : false;

  async function lock() {
    if (!isValidDays) return;
    if (!reason.trim()) {
      toast("دلیل قفل اجباری است", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          action: "messageLock",
          lockDays: parsedDays,
          lockReason: reason.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast("ارسال پیام قفل شد", "success");
        onClose();
        onSuccess?.();
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

  async function unlock() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          action: "messageUnlock",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast("قفل ارسال پیام برداشته شد", "success");
        onClose();
        onSuccess?.();
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

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div className="lux-card max-w-sm w-full ig-modal-in overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* هدر */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[rgba(212,175,55,0.1)]">
          <h3 className="text-sm font-bold text-[#e8e8e8] flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#d4af37]" />
            قفل ارسال پیام
          </h3>
          <button
            onClick={onClose}
            disabled={loading}
            className="w-8 h-8 rounded-lg hover:bg-[rgba(212,175,55,0.08)] flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-[#888]" />
          </button>
        </div>

        {confirmUnlock ? (
          <div className="px-5 py-5 text-center">
            <div className="w-12 h-12 rounded-full bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6 text-[#f87171]" />
            </div>
            <p className="text-sm font-bold text-[#e8e8e8] mb-1">رفع قفل پیام</p>
            <p className="text-xs text-[#888] leading-5 mb-4">آیا از رفع قفل ارسال پیام این کاربر مطمئن هستید؟</p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmUnlock(false)}
                disabled={loading}
                className="flex-1 py-2.5 rounded-lg lux-btn-outline text-sm font-bold transition-all"
              >
                بازگشت
              </button>
              <button
                onClick={unlock}
                disabled={loading}
                className="flex-1 py-2.5 rounded-lg bg-[rgba(16,185,129,0.15)] text-[#34d399] border border-[rgba(16,185,129,0.3)] text-sm font-bold hover:bg-[rgba(16,185,129,0.2)] transition-all flex items-center justify-center gap-1.5"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unlock className="w-4 h-4" />}
                رفع قفل
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="px-5 py-4 space-y-4">
              {/* وضعیت فعلی */}
              {isLocked && messageLockUntil ? (
                <div className="bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.15)] rounded-xl p-3 space-y-2 text-xs text-[#f87171]">
                  <p className="font-bold flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" />
                    قفل فعال
                  </p>
                  <div className="flex justify-between">
                    <span>تاریخ بازگشایی:</span>
                    <span className="font-bold">{formatDateTime(messageLockUntil)}</span>
                  </div>
                  {messageLockReason && (
                    <div className="flex justify-between gap-2">
                      <span>دلیل:</span>
                      <span className="font-bold text-left">{messageLockReason}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="lux-card p-4 text-center text-sm text-[#888]">
                  ارسال پیام برای این کاربر آزاد است.
                </div>
              )}

              {/* فرم قفل جدید */}
              <div>
                <label className="text-xs font-bold text-[#888] block mb-2">مدت قفل (روز)</label>
                <input
                  type="number"
                  dir="ltr"
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                  placeholder="مثلا 7"
                  className="w-full px-3 py-2.5 rounded-lg border border-[rgba(212,175,55,0.15)] bg-[#0d0d0d] text-[#e8e8e8] focus:border-[rgba(212,175,55,0.4)] text-sm outline-none transition-all text-center font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#888] block mb-2">دلیل قفل (اجباری)</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  placeholder="مثلا: ارسال پیام های توهین آمیز"
                  className="w-full px-3 py-2.5 rounded-lg border border-[rgba(212,175,55,0.15)] bg-[#0d0d0d] text-[#e8e8e8] focus:border-[rgba(212,175,55,0.4)] text-sm outline-none transition-all resize-none"
                />
              </div>

              <button
                onClick={lock}
                disabled={!isValidDays || !reason.trim() || loading}
                className="w-full py-2.5 rounded-xl lux-btn-gold text-xs font-bold disabled:opacity-40 transition-all flex items-center justify-center gap-1"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
                قفل برای {isValidDays ? toPersianDigits(parsedDays) : ""} روز
              </button>
            </div>

            <div className="px-5 py-3.5 border-t border-[rgba(212,175,55,0.1)] flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-lg lux-btn-outline text-sm font-bold transition-all"
              >
                بستن
              </button>
              {isLocked && (
                <button
                  onClick={() => setConfirmUnlock(true)}
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-lg bg-[rgba(16,185,129,0.1)] text-[#34d399] border border-[rgba(16,185,129,0.2)] text-sm font-bold hover:bg-[rgba(16,185,129,0.15)] transition-all flex items-center justify-center gap-1.5"
                >
                  <Unlock className="w-4 h-4" />
                  رفع قفل
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
