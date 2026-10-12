"use client";

// عملیات سکه: ۳ تب خرید، فروش، تاریخچه
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Coins,
  Banknote,
  Gift,
  Check,
  Loader2,
  Sparkles,
  Flame,
  ArrowDown,
  ArrowUp,
  Clock,
  ChevronRight,
  ChevronLeft,
  Crown,
  ShieldCheck,
  MessageCircle,
  CalendarCheck,
  UserCheck,
  Heart,
  Eye,
  UserPlus,
  Mic,
  Image as ImageIcon,
} from "lucide-react";
import {
  formatToman,
  formatCoins,
  formatDateTime,
  toPersianDigits,
} from "@/lib/format";
import { detectBank, formatCardNumber } from "@/lib/iranianBanks";
import Button from "@/components/ui/Button";
import { BottomSheet } from "@/components/ui/Modal";
import { cn } from "@/components/ui/cn";

type Mission = {
  id: string;
  key: string;
  title: string;
  description: string;
  rewardCoins: number;
  target: number;
  icon: string;
  progress: number;
  completed: boolean;
  claimed: boolean;
};

type Transaction = {
  id: string;
  type: string;
  coins: number;
  amountToman: number;
  status: string;
  description: string | null;
  createdAt: string;
};

type Props = {
  coinValue: number;
  minWithdrawCoins: number;
  balance: number;
  referralCode: string;
  transactions: Transaction[];
  buyCoinsEnabled: boolean;
  withdrawCoinsEnabled: boolean;
};

type Tab = "buy" | "sell" | "history";

const inputClass =
  "w-full px-4 py-3 rounded-lg border border-ig-border focus:border-neutral-400 outline-none transition-colors text-left";

// پکیج های سکه با تخفیف
const coinPackages = [
  { coins: 10, discount: 0 },
  { coins: 40, discount: 5 },
  { coins: 100, discount: 10, badge: "محبوب" },
  { coins: 200, discount: 15 },
  { coins: 500, discount: 20, badge: "بهترین" },
  { coins: 1000, discount: 25, badge: "VIP" },
];

// حداقل موجودی لازم برای برداشت (قانون ۲)
const MIN_BALANCE_FOR_WITHDRAW = 100;

// آیکون اختصاصی هر ماموریت روزانه بر اساس key — به جای ایموجی
const MISSION_ICONS: Record<string, typeof Coins> = {
  daily_new_chats: UserCheck,
  daily_old_chats: MessageCircle,
  daily_voice: Mic,
  daily_photo: ImageIcon,
  daily_likes: Heart,
  // ماموریت های قدیمی — در صورت فعال شدن دوباره از ادمین
  daily_login: CalendarCheck,
  complete_profile: UserCheck,
  send_5_likes: Heart,
  open_10_profiles: Eye,
  start_chat: MessageCircle,
  invite_friend: UserPlus,
};

