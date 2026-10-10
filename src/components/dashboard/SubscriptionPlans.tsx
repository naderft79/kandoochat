"use client";

// کارت های پلن اشتراک — تایید قبل از مصرف سکه
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Crown, Check, CreditCard, Loader2 } from "lucide-react";
import Dialog from "@/components/ui/Dialog";
import { formatCoins, toPersianDigits } from "@/lib/format";

export type Tier = {
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
};

function tierBenefits(t: Tier): string[] {
  const items = [
    `${toPersianDigits(t.dailyLikes)} لایک در روز`,
    `${toPersianDigits(t.dailySuperLikes)} سوپر لایک در روز`,
  ];
  if (t.canSeeLikers) items.push("دیدن کسانی که شما را لایک کرده اند");
  if (t.canRewindLast) items.push("بازگشت آخرین لایک");
  if (t.canHideOnline) items.push("مخفی کردن وضعیت آنلاین");
  if (t.canSendGifts) items.push("ارسال هدیه سکه");
  if (t.profileBoost) items.push("بوست رایگان پروفایل");
  return items;
}

export default function SubscriptionPlans({
  tiers,
  balance,
  isRenewal,
  rialPrice,
}: {
  tiers: Tier[];
  balance: number;
  isRenewal: boolean;
  rialPrice: string;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string>(
    tiers[Math.min(1, tiers.length - 1)]?.key ?? tiers[0]?.key
  );
  const [confirmTier, setConfirmTier] = useState<Tier | null>(null);
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState("");

  const current = tiers.find((t) => t.key === selected) ?? tiers[0];
  const hasEnough = balance >= (current?.coinsPerMonth ?? Infinity);

  async function buyWithCoins() {
    if (!confirmTier) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: confirmTier.key }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "خطایی رخ داد");
        return;
      }
      setConfirmTier(null);
      router.refresh();
    } catch {
      setError("خطا در ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  }

  async function buyWithRial() {
    setError("");
    setRedirecting(true);
    try {
      const res = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "SUBSCRIPTION" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "خطایی رخ داد");
        setRedirecting(false);
        return;
      }
      window.location.href = data.redirectUrl;
    } catch {
      setError("خطا در ارتباط با سرور");
      setRedirecting(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* کارت های پلن */}
      <div className="grid gap-3">
        {tiers.map((t, i) => {
          const active = selected === t.key;
          const suggested = i === Math.min(1, tiers.length - 1); // پلن میانی پیشنهادی
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setSelected(t.key)}
              className={`relative w-full text-right rounded-2xl border-2 p-4 transition-colors ${
                active
                  ? "border-foreground bg-white"
                  : "border-ig-border bg-white hover:border-neutral-400"
              }`}
            >
              {suggested && (
                <span className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full bg-ig-btn2 text-xs font-bold text-foreground">
                  پیشنهادی
                </span>
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Crown
                    className={`w-5 h-5 ${
                      active ? "text-foreground" : "text-ig-gray"
                    }`}
                  />
                  <span className="text-sm font-black text-foreground">
                    {t.name}
                  </span>
                </div>
                <span className="text-sm font-black text-foreground">
                  {formatCoins(t.coinsPerMonth)}
                </span>
              </div>
              <ul className="mt-3 space-y-1.5">
                {tierBenefits(t).map((b) => (
                  <li
                    key={b}
                    className="flex items-start gap-1.5 text-xs text-ig-gray"
                  >
                    <Check
                      className="w-3.5 h-3.5 shrink-0 mt-0.5 text-foreground"
                      strokeWidth={2.5}
                    />
                    {b}
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

      <p className="text-xs text-ig-gray text-center">
        موجودی شما:{" "}
        <span className="font-bold text-foreground">
          {formatCoins(balance)}
        </span>
      </p>

      {error && <p className="text-sm text-ig-red text-center">{error}</p>}

      {/* خرید با سکه */}
      <button
        onClick={() => current && setConfirmTier(current)}
        disabled={!hasEnough || loading || redirecting}
        className="w-full py-3 rounded-lg bg-ig-blue text-white text-sm font-bold hover:bg-ig-blue-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        <Crown className="w-4 h-4" />
        {isRenewal
          ? `تمدید ${current?.name ?? ""} با سکه`
          : `فعال سازی ${current?.name ?? ""} با سکه`}
      </button>

      {/* پرداخت ریالی */}
      <button
        onClick={buyWithRial}
        disabled={loading || redirecting}
        className="w-full py-3 rounded-lg bg-ig-btn2 text-foreground text-sm font-bold hover:bg-ig-btn2-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {redirecting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            در حال انتقال به درگاه...
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4" />
            پرداخت ریالی ({rialPrice})
          </>
        )}
      </button>

      {!hasEnough && (
        <Link
          href="/dashboard/coins"
          className="block text-center text-xs text-ig-gray hover:text-foreground transition-colors"
        >
          برای خرید با سکه، ابتدا سکه خریداری کنید
        </Link>
      )}

      {/* تایید قبل از مصرف سکه */}
      <Dialog
        open={confirmTier !== null}
        title={`فعال سازی اشتراک ${confirmTier?.name ?? ""}؟`}
        message={`${formatCoins(
          confirmTier?.coinsPerMonth ?? 0
        )} از کیف پول شما کسر می شود.`}
        onClose={() => setConfirmTier(null)}
        actions={[
          {
            label: loading ? "در حال فعال سازی..." : "تایید و فعال سازی",
            tone: "primary",
            onClick: buyWithCoins,
            disabled: loading,
          },
          { label: "انصراف", onClick: () => setConfirmTier(null) },
        ]}
      />
    </div>
  );
}
