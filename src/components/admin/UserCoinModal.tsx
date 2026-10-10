"use client";

// مودال تغییر سکه کاربر توسط مدیر
import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, AlertTriangle, Loader2 } from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import { toPersianDigits } from "@/lib/format";

type Props = {
  userId: string;
  currentBalance: number;
  onClose: () => void;
  onSuccess?: () => void;
};

export default function UserCoinModal({ userId, currentBalance, onClose, onSuccess }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [coinMode, setCoinMode] = useState<"add" | "subtract">("add");
  const [coinAmount, setCoinAmount] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  async function act() {
    if (!parsedAmount || parsedAmount <= 0) return;
    const coins = coinMode === "add" ? parsedAmount : -parsedAmount;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action: "adjustCoins", coins }),
      });
      if (res.ok) {
        onClose();
        onSuccess?.();
        router.refresh();
      } else {
        const data = await res.json();
        toast(data.error ?? "خطایی رخ داد", "error");
      }
    } finally {
      setLoading(false);
    }
  }

  const parsedAmount = parseInt(coinAmount, 10);
  const isValidAmount = !isNaN(parsedAmount) && parsedAmount > 0;
  const signedAmount = coinMode === "add" ? parsedAmount : -parsedAmount;
  const newBalance = currentBalance + (isValidAmount ? signedAmount : 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div className="lux-card max-w-xs w-full ig-modal-in overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[rgba(212,175,55,0.1)]">
          <h3 className="text-sm font-bold text-[#e8e8e8]">تغییر سکه کاربر</h3>
          <button
            onClick={onClose}
            disabled={loading}
            className="w-8 h-8 rounded-lg hover:bg-[rgba(212,175,55,0.08)] flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-[#888]" />
          </button>
        </div>

        {!showConfirm ? (
          <>
            <div className="px-5 py-4 space-y-4">
              <div className="bg-[rgba(212,175,55,0.06)] border border-[rgba(212,175,55,0.1)] rounded-xl px-4 py-3 text-center">
                <p className="text-[10px] text-[#888] mb-0.5">سکه فعلی کاربر</p>
                <p className="text-xl font-black text-[#d4af37]">{toPersianDigits(currentBalance)}</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setCoinMode("add")}
                  className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                    coinMode === "add"
                      ? "lux-btn-gold"
                      : "lux-btn-outline"
                  }`}
                >
                  + افزایش سکه
                </button>
                <button
                  onClick={() => setCoinMode("subtract")}
                  className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                    coinMode === "subtract"
                      ? "lux-btn-gold"
                      : "lux-btn-outline"
                  }`}
                >
                  − کاهش سکه
                </button>
              </div>

              <div>
                <input
                  type="number"
                  dir="ltr"
                  value={coinAmount}
                  onChange={(e) => setCoinAmount(e.target.value)}
                  placeholder="مقدار سکه"
                  className="w-full px-3 py-2.5 rounded-lg border border-[rgba(212,175,55,0.15)] bg-[#0d0d0d] text-[#e8e8e8] focus:border-[rgba(212,175,55,0.4)] text-sm outline-none transition-all text-center font-bold"
                />
                {isValidAmount && (
                  <p className="text-xs text-[#888] mt-2 text-center">
                    موجودی جدید: <span className="font-bold text-[#d4af37]">{toPersianDigits(newBalance)}</span> سکه
                  </p>
                )}
              </div>
            </div>
            <div className="px-5 py-3.5 border-t border-[rgba(212,175,55,0.1)] flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-lg lux-btn-outline text-sm font-bold transition-all"
              >
                انصراف
              </button>
              <button
                onClick={() => setShowConfirm(true)}
                disabled={!isValidAmount}
                className="flex-1 py-2.5 rounded-lg lux-btn-gold text-sm font-bold disabled:opacity-40 transition-all"
              >
                ادامه
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="px-5 py-5 text-center">
              <div className="w-12 h-12 rounded-full bg-[rgba(212,175,55,0.1)] border border-[rgba(212,175,55,0.2)] flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="w-6 h-6 text-[#d4af37]" />
              </div>
              <p className="text-sm font-bold text-[#e8e8e8] mb-1">تایید تغییر سکه</p>
              <p className="text-xs text-[#888] leading-5 mb-3">
                {coinMode === "add" ? "افزایش" : "کاهش"} {toPersianDigits(parsedAmount)} سکه
              </p>
              <div className="bg-[rgba(212,175,55,0.04)] border border-[rgba(212,175,55,0.1)] rounded-lg px-3 py-2 text-xs text-[#888]">
                <div className="flex justify-between">
                  <span>موجودی فعلی:</span>
                  <span className="font-bold text-[#e8e8e8]">{toPersianDigits(currentBalance)}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span>موجودی جدید:</span>
                  <span className="font-bold text-[#d4af37]">{toPersianDigits(newBalance)}</span>
                </div>
              </div>
            </div>
            <div className="px-5 py-3.5 border-t border-[rgba(212,175,55,0.1)] flex gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={loading}
                className="flex-1 py-2.5 rounded-lg lux-btn-outline text-sm font-bold transition-all"
              >
                بازگشت
              </button>
              <button
                onClick={act}
                disabled={loading}
                className="flex-1 py-2.5 rounded-lg lux-btn-gold text-sm font-bold transition-all flex items-center justify-center gap-1.5"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "تایید نهایی"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