// شمارش معکوس زنده تا زمان باز شدن برداشت (قانون ۱)
function WithdrawCountdown({ until }: { until: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const ms = Math.max(0, new Date(until).getTime() - now);
  const d = Math.floor(ms / 86_400_000);
  const h = Math.floor((ms % 86_400_000) / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  const pad = (n: number) => toPersianDigits(String(n).padStart(2, "0"));
  return (
    <span dir="ltr" className="tabular-nums">
      {toPersianDigits(d)} : {pad(h)} : {pad(m)} : {pad(s)}
    </span>
  );
}

const typeLabels: Record<string, string> = {
  COIN_PURCHASE: "خرید سکه",
  SUBSCRIPTION: "خرید اشتراک",
  WITHDRAW: "برداشت",
  ADMIN_ADJUST: "تغییر توسط مدیر",
  COIN_TRANSFER_OUT: "انتقال سکه (ارسالی)",
  COIN_TRANSFER_IN: "انتقال سکه (دریافتی)",
  COIN_TRANSFER_FEE: "کارمزد انتقال",
  BOOST_PURCHASE: "خرید بوست",
  GOLDEN_STORY: "استوری طلایی",
  FEATURED_PURCHASE: "بخش ویژه",
  REFERRAL_REWARD: "پاداش دعوت",
  STREAK_REWARD: "پاداش استریک",
};

// شمارش تدریجی عدد موجودی (با احترام به کاهش حرکت)
function useCountUp(target: number, duration = 800) {
  const [value, setValue] = useState(0);
  const fromRef = useRef(0);
  useEffect(() => {
    // حالت کاهش حرکت خارج از بدنه effect حل می شود تا setState مستقیم داخل effect نداشته باشیم
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      fromRef.current = target;
      const id = requestAnimationFrame(() => setValue(target));
      return () => cancelAnimationFrame(id);
    }
    const from = fromRef.current;
    const start = performance.now();
    let raf = requestAnimationFrame(function tick(now: number) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const v = Math.round(from + (target - from) * eased);
      fromRef.current = v;
      setValue(v);
      if (t < 1) raf = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

export default function CoinsActions({
  coinValue,
  minWithdrawCoins,
  balance,
  referralCode,
  transactions,
  buyCoinsEnabled,
  withdrawCoinsEnabled,
}: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("buy");
  const [missions, setMissions] = useState<Mission[]>([]);
  const [missionsLoading, setMissionsLoading] = useState(true);
  const [selectedPkg, setSelectedPkg] = useState(2);
  const [buyLoading, setBuyLoading] = useState(false);
  const [buyMsg, setBuyMsg] = useState<{ ok: boolean; text: string } | null>(
    null
  );
  const [historyPage, setHistoryPage] = useState(0);
  const [historyFilter, setHistoryFilter] = useState<"all" | "in" | "out">(
    "all"
  );
  const pageSize = 10;
  const [withdrawCoins, setWithdrawCoins] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [wLoading, setWLoading] = useState(false);
  const [wMsg, setWMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [ruleModal, setRuleModal] = useState<{
    rule: number;
    unlockAt: string | null;
    balance: number;
  } | null>(null);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/missions");
        const data = await res.json();
        if (active && data.missions) setMissions(data.missions);
      } catch {
        // خطای شبکه
      } finally {
        if (active) setMissionsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  async function fetchMissions() {
    try {
      const res = await fetch("/api/missions");
      const data = await res.json();
      if (data.missions) setMissions(data.missions);
    } catch {
      // خطای شبکه
    }
  }

  async function handleBuy(e: React.FormEvent) {
    e.preventDefault();
    setBuyMsg(null);
    setBuyLoading(true);
    const pkg = coinPackages[selectedPkg];
    try {
      const res = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "COINS", coins: pkg.coins }),
      });
      const data = await res.json();
      if (!res.ok) {
        setBuyMsg({ ok: false, text: data.error ?? "خطایی رخ داد" });
        setBuyLoading(false);
        return;
      }
      // هدایت به KandooPay برای پرداخت
      window.location.href = data.redirectUrl;
    } catch {
      setBuyMsg({ ok: false, text: "خطا در ارتباط با سرور" });
      setBuyLoading(false);
    }
  }

  async function handleWithdraw(e: React.FormEvent) {
    e.preventDefault();
    setWMsg(null);
    setWLoading(true);
    try {
      // بررسی قوانین برداشت — اولین قانون رد شده به صورت مودال نمایش داده می شود
      const check = await fetch("/api/wallet/withdraw")
        .then((r) => r.json())
        .catch(() => null);
      if (check?.failedRule) {
        setRuleModal({
          rule: check.failedRule,
          unlockAt: check.unlockAt ?? null,
          balance: check.balance ?? balance,
        });
        return;
      }
      const res = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coins: parseInt(withdrawCoins, 10),
          cardNumber: cardNumber.replace(/\s/g, ""),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.failedRule) {
          setRuleModal({
            rule: data.failedRule,
            unlockAt: data.unlockAt ?? null,
            balance,
          });
          return;
        }
        setWMsg({ ok: false, text: data.error ?? "خطایی رخ داد" });
        return;
      }
      setWMsg({
        ok: true,
        text: "درخواست برداشت ثبت شد و پس از تایید مدیر واریز می شود",
      });
      setWithdrawCoins("");
      setCardNumber("");
      router.refresh();
    } catch {
      setWMsg({ ok: false, text: "خطا در ارتباط با سرور" });
    } finally {
      setWLoading(false);
    }
  }

  async function handleClaim(missionId: string) {
    setClaimingId(missionId);
    try {
      const res = await fetch("/api/missions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ missionId }),
      });
      if (!res.ok) return;
      await fetchMissions();
      router.refresh();
    } catch {
      // خطای شبکه
    } finally {
      setClaimingId(null);
    }
  }

  function copyReferralCode() {
    const link = `${window.location.origin}/register?ref=${referralCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const filteredTransactions = transactions.filter((t) => {
    if (historyFilter === "in") return t.coins > 0;
    if (historyFilter === "out") return t.coins < 0;
    return true;
  });
  const pagedTransactions = filteredTransactions.slice(
    historyPage * pageSize,
    (historyPage + 1) * pageSize
  );

  const pkg = coinPackages[selectedPkg];
  const basePrice = pkg.coins * coinValue;
  const discountAmount = Math.round((basePrice * pkg.discount) / 100);
  const finalPrice = basePrice - discountAmount;
  const withdrawAmount = (parseInt(withdrawCoins, 10) || 0) * coinValue;
  const withdrawFee = Math.round(withdrawAmount * 0.09);
  const withdrawNet = withdrawAmount - withdrawFee;
  const hasMinBalance = balance >= MIN_BALANCE_FOR_WITHDRAW;

  const tabs: { key: Tab; label: string; icon: typeof Coins }[] = [
    { key: "buy" as Tab, label: "خرید سکه", icon: ArrowDown },
    { key: "sell" as Tab, label: "برداشت سکه", icon: ArrowUp },
    { key: "history" as Tab, label: "تاریخچه", icon: Clock },
  ].filter((t) => {
    if (t.key === "buy") return buyCoinsEnabled;
    if (t.key === "sell") return withdrawCoinsEnabled;
    return true;
  });

  // اگر تب فعال غیرفعال شده، به تب موجود اولیه برو
  const activeTab = tabs.find((t) => t.key === tab);
  const resolvedTab = activeTab ? tab : tabs[0]?.key ?? "history";
  const animBalance = useCountUp(balance);

  return (
    <div className="space-y-4">
      {/* === کارت موجودی با شمارش متحرک و دکمه های سریع === */}
      <div className="rounded-xl border border-ig-border bg-surface p-6 ig-rise">
        <p className="text-sm text-ig-gray text-center mb-1">موجودی سکه</p>
        <div className="flex items-center justify-center gap-2">
          <Coins
            className={cn(
              "w-7 h-7 text-ig-gold",
              animBalance === balance && "ig-coin-spin"
            )}
            fill="currentColor"
            aria-hidden
          />
          <p
            className="text-4xl font-black tracking-tight text-foreground tabular-nums"
            aria-label={`${balance} سکه`}
          >
            {toPersianDigits(
              animBalance.toLocaleString("en-US").replace(/,/g, "،")
            )}
          </p>
        </div>
        <p className="text-center text-sm text-ig-gray mt-1">
          معادل {formatToman(animBalance * coinValue)}
        </p>
        <div className="h-px bg-ig-divider my-4" />
        <div className="flex justify-around">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className="flex flex-col items-center gap-1.5 px-4 py-2 rounded-lg hover:bg-ig-gray-bg active:scale-95 transition-all"
            >
              <span
                className={cn(
                  "w-11 h-11 rounded-full flex items-center justify-center transition-colors",
                  resolvedTab === t.key
                    ? "bg-ig-blue text-white"
                    : "bg-ig-btn2 text-foreground"
                )}
              >
                <t.icon className="w-5 h-5" strokeWidth={2} aria-hidden />
              </span>
              <span className="text-xs font-bold text-foreground">
                {t.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* تعویض تب فقط با دکمه های کارت موجودی انجام می شود */}

      {/* === تب خرید سکه === */}
      {resolvedTab === "buy" && (
        <div key="buy" className="space-y-4 ig-rise">
          {/* بنر تخفیف روز */}
          <div className="rounded-2xl bg-ig-blue p-4 text-white">
            <div className="flex items-center gap-2 mb-1">
              <Flame className="w-5 h-5" fill="currentColor" />
              <span className="text-sm font-black">تخفیف روز</span>
            </div>
            <p className="text-xs opacity-75">
              امروز با تخفیف ویژه سکه بخرید! تا ۲۵٪ تخفیف برای پکیج های بزرگ تر
            </p>
          </div>

          {/* پکیج های سکه */}
          <form
            onSubmit={handleBuy}
            className="bg-surface border border-ig-border rounded-2xl p-5 space-y-4"
          >
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Coins
                className="w-5 h-5 text-foreground"
                fill="currentColor"
                strokeWidth={1.5}
              />
              خرید سکه
            </h2>

            <div
              role="radiogroup"
              aria-label="پکیج سکه"
              className="grid grid-cols-2 md:grid-cols-3 gap-2"
            >
              {coinPackages.map((p, i) => {
                const pBase = p.coins * coinValue;
                const pFinal = pBase - Math.round((pBase * p.discount) / 100);
                return (
                  <button
                    key={p.coins}
                    type="button"
                    role="radio"
                    aria-checked={selectedPkg === i}
                    onClick={() => setSelectedPkg(i)}
                    className={cn(
                      "relative py-3 px-2 rounded-xl text-center border-2 transition-all duration-200 active:scale-95",
                      selectedPkg === i
                        ? "border-ig-blue bg-ig-gray-bg scale-[1.03] shadow-sm"
                        : "border-ig-border hover:border-ig-gray"
                    )}
                  >
                    {selectedPkg === i && (
                      <span
                        className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-ig-blue text-white flex items-center justify-center ig-pop"
                        aria-hidden
                      >
                        <Check className="w-3 h-3" strokeWidth={3} />
                      </span>
                    )}
                    {p.badge && (
                      <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-xs font-bold px-2 py-0.5 rounded-full bg-ig-blue text-white whitespace-nowrap">
                        {p.badge}
                      </span>
                    )}
                    <p className="text-sm font-black text-foreground">
                      {toPersianDigits(p.coins)}
                    </p>
                    <p className="text-xs text-ig-gray">سکه</p>
                    {p.discount > 0 && (
                      <p className="text-xs text-foreground font-bold mt-0.5">
                        {toPersianDigits(p.discount)}٪ تخفیف
                      </p>
                    )}
                    <p className="text-xs font-bold text-foreground mt-0.5">
                      {formatToman(pFinal)}
                    </p>
                  </button>
                );
              })}
            </div>

            {pkg.discount > 0 && (
              <div className="flex items-center justify-between text-xs bg-ig-btn2 rounded-lg px-3 py-2">
                <span className="text-foreground font-bold">تخفیف شما:</span>
                <span className="text-foreground font-bold">
                  {formatToman(discountAmount)}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between text-sm">
              <span className="text-ig-gray">مبلغ قابل پرداخت:</span>
              <span className="font-bold text-foreground">
                {formatToman(finalPrice)}
              </span>
            </div>

            {buyMsg && (
              <p
                className={`text-sm rounded-lg px-4 py-3 ${
                  buyMsg.ok
                    ? "bg-ig-btn2 text-foreground"
                    : "bg-ig-gray-bg text-ig-red"
                }`}
              >
                {buyMsg.text}
              </p>
            )}

            {/* دکمه پرداخت درون کارت (بدون چسبندگی — داخل جفت حاشیه کارت) */}
            <div className="pt-1">
              <Button type="submit" size="lg" fullWidth loading={buyLoading}>
                {buyLoading
                  ? "در حال انتقال به درگاه..."
                  : `پرداخت ${formatToman(finalPrice)}`}
              </Button>
            </div>
          </form>

          {/* ماموریت های روزانه */}
          <div className="bg-surface border border-ig-border rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Sparkles
                  className="w-5 h-5 text-foreground"
                  strokeWidth={1.5}
                />
                ماموریت های روزانه
              </h2>
              <span className="text-xs text-ig-gray font-bold">
                {toPersianDigits(
                  missions.filter((m) => m.completed && !m.claimed).length
                )}{" "}
                پاداش آماده دریافت
              </span>
            </div>

            {missionsLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-ig-gray" />
              </div>
            ) : (
              <div className="space-y-2.5">
                {missions.map((m, idx) => {
                  const MissionIcon = MISSION_ICONS[m.key] ?? Sparkles;
                  const pct = Math.min(100, (m.progress / m.target) * 100);
                  return (
                    <div
                      key={m.id}
                      style={{ animationDelay: `${idx * 50}ms` }}
                      className={`rounded-2xl p-3 border transition-all ig-rise ${
                        m.claimed
                          ? "border-ig-border bg-ig-gray-bg"
                          : "border-neutral-200 bg-ig-gray-bg"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-ig-btn2 flex items-center justify-center shrink-0">
                          <MissionIcon className="w-4 h-4 text-foreground" strokeWidth={1.75} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <p className="text-xs font-bold text-foreground truncate">{m.title}</p>
                            {m.claimed ? (
                              <span className="w-5 h-5 rounded-full bg-ig-blue flex items-center justify-center shrink-0 ig-pop">
                                <Check className="w-3 h-3 text-white" strokeWidth={3} />
                              </span>
                            ) : m.completed ? (
                              <button
                                type="button"
                                onClick={() => handleClaim(m.id)}
                                disabled={claimingId === m.id}
                                className="px-3 py-1 rounded-full bg-ig-blue text-white text-xs font-bold hover:bg-ig-blue-hover transition-all active:scale-90 disabled:opacity-50 shrink-0 ig-pop"
                              >
                                {claimingId === m.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  `+${toPersianDigits(m.rewardCoins)}`
                                )}
                              </button>
                            ) : (
                              <span className="text-xs font-bold text-ig-gray shrink-0">
                                +{toPersianDigits(m.rewardCoins)} سکه
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-neutral-400 mt-0.5 truncate">{m.description}</p>

                          <div className="mt-1.5 flex items-center gap-1.5">
                            <div className="h-1.5 flex-1 rounded-full bg-neutral-200 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-[width] duration-700 ease-out ${
                                  m.completed ? "bg-ig-blue" : "bg-neutral-400"
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            {m.target > 1 && (
                              <span className="text-[10px] text-ig-gray font-bold shrink-0">
                                {toPersianDigits(m.progress)}/{toPersianDigits(m.target)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* دعوت دوستان */}
          <div className="bg-surface border border-ig-border rounded-2xl p-5 space-y-3">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Gift className="w-5 h-5 text-foreground" strokeWidth={1.5} />
              سکه رایگان با دعوت دوستان
            </h2>
            <p className="text-xs text-ig-gray leading-5">
              برای هر دوستی که با کد دعوت شما ثبت نام کند، هر دو ۲۰ سکه پاداش می
              گیرید
            </p>
            <div className="flex items-center gap-2">
              <div
                className="flex-1 px-4 py-3 rounded-lg bg-ig-gray-bg text-sm font-bold text-foreground text-center"
                dir="ltr"
              >
                {referralCode}
              </div>
              <Button
                type="button"
                size="lg"
                onClick={copyReferralCode}
                aria-live="polite"
                className="min-w-16"
              >
                {copied ? (
                  <Check key="ok" className="w-5 h-5 ig-pop" strokeWidth={3} />
                ) : (
                  "کپی"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* === تب برداشت سکه === */}
      {resolvedTab === "sell" && (
        <div key="sell" className="space-y-4 ig-rise">
          {/* اطلاعات فروش */}
          <div className="bg-surface border border-ig-border rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Banknote className="w-5 h-5 text-foreground" strokeWidth={1.5} />
              تبدیل سکه به ریال
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-ig-gray-bg border border-ig-border p-3 text-center">
                <p className="text-xs text-ig-gray font-bold">موجودی شما</p>
                <p className="text-base font-black text-foreground mt-1">
                  {formatCoins(balance)}
                </p>
              </div>
              <div className="rounded-xl bg-ig-gray-bg border border-ig-border p-3 text-center">
                <p className="text-xs text-ig-gray font-bold">ارزش هر سکه</p>
                <p className="text-base font-black text-foreground mt-1">
                  {formatToman(coinValue)}
                </p>
              </div>
            </div>

            {!hasMinBalance && (
              <p className="text-sm bg-ig-btn2 text-ig-gray rounded-lg px-4 py-3">
                برای برداشت باید حداقل {toPersianDigits(MIN_BALANCE_FOR_WITHDRAW)}{" "}
                سکه موجودی داشته باشید
              </p>
            )}

            <form onSubmit={handleWithdraw} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-ig-gray mb-1.5 block">
                  تعداد سکه
                </label>
                <input
                  type="number"
                  dir="ltr"
                  min={minWithdrawCoins}
                  value={withdrawCoins}
                  onChange={(e) => setWithdrawCoins(e.target.value)}
                  className={inputClass}
                  placeholder={`حداقل ${minWithdrawCoins} سکه`}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-ig-gray mb-1.5 block">
                  شماره کارت
                </label>
                <input
                  type="text"
                  dir="ltr"
                  inputMode="numeric"
                  maxLength={19}
                  value={cardNumber}
                  onChange={(e) =>
                    setCardNumber(formatCardNumber(e.target.value))
                  }
                  className={inputClass}
                  placeholder="XXXX XXXX XXXX XXXX"
                />
                {detectBank(cardNumber) && (
                  <div className="flex items-center gap-1.5 mt-2 px-1">
                    {detectBank(cardNumber)!.logo ? (
                      <Image
                        src={detectBank(cardNumber)!.logo!}
                        alt={detectBank(cardNumber)!.name}
                        width={20}
                        height={20}
                        unoptimized
                        className="w-5 h-5 object-contain"
                      />
                    ) : (
                      <Check
                        className="w-4 h-4 text-ig-gray shrink-0"
                        strokeWidth={2.5}
                      />
                    )}
                    <span className="text-xs font-bold text-foreground">
                      {detectBank(cardNumber)!.name}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2 bg-ig-btn2 rounded-lg px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-ig-gray font-bold">
                    مبلغ اولیه
                  </span>
                  <span className="text-xs font-bold text-foreground">
                    {formatToman(withdrawAmount)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-ig-gray font-bold">
                    کارمزد برداشت (۹٪)
                  </span>
                  <span className="text-xs font-bold text-ig-red" dir="ltr">
                    {withdrawCoins ? `-${formatToman(withdrawFee)}` : "—"}
                  </span>
                </div>
                <div className="h-px bg-ig-border" />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground font-black">
                    مبلغ دریافتی
                  </span>
                  <span className="text-sm font-black text-foreground">
                    {withdrawCoins ? formatToman(withdrawNet) : "—"}
                  </span>
                </div>
              </div>

              {wMsg && (
                <p
                  className={`text-sm rounded-lg px-4 py-3 ${
                    wMsg.ok
                      ? "bg-ig-btn2 text-foreground"
                      : "bg-ig-gray-bg text-ig-red"
                  }`}
                >
                  {wMsg.text}
                </p>
              )}

              {/* دکمه ثبت درون کارت (بدون چسبندگی) */}
              <div className="pt-1">
                <Button
                  type="submit"
                  size="lg"
                  fullWidth
                  loading={wLoading}
                >
                  {wLoading ? "در حال ثبت..." : "ثبت درخواست برداشت"}
                </Button>
              </div>
            </form>
          </div>

        </div>
      )}

      {/* === تب تاریخچه === */}
      {resolvedTab === "history" && (
        <div key="history" className="space-y-3 ig-rise">
          {/* فیلتر نوع تراکنش */}
          {transactions.length > 0 && (
            <div className="flex gap-2">
              {(
                [
                  ["all", "همه"],
                  ["in", "ورودی"],
                  ["out", "خرجی"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setHistoryFilter(key);
                    setHistoryPage(0);
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 ${
                    historyFilter === key
                      ? "bg-foreground text-white"
                      : "bg-ig-btn2 text-foreground hover:bg-ig-btn2-hover"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
          {transactions.length === 0 ? (
            <div className="bg-surface border border-ig-border rounded-2xl p-8 text-center">
              <Clock
                className="w-10 h-10 text-neutral-300 mx-auto mb-3"
                strokeWidth={1.5}
              />
              <p className="text-sm font-bold text-foreground">
                هنوز تراکنشی ثبت نشده است
              </p>
              <p className="text-xs text-ig-gray mt-1">
                با خرید سکه یا انجام ماموریت ها اولین تراکنش خود را ثبت کنید
              </p>
            </div>
          ) : (
            <>
              {/* خلاصه تراکنش ها */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-surface border border-ig-border p-3 text-center">
                  <ArrowDown
                    className="w-5 h-5 text-ig-gray mx-auto mb-1"
                    strokeWidth={2}
                  />
                  <p className="text-lg font-black text-ig-gray">
                    {formatCoins(
                      transactions
                        .filter((t) => t.coins > 0 && t.status !== "FAILED")
                        .reduce((s, t) => s + t.coins, 0)
                    )}
                  </p>
                  <p className="text-xs text-ig-gray font-bold">ورودی</p>
                </div>
                <div className="rounded-xl bg-surface border border-ig-border p-3 text-center">
                  <ArrowUp
                    className="w-5 h-5 text-ig-red mx-auto mb-1"
                    strokeWidth={2}
                  />
                  <p className="text-lg font-black text-ig-red">
                    {formatCoins(
                      Math.abs(
                        transactions
                          .filter((t) => t.coins < 0 && t.status !== "FAILED")
                          .reduce((s, t) => s + t.coins, 0)
                      )
                    )}
                  </p>
                  <p className="text-xs text-ig-gray font-bold">خرجی</p>
                </div>
              </div>

              {/* لیست تراکنش ها — صفحه بندی */}
              {pagedTransactions.length === 0 ? (
                <div className="bg-surface border border-ig-border rounded-2xl p-6 text-center">
                  <p className="text-sm font-bold text-foreground">
                    تراکنشی با این فیلتر نیست
                  </p>
                </div>
              ) : null}
              <div className="bg-surface border border-ig-border rounded-2xl overflow-hidden divide-y divide-ig-border">
                {pagedTransactions.map((t, idx) => {
                  const isFailed = t.status === "FAILED";
                  const isPositive = t.coins > 0;
                  return (
                    <div
                      key={t.id}
                      style={{ animationDelay: `${idx * 40}ms` }}
                      className="flex items-center justify-between gap-3 px-4 py-3 ig-rise"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            isFailed
                              ? "bg-ig-gray-bg"
                              : isPositive
                              ? "bg-ig-gray-bg"
                              : "bg-ig-gray-bg"
                          }`}
                        >
                          {isFailed ? (
                            <span className="text-xs font-bold text-ig-red">
                              ناموفق
                            </span>
                          ) : isPositive ? (
                            <ArrowDown
                              className="w-4 h-4 text-ig-gray"
                              strokeWidth={2}
                            />
                          ) : (
                            <ArrowUp
                              className="w-4 h-4 text-ig-red"
                              strokeWidth={2}
                            />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-foreground truncate">
                            {t.description ?? typeLabels[t.type] ?? t.type}
                          </p>
                          <p className="text-xs text-ig-gray">
                            {formatDateTime(t.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="text-left shrink-0">
                        {isFailed ? (
                          <p className="text-sm font-black text-ig-red">—</p>
                        ) : (
                          <p
                            className={`text-sm font-black ${
                              isPositive ? "text-ig-gray" : "text-ig-red"
                            }`}
                          >
                            {isPositive ? "+" : ""}
                            {toPersianDigits(t.coins)}
                          </p>
                        )}
                        <p
                          className={`text-xs ${
                            isFailed ? "text-ig-red font-bold" : "text-ig-gray"
                          }`}
                        >
                          {isFailed
                            ? "ناموفق"
                            : t.status === "PENDING"
                            ? "در انتظار"
                            : t.status === "COMPLETED"
                            ? "موفق"
                            : t.status === "REJECTED"
                            ? "رد شده"
                            : t.status}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* دکمه های صفحه بندی */}
              {filteredTransactions.length > pageSize && (
                <div className="flex items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setHistoryPage((p) => Math.max(0, p - 1))}
                    disabled={historyPage === 0}
                    className="w-9 h-9 rounded-lg border border-ig-border flex items-center justify-center text-ig-gray hover:text-foreground hover:border-neutral-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-bold text-ig-gray px-3">
                    {toPersianDigits(historyPage + 1)} /{" "}
                    {toPersianDigits(
                      Math.ceil(filteredTransactions.length / pageSize)
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setHistoryPage((p) =>
                        Math.min(
                          Math.ceil(filteredTransactions.length / pageSize) - 1,
                          p + 1
                        )
                      )
                    }
                    disabled={
                      historyPage >=
                      Math.ceil(filteredTransactions.length / pageSize) - 1
                    }
                    className="w-9 h-9 rounded-lg border border-ig-border flex items-center justify-center text-ig-gray hover:text-foreground hover:border-neutral-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* === مودال قوانین برداشت — فقط اولین قانون رد شده نمایش داده می شود === */}
      <BottomSheet
        open={ruleModal !== null}
        onClose={() => setRuleModal(null)}
        title="قوانین برداشت"
      >
        <div className="px-5 pt-4 pb-6">
          {/* قانون ۱: گذشت ۱۵ روز از ثبت نام */}
          {ruleModal?.rule === 1 && (
            <div className="text-center">
              <span className="w-16 h-16 rounded-full bg-ig-gray-bg border border-ig-divider mx-auto flex items-center justify-center">
                <Clock className="w-8 h-8 text-foreground" strokeWidth={1.8} />
              </span>
              <p className="text-sm font-bold text-foreground mt-3">
                حساب شما هنوز نو است
              </p>
              <p className="text-xs text-ig-gray mt-1.5 leading-5">
                برای برداشت باید ۱۵ روز از ثبت نام شما گذشته باشد
              </p>
              <div className="mt-4 rounded-xl bg-ig-gray-bg px-4 py-3">
                <p className="text-xs text-ig-gray mb-1">
                  زمان باقی مانده تا فعال شدن برداشت
                </p>
                <p className="text-base font-black text-foreground">
                  {ruleModal.unlockAt ? (
                    <>
                      <WithdrawCountdown until={ruleModal.unlockAt} />
                      <span className="block text-xs font-bold text-ig-gray mt-1">
                        روز : ساعت : دقیقه : ثانیه
                      </span>
                    </>
                  ) : (
                    "—"
                  )}
                </p>
              </div>
            </div>
          )}

          {/* قانون ۲: حداقل موجودی سکه */}
          {ruleModal?.rule === 2 && (
            <div className="text-center">
              <span className="w-16 h-16 rounded-full bg-ig-gray-bg border border-ig-divider mx-auto flex items-center justify-center">
                <Coins
                  className="w-8 h-8 text-ig-gold"
                  strokeWidth={1.8}
                  fill="currentColor"
                />
              </span>
              <p className="text-sm font-bold text-foreground mt-3">
                موجودی سکه کافی نیست
              </p>
              <p className="text-xs text-ig-gray mt-1.5 leading-5">
                برای برداشت باید حداقل{" "}
                {toPersianDigits(MIN_BALANCE_FOR_WITHDRAW)} سکه موجودی داشته
                باشید. موجودی فعلی شما {toPersianDigits(ruleModal.balance)} سکه
                است.
              </p>
              <div className="mt-4">
                <Button
                  type="button"
                  size="lg"
                  fullWidth
                  onClick={() => {
                    setRuleModal(null);
                    setTab("buy");
                  }}
                >
                  خرید سکه
                </Button>
                <p className="text-xs text-ig-gray mt-3 flex items-center justify-center gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5" />
                  یا در چت ها از کاربران درخواست سکه کنید
                </p>
              </div>
            </div>
          )}

          {/* قانون ۳: اشتراک ویژه */}
          {ruleModal?.rule === 3 && (
            <div className="text-center">
              <span className="w-16 h-16 rounded-full bg-ig-gray-bg border border-ig-divider mx-auto flex items-center justify-center">
                <Crown className="w-8 h-8 text-ig-gold" strokeWidth={1.8} />
              </span>
              <p className="text-sm font-bold text-foreground mt-3">
                اشتراک ویژه لازم است
              </p>
              <p className="text-xs text-ig-gray mt-1.5 leading-5">
                برای برداشت سکه باید اشتراک ویژه فعال داشته باشید
              </p>
              <div className="mt-4">
                <Link
                  href="/dashboard/subscription"
                  className="w-full h-11 rounded-lg bg-ig-blue text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-ig-blue-hover active:scale-[0.98] transition-all"
                >
                  خرید اشتراک ویژه
                </Link>
              </div>
            </div>
          )}

          {/* قانون ۴: احراز هویت کامل */}
          {ruleModal?.rule === 4 && (
            <div className="text-center">
              <span className="w-16 h-16 rounded-full bg-ig-gray-bg border border-ig-divider mx-auto flex items-center justify-center">
                <ShieldCheck
                  className="w-8 h-8 text-foreground"
                  strokeWidth={1.8}
                />
              </span>
              <p className="text-sm font-bold text-foreground mt-3">
                احراز هویت لازم است
              </p>
              <p className="text-xs text-ig-gray mt-1.5 leading-5">
                برای برداشت سکه باید احراز هویت کامل انجام دهید
              </p>
              <div className="mt-4">
                <Link
                  href="/dashboard/verify?tab=kyc"
                  className="w-full h-11 rounded-lg bg-ig-blue text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-ig-blue-hover active:scale-[0.98] transition-all"
                >
                  ورود به بخش احراز هویت
                </Link>
              </div>
            </div>
          )}
        </div>
      </BottomSheet>
    </div>
  );
}
