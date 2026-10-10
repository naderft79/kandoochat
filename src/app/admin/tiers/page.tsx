"use client";

// پنل مدیریت سطح اشتراک
import { useEffect, useState, useCallback } from "react";
import { Crown, Save, Loader2, Check, X } from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import { toPersianDigits } from "@/lib/format";

type Tier = {
  id: string;
  key: string;
  name: string;
  coinsPerMonth: number;
  dailyLikes: number;
  dailySuperLikes: number;
  canSeeLikers: boolean;
  canRewindLast: boolean;
  canHideOnline: boolean;
  canSendGifts: boolean;
  profileBoost: boolean;
  isActive: boolean;
};

const FEATURES: { key: keyof Tier; label: string }[] = [
  { key: "canSeeLikers", label: "مشاهده لایک کنندگان" },
  { key: "canRewindLast", label: "بازگردانی آخرین لایک" },
  { key: "canHideOnline", label: "پنهان کردن آنلاین بودن" },
  { key: "canSendGifts", label: "ارسال هدیه" },
  { key: "profileBoost", label: "بوست پروفایل" },
];

export default function AdminTiersPage() {
  const { toast } = useToast();
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const fetchTiers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/tiers");
      const data = await res.json();
      if (res.ok) setTiers(data.tiers);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTiers();
  }, [fetchTiers]);

  async function saveTier(tier: Tier) {
    setSaving(tier.key);
    try {
      const res = await fetch("/api/admin/tiers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tier),
      });
      if (res.ok) {
        toast(`${tier.name} ذخیره شد`, "success");
      } else {
        const data = await res.json();
        toast(data.error ?? "خطا", "error");
      }
    } finally {
      setSaving(null);
    }
  }

  function updateTier(key: string, field: keyof Tier, value: unknown) {
    setTiers((prev) =>
      prev.map((t) => (t.key === key ? { ...t, [field]: value } : t))
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-[#d4af37] animate-spin" />
      </div>
    );
  }

  const activeTiers = tiers.filter((t) => t.isActive).length;

  return (
    <div className="space-y-4">
      {/* هدر + آمار */}
      <div className="lux-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-black text-[#e8e8e8] flex items-center gap-2">
              <Crown className="w-5 h-5 text-[#d4af37]" />
              سطح اشتراک
            </h1>
            <p className="text-[#888] mt-1 text-xs">مدیریت سطح و قیمت اشتراک</p>
          </div>
          <div className="hidden sm:flex gap-2">
            <div className="lux-card px-3 py-2 text-center min-w-[80px]">
              <p className="text-[10px] text-[#888]">فعال</p>
              <p className="text-sm font-black text-[#4ade80]">
                {toPersianDigits(activeTiers)}
              </p>
            </div>
            <div className="lux-card px-3 py-2 text-center min-w-[80px]">
              <p className="text-[10px] text-[#888]">غیرفعال</p>
              <p className="text-sm font-black text-[#f87171]">
                {toPersianDigits(tiers.length - activeTiers)}
              </p>
            </div>
            <div className="lux-card px-3 py-2 text-center min-w-[80px]">
              <p className="text-[10px] text-[#888]">کل سطح ها</p>
              <p className="text-sm font-black text-[#d4af37]">
                {toPersianDigits(tiers.length)}
              </p>
            </div>
          </div>
        </div>
        <div className="flex sm:hidden gap-2 mt-3">
          <div className="flex-1 lux-card px-2 py-1.5 text-center">
            <p className="text-[9px] text-[#888]">فعال</p>
            <p className="text-xs font-black text-[#4ade80]">
              {toPersianDigits(activeTiers)}
            </p>
          </div>
          <div className="flex-1 lux-card px-2 py-1.5 text-center">
            <p className="text-[9px] text-[#888]">غیرفعال</p>
            <p className="text-xs font-black text-[#f87171]">
              {toPersianDigits(tiers.length - activeTiers)}
            </p>
          </div>
          <div className="flex-1 lux-card px-2 py-1.5 text-center">
            <p className="text-[9px] text-[#888]">کل</p>
            <p className="text-xs font-black text-[#d4af37]">
              {toPersianDigits(tiers.length)}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {tiers.map((tier) => (
          <div key={tier.key} className="lux-card p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    tier.key === "VIP"
                      ? "bg-[rgba(168,85,247,0.1)] text-[#a855f7]"
                      : tier.key === "PREMIUM"
                      ? "bg-[rgba(59,130,246,0.1)] text-[#3b82f6]"
                      : "bg-[rgba(212,175,55,0.08)] text-[#888]"
                  }`}
                >
                  {tier.key}
                </span>
                <input
                  value={tier.name}
                  onChange={(e) => updateTier(tier.key, "name", e.target.value)}
                  className="px-2 py-1 rounded-lg bg-[#0d0b14] border border-[rgba(212,175,55,0.15)] text-[#e8e8e8] text-sm font-bold outline-none focus:border-[rgba(212,175,55,0.4)]"
                />
              </div>
              <button
                onClick={() => updateTier(tier.key, "isActive", !tier.isActive)}
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  tier.isActive
                    ? "bg-[rgba(16,185,129,0.1)] text-[#34d399]"
                    : "bg-[rgba(239,68,68,0.1)] text-[#f87171]"
                }`}
              >
                {tier.isActive ? "فعال" : "غیرفعال"}
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-3">
              <div>
                <label className="text-[10px] text-[#888] block mb-1">
                  سکه / ماه
                </label>
                <input
                  type="number"
                  value={tier.coinsPerMonth}
                  onChange={(e) =>
                    updateTier(
                      tier.key,
                      "coinsPerMonth",
                      parseInt(e.target.value) || 0
                    )
                  }
                  className="w-full px-2 py-1.5 rounded-lg bg-[#0d0b14] border border-[rgba(212,175,55,0.15)] text-[#e8e8e8] text-sm outline-none focus:border-[rgba(212,175,55,0.4)]"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#888] block mb-1">
                  لایک / روز
                </label>
                <input
                  type="number"
                  value={tier.dailyLikes}
                  onChange={(e) =>
                    updateTier(
                      tier.key,
                      "dailyLikes",
                      parseInt(e.target.value) || 0
                    )
                  }
                  className="w-full px-2 py-1.5 rounded-lg bg-[#0d0b14] border border-[rgba(212,175,55,0.15)] text-[#e8e8e8] text-sm outline-none focus:border-[rgba(212,175,55,0.4)]"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#888] block mb-1">
                  سوپر لایک / روز
                </label>
                <input
                  type="number"
                  value={tier.dailySuperLikes}
                  onChange={(e) =>
                    updateTier(
                      tier.key,
                      "dailySuperLikes",
                      parseInt(e.target.value) || 0
                    )
                  }
                  className="w-full px-2 py-1.5 rounded-lg bg-[#0d0b14] border border-[rgba(212,175,55,0.15)] text-[#e8e8e8] text-sm outline-none focus:border-[rgba(212,175,55,0.4)]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
              {FEATURES.map((f) => (
                <button
                  key={f.key}
                  onClick={() =>
                    updateTier(tier.key, f.key, !tier[f.key] as boolean)
                  }
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                    tier[f.key]
                      ? "bg-[rgba(212,175,55,0.08)] text-[#d4af37] border border-[rgba(212,175,55,0.2)]"
                      : "bg-[rgba(255,255,255,0.02)] text-[#666] border border-[rgba(255,255,255,0.05)]"
                  }`}
                >
                  {tier[f.key] ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <X className="w-3.5 h-3.5" />
                  )}
                  {f.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => saveTier(tier)}
              disabled={saving === tier.key}
              className="w-full py-2 rounded-lg lux-btn-gold text-xs font-bold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving === tier.key ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              ذخیره
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
