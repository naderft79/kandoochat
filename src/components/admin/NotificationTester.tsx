"use client";

// بخش تست اعلان ها در داشبورد مدیریت — ارسال اعلان آزمایشی همگانی و پاکسازی (تم لاکچری تیره)
// اعلان ها فقط برای کاربران عادی ارسال می شوند و هرگز برای مدیر نمی آیند
import { useState } from "react";
import {
  Heart, Star, Eye, Gift, Coins, Crown, Zap, Sparkles, BadgeCheck, ShieldCheck,
  Megaphone, FlaskConical, Trash2, Loader2, Users, type LucideIcon,
} from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import { useLiveData } from "@/components/dashboard/LiveDataProvider";
import { toPersianDigits } from "@/lib/format";

type TestButton = { type: string; status?: string; label: string; icon: LucideIcon };

const TEST_BUTTONS: TestButton[] = [
  { type: "LIKE", label: "لایک", icon: Heart },
  { type: "SUPER_LIKE", label: "سوپر لایک", icon: Star },
  { type: "MATCH", label: "مچ", icon: Heart },
  { type: "PROFILE_VIEW", label: "بازدید پروفایل", icon: Eye },
  { type: "GIFT_RECEIVED", label: "هدیه سکه", icon: Gift },
  { type: "COIN_PURCHASE", label: "خرید سکه", icon: Coins },
  { type: "SUBSCRIPTION_PURCHASED", label: "خرید اشتراک", icon: Crown },
  { type: "SUBSCRIPTION_ENDING", label: "اتمام اشتراک", icon: Crown },
  { type: "BOOST_ACTIVATED", label: "بوست", icon: Zap },
  { type: "GOLDEN_STORY", label: "استوری طلایی", icon: Sparkles },
  { type: "FEATURED_PENDING", label: "انتظار بخش ویژه", icon: Sparkles },
  { type: "FEATURED_APPROVED", label: "تایید بخش ویژه", icon: Sparkles },
  { type: "FEATURED_REJECTED", label: "رد بخش ویژه", icon: Sparkles },
  { type: "VERIFY_BADGE", label: "تایید تیک آبی", icon: BadgeCheck },
  { type: "VERIFY_BADGE", status: "REJECTED", label: "رد تیک آبی", icon: BadgeCheck },
  { type: "VERIFY_IDENTITY", label: "تایید احراز", icon: ShieldCheck },
  { type: "VERIFY_IDENTITY", status: "REJECTED", label: "رد احراز", icon: ShieldCheck },
  { type: "REQUEST_RECEIVED", label: "درخواست سکه", icon: Coins },
  { type: "REQUEST_APPROVED", label: "تایید درخواست", icon: Coins },
  { type: "REQUEST_REJECTED", label: "رد درخواست", icon: Coins },
  { type: "STREAK_REWARD", label: "پاداش استریک", icon: Zap },
  { type: "REFERRAL_REWARD", label: "پاداش دعوت", icon: Users },
  { type: "ADMIN_BROADCAST", label: "پیام مدیر", icon: Megaphone },
];

export default function NotificationTester() {
  const { toast } = useToast();
  const { refresh } = useLiveData();
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);

  async function send(btn: TestButton) {
    const key = btn.type + (btn.status ?? "");
    if (loadingKey) return;
    setLoadingKey(key);
    try {
      const res = await fetch("/api/test-notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: btn.type, status: btn.status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast(data.error ?? "ارسال اعلان ناموفق بود", "error");
        return;
      }
      refresh();
      const msg = `اعلان «${btn.label}» برای ${toPersianDigits(data.sent ?? 0)} کاربر ارسال شد`;
      setLastResult(msg);
      toast(msg, "success");
    } catch {
      toast("خطا در ارتباط با سرور", "error");
    } finally {
      setLoadingKey(null);
    }
  }

  async function clearAll() {
    if (clearing) return;
    setClearing(true);
    try {
      const res = await fetch("/api/test-notifications", { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast(data.error ?? "پاکسازی ناموفق بود", "error");
        return;
      }
      refresh();
      const msg = `${toPersianDigits(data.deleted ?? 0)} اعلان برای همه کاربران پاک شد`;
      setLastResult(msg);
      toast(msg, "success");
    } catch {
      toast("خطا در ارتباط با سرور", "error");
    } finally {
      setClearing(false);
    }
  }

  return (
    <div className="lux-card p-5">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <h2 className="text-sm font-black text-[#e8e8e8] flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-[#d4af37]" />
          تست بخش ها — اعلان ها
        </h2>
        <p className="text-[10px] text-[#888]">
          اعلان ها برای همه کاربران ارسال می شوند (مدیران دریافت نمی کنند)
        </p>
      </div>

      {/* دکمه های تست هر نوع اعلان */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {TEST_BUTTONS.map((btn) => {
          const key = btn.type + (btn.status ?? "");
          const Icon = btn.icon;
          return (
            <button
              key={key}
              onClick={() => send(btn)}
              disabled={!!loadingKey}
              className="flex items-center gap-2 rounded-xl border border-[rgba(212,175,55,0.15)] bg-[#0d0d0d] px-3 py-2.5 text-[11px] font-bold text-[#e8e8e8] hover:border-[rgba(212,175,55,0.4)] hover:bg-[#141414] active:scale-[0.97] transition-all disabled:opacity-50"
            >
              {loadingKey === key ? (
                <Loader2 className="w-4 h-4 animate-spin shrink-0 text-[#d4af37]" />
              ) : (
                <Icon className="w-4 h-4 shrink-0 text-[#d4af37]" />
              )}
              <span className="truncate">{btn.label}</span>
            </button>
          );
        })}
      </div>

      {/* پاک کردن اعلان ها */}
      <button
        onClick={clearAll}
        disabled={clearing}
        className="mt-4 w-full flex items-center justify-center gap-2 h-10 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-bold hover:bg-red-500/15 active:scale-[0.98] transition-all disabled:opacity-50"
      >
        {clearing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
        پاک کردن اعلان های همه کاربران
      </button>

      {lastResult && (
        <p className="text-[10px] text-[#888] mt-3 text-center">{lastResult}</p>
      )}
    </div>
  );
}
