"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2 } from "lucide-react";
import { formatToman, toPersianDigits } from "@/lib/format";

const inputClass =
  "w-full px-4 py-3 rounded-lg border border-[rgba(212,175,55,0.15)] bg-[#0d0b14] text-[#e8e8e8] focus:border-[rgba(212,175,55,0.4)] outline-none transition-colors text-left";

type Props = {
  coinValue: number;
  subscriptionPrice: number;
  minWithdrawCoins: number;
  maxCoinsPerPurchase: number;
  minCoinsForGift: number;
  withdrawCommissionPercent: number;
};

export default function FinanceSettings(props: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    coinValue: String(props.coinValue),
    subscriptionPrice: String(props.subscriptionPrice),
    minWithdrawCoins: String(props.minWithdrawCoins),
    maxCoinsPerPurchase: String(props.maxCoinsPerPurchase),
    minCoinsForGift: String(props.minCoinsForGift),
    withdrawCommissionPercent: String(props.withdrawCommissionPercent),
  });
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const coinCost = Math.ceil(
    (parseInt(form.subscriptionPrice, 10) || 0) / (parseInt(form.coinValue, 10) || 1)
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coinValue: parseInt(form.coinValue, 10),
          subscriptionPrice: parseInt(form.subscriptionPrice, 10),
          minWithdrawCoins: parseInt(form.minWithdrawCoins, 10),
          maxCoinsPerPurchase: parseInt(form.maxCoinsPerPurchase, 10),
          minCoinsForGift: parseInt(form.minCoinsForGift, 10),
          withdrawCommissionPercent: parseInt(form.withdrawCommissionPercent, 10),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setMessage({ ok: false, text: data.error ?? "خطایی رخ داد" }); return; }
      setMessage({ ok: true, text: "تنظیمات ذخیره شد" });
      router.refresh();
    } catch {
      setMessage({ ok: false, text: "خطا در ارتباط با سرور" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="lux-card p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#888] mb-1.5">ارزش هر سکه (تومان)</label>
            <input type="number" dir="ltr" value={form.coinValue} onChange={(e) => setForm((f) => ({ ...f, coinValue: e.target.value }))} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#888] mb-1.5">قیمت اشتراک ماهانه (تومان)</label>
            <input type="number" dir="ltr" value={form.subscriptionPrice} onChange={(e) => setForm((f) => ({ ...f, subscriptionPrice: e.target.value }))} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#888] mb-1.5">حداقل سکه برای برداشت</label>
            <input type="number" dir="ltr" value={form.minWithdrawCoins} onChange={(e) => setForm((f) => ({ ...f, minWithdrawCoins: e.target.value }))} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#888] mb-1.5">حداکثر سکه قابل خرید در یک تراکنش</label>
            <input type="number" dir="ltr" value={form.maxCoinsPerPurchase} onChange={(e) => setForm((f) => ({ ...f, maxCoinsPerPurchase: e.target.value }))} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#888] mb-1.5">حداقل موجودی سکه برای ارسال هدیه</label>
            <input type="number" dir="ltr" value={form.minCoinsForGift} onChange={(e) => setForm((f) => ({ ...f, minCoinsForGift: e.target.value }))} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#888] mb-1.5">درصد کمیسیون سایت از برداشت</label>
            <input type="number" dir="ltr" value={form.withdrawCommissionPercent} onChange={(e) => setForm((f) => ({ ...f, withdrawCommissionPercent: e.target.value }))} className={inputClass} />
          </div>
        </div>
        <div className="bg-[rgba(212,175,55,0.04)] border border-[rgba(212,175,55,0.1)] rounded-lg px-4 py-3 text-sm text-[#e8e8e8] mt-4">
          با این مقادیر، هزینه اشتراک <span className="font-bold text-[#d4af37]">{toPersianDigits(coinCost)} سکه</span> معادل {formatToman(coinCost * (parseInt(form.coinValue, 10) || 0))} خواهد بود
        </div>
      </div>

      {message && (
        <p className={`text-sm rounded-lg px-4 py-3 ${message.ok ? "bg-[rgba(16,185,129,0.1)] text-[#34d399] border border-[rgba(16,185,129,0.2)]" : "bg-[rgba(239,68,68,0.1)] text-[#f87171] border border-[rgba(239,68,68,0.2)]"}`}>
          {message.text}
        </p>
      )}

      <button type="submit" disabled={loading} className="px-6 py-2.5 rounded-lg lux-btn-gold font-bold transition-all disabled:opacity-50 flex items-center gap-2">
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
        {loading ? "در حال ذخیره..." : "ذخیره"}
      </button>
    </form>
  );
}
