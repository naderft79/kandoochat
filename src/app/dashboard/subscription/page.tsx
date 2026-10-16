// صفحه اشتراک: پلن های زمانی (۱ماهه تا مادام العمر)، روزهای باقی مانده، تایید قبل از خرید
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { Crown, Check } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { isUserApp } from "@/lib/app-ua";
import { ensureWallet, getActiveSubscription } from "@/lib/finance";
import { formatDate, toPersianDigits } from "@/lib/format";
import { SUBSCRIPTION_PLANS } from "@/lib/subscriptionPlans";
import SubscriptionPlans from "@/components/dashboard/SubscriptionPlans";
import PaymentResultModal from "@/components/dashboard/PaymentResultModal";
import PageHeader from "@/components/dashboard/PageHeader";
import CoinBadge from "@/components/dashboard/CoinBadge";

// محاسبه روزهای باقی مانده اشتراک — خارج از بدنه کامپوننت (توابع ناخالص در render مجاز نیستند)
function calcDaysLeft(endsAt: string | Date) {
  return Math.max(
    0,
    Math.ceil((new Date(endsAt).getTime() - Date.now()) / 86_400_000)
  );
}

export default async function SubscriptionPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [wallet, active, h] = await Promise.all([
    ensureWallet(user.id),
    getActiveSubscription(user.id),
    headers(),
  ]);
  // در اپ اندروید (سیاست گوگل پلی) خرید اشتراک نمایش داده نمی شود — فقط وضعیت فعلی
  const inApp = isUserApp(h.get("user-agent"));

  const daysLeft = active ? calcDaysLeft(active.endsAt) : 0;
  // اشتراک مادام العمر — تاریخ پایان خیلی دور است
  const isLifetime = daysLeft > 365 * 50;

  return (
    <div>
      <PageHeader
        title="اشتراک"
        icon={<Crown className="w-5 h-5 text-foreground" strokeWidth={1.8} />}
        left={<CoinBadge />}
      />
      <div className="max-w-[600px] mx-auto px-4 md:px-6 pt-4 md:pt-6 pb-4 space-y-4">
        {active && (
          <div className="rounded-xl border border-ig-border bg-surface p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-ig-gray-bg flex items-center justify-center shrink-0">
              <Check className="w-5 h-5 text-foreground" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">
                اشتراک {active.tier} شما فعال است
              </p>
              <p className="text-xs text-ig-gray mt-0.5">
                {isLifetime
                  ? "بدون تاریخ انقضا — مادام العمر"
                  : `${toPersianDigits(daysLeft)} روز باقی مانده — تا ${formatDate(active.endsAt)}`}
              </p>
            </div>
          </div>
        )}

        {inApp ? (
          <div className="rounded-xl border border-ig-border bg-surface p-5 text-center">
            <Crown className="w-8 h-8 text-ig-gray mx-auto mb-2" strokeWidth={1.5} />
            <p className="text-sm font-bold text-foreground">
              {active ? "اشتراک شما فعال است" : "اشتراک فعالی ندارید"}
            </p>
            <p className="text-xs text-ig-gray mt-1">
              برای مشاهده جزئیات و مدیریت اشتراک به نسخه وب مراجعه کنید
            </p>
          </div>
        ) : (
          <SubscriptionPlans
            plans={SUBSCRIPTION_PLANS}
            balance={wallet.balance}
            isRenewal={!!active}
          />
        )}
      </div>
      <PaymentResultModal />
    </div>
  );
}
