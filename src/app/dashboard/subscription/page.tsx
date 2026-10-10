// صفحه اشتراک: کارت های پلن، روزهای باقی مانده، تایید قبل از خرید
import { redirect } from "next/navigation";
import { Crown, Check } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getAllSettings } from "@/lib/settings";
import { ensureWallet, getActiveSubscription } from "@/lib/finance";
import { prisma } from "@/lib/prisma";
import { formatToman, formatDate, toPersianDigits } from "@/lib/format";
import SubscriptionPlans, {
  type Tier,
} from "@/components/dashboard/SubscriptionPlans";
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

  const [settings, wallet, active, dbTiers] = await Promise.all([
    getAllSettings(),
    ensureWallet(user.id),
    getActiveSubscription(user.id),
    prisma.subscriptionTier.findMany({
      where: { isActive: true },
      orderBy: { coinsPerMonth: "asc" },
    }),
  ]);

  // پلن های پیش فرض اگر جدول خالی است
  const tiers: Tier[] = dbTiers.length
    ? dbTiers.map((t) => ({
        key: t.key,
        name: t.name,
        coinsPerMonth: t.coinsPerMonth,
        dailyLikes: t.dailyLikes,
        dailySuperLikes: t.dailySuperLikes,
        canSeeLikers: t.canSeeLikers,
        canRewindLast: t.canRewindLast,
        canHideOnline: t.canHideOnline,
        canSendGifts: t.canSendGifts,
        profileBoost: t.profileBoost,
      }))
    : [
        {
          key: "BASIC",
          name: "پایه",
          coinsPerMonth: 100,
          dailyLikes: 30,
          dailySuperLikes: 1,
          canSeeLikers: false,
          canRewindLast: false,
          canHideOnline: false,
          canSendGifts: false,
          profileBoost: false,
        },
        {
          key: "PREMIUM",
          name: "پرمیوم",
          coinsPerMonth: 300,
          dailyLikes: 60,
          dailySuperLikes: 3,
          canSeeLikers: true,
          canRewindLast: true,
          canHideOnline: true,
          canSendGifts: true,
          profileBoost: false,
        },
        {
          key: "VIP",
          name: "VIP",
          coinsPerMonth: 600,
          dailyLikes: 100,
          dailySuperLikes: 5,
          canSeeLikers: true,
          canRewindLast: true,
          canHideOnline: true,
          canSendGifts: true,
          profileBoost: true,
        },
      ];

  const daysLeft = active ? calcDaysLeft(active.endsAt) : 0;

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
                {toPersianDigits(daysLeft)} روز باقی مانده — تا{" "}
                {formatDate(active.endsAt)}
              </p>
            </div>
          </div>
        )}

        <SubscriptionPlans
          tiers={tiers}
          balance={wallet.balance}
          isRenewal={!!active}
          rialPrice={formatToman(settings.subscriptionPrice)}
        />
      </div>
      <PaymentResultModal />
    </div>
  );
}
