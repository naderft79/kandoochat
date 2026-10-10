"use client";

// کارت های پلن اشتراک — فقط بر اساس مدت زمان (۱ماهه تا مادام العمر)
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Crown, Check, CreditCard, Loader2, Coins, Calendar, Infinity as InfinityIcon } from "lucide-react";
import Dialog from "@/components/ui/Dialog";
import { formatCoins, formatToman, toPersianDigits } from "@/lib/format";
import type { SubscriptionPlan } from "@/lib/subscriptionPlans";

export default function SubscriptionPlans({
  plans,
  balance,
  isRenewal,
}: {
  plans: SubscriptionPlan[];
  balance: number;
  isRenewal: boolean;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string>(plans[1]?.key ?? plans[0]?.key);
  const [confirmPlan, setConfirmPlan] = useState<SubscriptionPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState("");

  const current = plans.find((p) => p.key === selected) ?? plans[0];
  const hasEnough = balance >= (current?.coins ?? Infinity);

  async function buyWithCoins() {
    if (!confirmPlan) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: confirmPlan.key }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "خطایی رخ داد");
        return;
      }
      setConfirmPlan(null);
      router.refresh();
    } catch {
      setError("خطا در ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  }

  async function buyWithRial() {
    if (!current) return;
    setError("");
    setRedirecting(true);
    try {
      const res = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "SUBSCRIPTION", plan: current.key }),
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
        {plans.map((p) => {
          const active = selected === p.key;
          const lifetime = p.months === null;
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => setSelected(p.key)}
              className={`relative w-full text-right rounded-2xl border-2 p-4 transition-colors ${
                active
                  ? "border-foreground bg-white"
                  : "border-ig-border bg-white hover:border-neutral-400"
              }`}
            >
              {lifetime && (
                <span className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full bg-ig-gold text-xs font-bold text-white">
                  بهترین ارزش
                </span>
              )}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      lifetime ? "bg-ig-gold" : "bg-ig-gray-bg"
                    }`}
                  >
                    {lifetime ? (
                      <InfinityIcon className="w-5 h-5 text-white" strokeWidth={2} />
                    ) : (
                      <Calendar className="w-5 h-5 text-foreground" strokeWidth={1.8} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-foreground">{p.name}</p>
                    <p className="text-xs text-ig-gray mt-0.5">
                      {lifetime ? "پرداخت یکبار، دسترسی همیشگی" : `دسترسی کامل به مدت ${p.name}`}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end shrink-0">
                  <span className="text-sm font-black text-foreground">{formatToman(p.toman)}</span>
                  <span className="text-xs text-ig-gray mt-0.5 flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5" />
                    {formatCoins(p.coins)}
                  </span>
                </div>
              </div>
              {active && (
                <div className="absolute top-3 left-3 w-5 h-5 rounded-full bg-foreground flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" strokeWidth={3} />
                </div>
              )}
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
        onClick={() => current && setConfirmPlan(current)}
        disabled={!hasEnough || loading || redirecting}
        className="w-full py-3 rounded-lg bg-ig-blue text-white text-sm font-bold hover:bg-ig-blue-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        <Crown className="w-4 h-4" />
        {isRenewal
          ? `تمدید ${current?.name ?? ""} با ${current ? toPersianDigits(current.coins) : ""} سکه`
          : `فعال سازی ${current?.name ?? ""} با ${current ? toPersianDigits(current.coins) : ""} سکه`}
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
            پرداخت ریالی ({current ? formatToman(current.toman) : ""})
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
        open={confirmPlan !== null}
        title={`فعال سازی اشتراک ${confirmPlan?.name ?? ""}؟`}
        message={`${formatCoins(
          confirmPlan?.coins ?? 0
        )} از کیف پول شما کسر می شود.`}
        onClose={() => setConfirmPlan(null)}
        actions={[
          {
            label: loading ? "در حال فعال سازی..." : "تایید و فعال سازی",
            tone: "primary",
            onClick: buyWithCoins,
            disabled: loading,
          },
          { label: "انصراف", onClick: () => setConfirmPlan(null) },
        ]}
      />
    </div>
  );
}
