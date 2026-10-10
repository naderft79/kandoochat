"use client";

// فرم تنظیمات سایت
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2, Plus, Trash2, AlertTriangle, Coins, Shield, Wrench, Zap, TrendingUp } from "lucide-react";
import { formatToman, toPersianDigits } from "@/lib/format";

const inputClass =
  "w-full px-4 py-3 rounded-lg border border-[rgba(212,175,55,0.15)] bg-[#0d0b14] text-[#e8e8e8] focus:border-[rgba(212,175,55,0.4)] outline-none transition-colors text-left";

type CoinPackage = { coins: number; price: number; label: string };

type Props = {
  coinValue: number;
  subscriptionPrice: number;
  minWithdrawCoins: number;
  buyCoinsEnabled: boolean;
  withdrawCoinsEnabled: boolean;
  specialRegisterSlug: string;
  transferFeePercent: number;
  boostCostCoins: number;
  boostDurationMinutes: number;
  referralRewardCoins: number;
  streakRewardCoins: number;
  otpEnabled: boolean;
  coinPackages: string;
  maxCoinsPerPurchase: number;
  minCoinsForGift: number;
  withdrawCommissionPercent: number;
  maintenanceMode: boolean;
  maintenanceMessage: string;
};

export default function SettingsForm(props: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    coinValue: String(props.coinValue),
    subscriptionPrice: String(props.subscriptionPrice),
    minWithdrawCoins: String(props.minWithdrawCoins),
    buyCoinsEnabled: props.buyCoinsEnabled,
    withdrawCoinsEnabled: props.withdrawCoinsEnabled,
    specialRegisterSlug: props.specialRegisterSlug,
    transferFeePercent: String(props.transferFeePercent),
    boostCostCoins: String(props.boostCostCoins),
    boostDurationMinutes: String(props.boostDurationMinutes),
    referralRewardCoins: String(props.referralRewardCoins),
    streakRewardCoins: String(props.streakRewardCoins),
    otpEnabled: props.otpEnabled,
    maxCoinsPerPurchase: String(props.maxCoinsPerPurchase),
    minCoinsForGift: String(props.minCoinsForGift),
    withdrawCommissionPercent: String(props.withdrawCommissionPercent),
    maintenanceMode: props.maintenanceMode,
    maintenanceMessage: props.maintenanceMessage,
  });

  const [packages, setPackages] = useState<CoinPackage[]>(() => {
    try { return JSON.parse(props.coinPackages) as CoinPackage[]; } catch { return []; }
  });
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const coinCost = Math.ceil(
    (parseInt(form.subscriptionPrice, 10) || 0) /
      (parseInt(form.coinValue, 10) || 1)
  );

  function addPackage() {
    setPackages((prev) => [...prev, { coins: 100, price: 1000000, label: `بسته ${prev.length + 1}` }]);
  }

  function updatePackage(index: number, field: keyof CoinPackage, value: string | number) {
    setPackages((prev) => prev.map((p, i) => i === index ? { ...p, [field]: value } : p));
  }

  function removePackage(index: number) {
    setPackages((prev) => prev.filter((_, i) => i !== index));
  }

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
          buyCoinsEnabled: form.buyCoinsEnabled,
          withdrawCoinsEnabled: form.withdrawCoinsEnabled,
          specialRegisterSlug: form.specialRegisterSlug,
          transferFeePercent: parseInt(form.transferFeePercent, 10),
          boostCostCoins: parseInt(form.boostCostCoins, 10),
          boostDurationMinutes: parseInt(form.boostDurationMinutes, 10),
          referralRewardCoins: parseInt(form.referralRewardCoins, 10),
          streakRewardCoins: parseInt(form.streakRewardCoins, 10),
          otpEnabled: form.otpEnabled,
          coinPackages: JSON.stringify(packages),
          maxCoinsPerPurchase: parseInt(form.maxCoinsPerPurchase, 10),
          minCoinsForGift: parseInt(form.minCoinsForGift, 10),
          withdrawCommissionPercent: parseInt(form.withdrawCommissionPercent, 10),
          maintenanceMode: form.maintenanceMode,
          maintenanceMessage: form.maintenanceMessage,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ ok: false, text: data.error ?? "خطایی رخ داد" });
        return;
      }
      setMessage({ ok: true, text: "تنظیمات با موفقیت ذخیره شد" });
      router.refresh();
    } catch {
      setMessage({ ok: false, text: "خطا در ارتباط با سرور" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* بخش مالی و سکه */}
      <div className="lux-card p-5">
        <h2 className="text-sm font-black text-[#d4af37] flex items-center gap-2 mb-4">
          <Coins className="w-4 h-4" />
          تنظیمات مالی و سکه
        </h2>
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
            <label className="block text-xs font-bold text-[#888] mb-1.5">کارمزد انتقال سکه (درصد)</label>
            <input type="number" dir="ltr" value={form.transferFeePercent} onChange={(e) => setForm((f) => ({ ...f, transferFeePercent: e.target.value }))} className={inputClass} />
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

      {/* بسته های خرید سکه */}
      <div className="lux-card p-5">
        <h2 className="text-sm font-black text-[#d4af37] flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4" />
          بسته های خرید سکه
        </h2>
        <div className="space-y-2">
          {packages.map((pkg, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input
                type="number"
                dir="ltr"
                value={pkg.coins}
                onChange={(e) => updatePackage(i, "coins", parseInt(e.target.value) || 0)}
                className={`${inputClass} flex-1`}
                placeholder="تعداد سکه"
              />
              <input
                type="number"
                dir="ltr"
                value={pkg.price}
                onChange={(e) => updatePackage(i, "price", parseInt(e.target.value) || 0)}
                className={`${inputClass} flex-1`}
                placeholder="قیمت (تومان)"
              />
              <input
                type="text"
                value={pkg.label}
                onChange={(e) => updatePackage(i, "label", e.target.value)}
                className={`${inputClass} flex-1`}
                placeholder="برچسب"
              />
              <button type="button" onClick={() => removePackage(i)} className="shrink-0 w-10 h-10 rounded-lg bg-[rgba(239,68,68,0.1)] text-[#f87171] border border-[rgba(239,68,68,0.2)] flex items-center justify-center hover:bg-[rgba(239,68,68,0.15)] transition-all">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        <button type="button" onClick={addPackage} className="mt-3 flex items-center gap-1.5 px-3 py-2 rounded-lg lux-btn-outline text-xs font-bold">
          <Plus className="w-4 h-4" />
          افزودن بسته جدید
        </button>
      </div>

      {/* بوست و پاداش */}
      <div className="lux-card p-5">
        <h2 className="text-sm font-black text-[#d4af37] flex items-center gap-2 mb-4">
          <Zap className="w-4 h-4" />
          بوست و پاداش
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#888] mb-1.5">هزینه بوست پروفایل (سکه)</label>
            <input type="number" dir="ltr" value={form.boostCostCoins} onChange={(e) => setForm((f) => ({ ...f, boostCostCoins: e.target.value }))} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#888] mb-1.5">مدت بوست (دقیقه)</label>
            <input type="number" dir="ltr" value={form.boostDurationMinutes} onChange={(e) => setForm((f) => ({ ...f, boostDurationMinutes: e.target.value }))} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#888] mb-1.5">پاداش دعوت دوستان (سکه)</label>
            <input type="number" dir="ltr" value={form.referralRewardCoins} onChange={(e) => setForm((f) => ({ ...f, referralRewardCoins: e.target.value }))} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#888] mb-1.5">پاداش استریک هفتگی (سکه)</label>
            <input type="number" dir="ltr" value={form.streakRewardCoins} onChange={(e) => setForm((f) => ({ ...f, streakRewardCoins: e.target.value }))} className={inputClass} />
          </div>
        </div>
      </div>

      {/* امنیت و ثبت نام */}
      <div className="lux-card p-5">
        <h2 className="text-sm font-black text-[#d4af37] flex items-center gap-2 mb-4">
          <Shield className="w-4 h-4" />
          امنیت و ثبت نام
        </h2>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-[#888] mb-1.5">کلمه لینک ثبت نام ویژه (انگلیسی)</label>
            <input type="text" dir="ltr" value={form.specialRegisterSlug} onChange={(e) => setForm((f) => ({ ...f, specialRegisterSlug: e.target.value }))} className={inputClass} placeholder="special" />
            <p className="text-[10px] text-[#888] mt-1">لینک ثبت نام ویژه: /register/{form.specialRegisterSlug || "special"}</p>
          </div>
          <label className="flex items-center justify-between bg-[rgba(212,175,55,0.04)] border border-[rgba(212,175,55,0.1)] rounded-lg px-4 py-3 cursor-pointer">
            <span className="text-sm text-[#e8e8e8] font-medium">تایید موبایل با OTP فعال باشد</span>
            <input type="checkbox" checked={form.otpEnabled} onChange={(e) => setForm((f) => ({ ...f, otpEnabled: e.target.checked }))} className="w-5 h-5 accent-[#d4af37]" />
          </label>
          <label className="flex items-center justify-between bg-[rgba(212,175,55,0.04)] border border-[rgba(212,175,55,0.1)] rounded-lg px-4 py-3 cursor-pointer">
            <span className="text-sm text-[#e8e8e8] font-medium">خرید سکه فعال باشد</span>
            <input type="checkbox" checked={form.buyCoinsEnabled} onChange={(e) => setForm((f) => ({ ...f, buyCoinsEnabled: e.target.checked }))} className="w-5 h-5 accent-[#d4af37]" />
          </label>
          <label className="flex items-center justify-between bg-[rgba(212,175,55,0.04)] border border-[rgba(212,175,55,0.1)] rounded-lg px-4 py-3 cursor-pointer">
            <span className="text-sm text-[#e8e8e8] font-medium">برداشت سکه فعال باشد</span>
            <input type="checkbox" checked={form.withdrawCoinsEnabled} onChange={(e) => setForm((f) => ({ ...f, withdrawCoinsEnabled: e.target.checked }))} className="w-5 h-5 accent-[#d4af37]" />
          </label>
        </div>
      </div>

      {/* حالت تعمیر */}
      <div className="lux-card p-5">
        <h2 className="text-sm font-black text-[#d4af37] flex items-center gap-2 mb-4">
          <Wrench className="w-4 h-4" />
          حالت تعمیر سایت
        </h2>
        <label className="flex items-center justify-between bg-[rgba(239,68,68,0.06)] border border-[rgba(239,68,68,0.15)] rounded-lg px-4 py-3 cursor-pointer mb-3">
          <span className="text-sm text-[#e8e8e8] font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#f87171]" />
            فعال سازی حالت تعمیر (کل سایت بسته می شود)
          </span>
          <input type="checkbox" checked={form.maintenanceMode} onChange={(e) => setForm((f) => ({ ...f, maintenanceMode: e.target.checked }))} className="w-5 h-5 accent-[#f87171]" />
        </label>
        <div>
          <label className="block text-xs font-bold text-[#888] mb-1.5">پیام نمایش داده شده به کاربران</label>
          <textarea
            dir="rtl"
            value={form.maintenanceMessage}
            onChange={(e) => setForm((f) => ({ ...f, maintenanceMessage: e.target.value }))}
            className={`${inputClass} text-right`}
            rows={2}
          />
        </div>
      </div>

      {message && (
        <p className={`text-sm rounded-lg px-4 py-3 ${message.ok ? "bg-[rgba(16,185,129,0.1)] text-[#34d399] border border-[rgba(16,185,129,0.2)]" : "bg-[rgba(239,68,68,0.1)] text-[#f87171] border border-[rgba(239,68,68,0.2)]"}`}>
          {message.text}
        </p>
      )}

      <button type="submit" disabled={loading} className="px-6 py-2.5 rounded-lg lux-btn-gold font-bold transition-all disabled:opacity-50 flex items-center gap-2">
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
        {loading ? "در حال ذخیره..." : "ذخیره تنظیمات"}
      </button>
    </form>
  );
}
