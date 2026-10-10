// صفحه اشتراک: پلن های زمانی (۱ماهه تا مادام العمر)، روزهای باقی مانده، تایید قبل از خرید
import { redirect } from "next/navigation";
import { Crown, Check } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
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

  const [wallet, active] = await Promise.all([
    ensureWallet(user.id),
    getActiveSubscription(user.id),
  ]);

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
          <div className="rounded-xl border border-ig-border bg-white p-4 flex items-center gap-3">
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

        <SubscriptionPlans
          plans={SUBSCRIPTION_PLANS}
          balance={wallet.balance}
          isRenewal={!!active}
        />
      </div>
      <PaymentResultModal />
    </div>
  );
}
