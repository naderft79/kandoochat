"use client";

// دکمه خرید اشتراک — با سکه یا پرداخت ریالی از KandooPay
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Crown, CreditCard, Loader2 } from "lucide-react";
import { isMarketBillingAvailable, purchaseProduct } from "@/lib/marketBilling";

export default function BuySubscriptionButton({
  hasEnoughCoins,
  isRenewal,
}: {
  hasEnoughCoins: boolean;
  isRenewal: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  async function buyWithCoins() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/subscription", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "خطایی رخ داد");
        return;
      }
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
      // اپ مارکتی — پرداخت درون برنامه ای مارکت به جای کندوپی
      if (isMarketBillingAvailable()) {
        const productId = "sub_1m";
        const purchase = await purchaseProduct(productId);
        const res = await fetch("/api/iap/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...purchase, productId }),
        });
        const data = await res.json();
        setRedirecting(false);
        if (!res.ok) {
          setError(data.error ?? "خطا در تایید پرداخت");
          return;
        }
        router.refresh();
        return;
      }
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
    <div className="space-y-3">
      {error && (
        <p className="text-sm text-ig-red text-center">{error}</p>
      )}

      {/* دکمه خرید با سکه — فقط اگر موجودی کافی باشد */}
      {hasEnoughCoins && (
        <button
          onClick={buyWithCoins}
          disabled={loading || redirecting}
          className="w-full py-2.5 rounded-lg bg-ig-blue text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Crown className="w-4 h-4" />
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              در حال فعال سازی...
            </>
          ) : isRenewal ? "تمدید با سکه" : "فعال سازی با سکه"}
        </button>
      )}

      {/* دکمه خرید ریالی — همیشه موجود */}
      <button
        onClick={buyWithRial}
        disabled={loading || redirecting}
        className="w-full py-2.5 rounded-lg bg-ig-blue text-white text-sm font-bold hover:bg-ig-blue-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {redirecting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            در حال انتقال به درگاه...
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4" />
            پرداخت ریالی (درگاه پرداخت)
          </>
        )}
      </button>

      {!hasEnoughCoins && (
        <Link
          href="/dashboard/coins"
          className="block text-center text-xs text-ig-gray hover:text-foreground transition-colors"
        >
          برای خرید با سکه، ابتدا سکه خریداری کنید
        </Link>
      )}
    </div>
  );
}
