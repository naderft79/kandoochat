"use client";

// مودال مدیریت اشتراک کاربر توسط مدیر
import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, AlertTriangle, Loader2, Calendar, Trash2, Plus, Minus, Crown } from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import { formatDate, toPersianDigits } from "@/lib/format";

type Props = {
  userId: string;
  subscription: { startsAt: string; endsAt: string } | null;
  onClose: () => void;
  onSuccess?: () => void;
};

export default function UserSubscriptionModal({ userId, subscription, onClose, onSuccess }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [days, setDays] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const parsedDays = parseInt(days, 10);
  const isValidDays = !isNaN(parsedDays) && parsedDays > 0;

  async function act(action: "extend" | "shorten" | "delete" | "create") {
    if (action !== "delete" && !isValidDays) return;
    if (action === "delete" && !confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/subscriptions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action, days: parsedDays }),
      });
      const data = await res.json();
      if (res.ok) {
        onClose();
        onSuccess?.();
        router.refresh();
      } else {
        toast(data.error ?? "خطایی رخ داد", "error");
      }
    } finally {
      setLoading(false);
    }
  }

  const now = new Date();
  const isActive = subscription ? new Date(subscription.endsAt) > now : false;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div className="lux-card max-w-sm w-full ig-modal-in overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[rgba(212,175,55,0.1)]">
          <h3 className="text-sm font-bold text-[#e8e8e8] flex items-center gap-2">
            <Crown className="w-4 h-4 text-[#d4af37]" />
            مدیریت اشتراک
          </h3>
          <button onClick={onClose} disabled={loading} className="w-8 h-8 rounded-lg hover:bg-[rgba(212,175,55,0.08)] flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-[#888]" />
          </button>
        </div>

        {confirmDelete ? (
          <div className="px-5 py-5 text-center">
            <div className="w-12 h-12 rounded-full bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6 text-[#f87171]" />
            </div>
            <p className="text-sm font-bold text-[#e8e8e8] mb-1">حذف اشتراک</p>
            <p className="text-xs text-[#888] leading-5 mb-4">آیا از حذف اشتراک فعلی این کاربر مطمئن هستید؟</p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                disabled={loading}
                className="flex-1 py-2.5 rounded-lg lux-btn-outline text-sm font-bold transition-all"
              >
                بازگشت
              </button>
              <button
                onClick={() => act("delete")}
                disabled={loading}
                className="flex-1 py-2.5 rounded-lg bg-[rgba(239,68,68,0.15)] text-[#f87171] border border-[rgba(239,68,68,0.3)] text-sm font-bold hover:bg-[rgba(239,68,68,0.2)] transition-all flex items-center justify-center gap-1.5"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                حذف
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="px-5 py-4 space-y-4">
              {subscription && isActive ? (
                <div className="bg-[rgba(16,185,129,0.08)] border border-[rgba(16,185,129,0.15)] rounded-xl p-3 space-y-2 text-xs text-[#34d399]">
                  <p className="font-bold flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    اشتراک فعال
                  </p>
                  <div className="flex justify-between">
                    <span>شروع:</span>
                    <span className="font-bold">{formatDate(subscription.startsAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>پایان:</span>
                    <span className="font-bold">{formatDate(subscription.endsAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>باقی مانده:</span>
                    <span className="font-bold">{toPersianDigits(Math.max(0, Math.ceil((new Date(subscription.endsAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))))} روز</span>
                  </div>
                </div>
              ) : (
                <div className="lux-card p-4 text-center text-sm text-[#888]">
                  این کاربر هیچ اشتراک فعالی ندارد.
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-[#888] block mb-2">تعداد روز</label>
                <input
                  type="number"
                  dir="ltr"
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                  placeholder={subscription ? "مثلا 30" : "مثلا 30"}
                  className="w-full px-3 py-2.5 rounded-lg border border-[rgba(212,175,55,0.15)] bg-[#0d0d0d] text-[#e8e8e8] focus:border-[rgba(212,175,55,0.4)] text-sm outline-none transition-all text-center font-bold"
                />
              </div>

              {subscription && isActive ? (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => act("extend")}
                    disabled={!isValidDays || loading}
                    className="py-2.5 rounded-xl lux-btn-gold text-xs font-bold disabled:opacity-40 transition-all flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    افزایش {isValidDays ? toPersianDigits(parsedDays) : ""} روز
                  </button>
                  <button
                    onClick={() => act("shorten")}
                    disabled={!isValidDays || loading}
                    className="py-2.5 rounded-xl lux-btn-outline text-xs font-bold disabled:opacity-40 transition-all flex items-center justify-center gap-1"
                  >
                    <Minus className="w-3.5 h-3.5" />
                    کاهش {isValidDays ? toPersianDigits(parsedDays) : ""} روز
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => act("create")}
                  disabled={!isValidDays || loading}
                  className="w-full py-2.5 rounded-xl lux-btn-gold text-xs font-bold disabled:opacity-40 transition-all flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  فعالسازی برای {isValidDays ? toPersianDigits(parsedDays) : ""} روز
                </button>
              )}
            </div>

            <div className="px-5 py-3.5 border-t border-[rgba(212,175,55,0.1)] flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-lg lux-btn-outline text-sm font-bold transition-all"
              >
                بستن
              </button>
              {subscription && isActive && (
                <button
                  onClick={() => setConfirmDelete(true)}
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-lg bg-[rgba(239,68,68,0.1)] text-[#f87171] border border-[rgba(239,68,68,0.2)] text-sm font-bold hover:bg-[rgba(239,68,68,0.15)] transition-all flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  حذف اشتراک
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
