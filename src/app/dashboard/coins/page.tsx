// صفحه کیف پول: ۳ تب خرید، فروش، تاریخچه
import { redirect } from "next/navigation";
import { Wallet } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getBrandSettings } from "@/lib/brandSettings";
import { getRequestBrandInfo } from "@/lib/brand-server";
import { ensureWallet, getActiveSubscription } from "@/lib/finance";
import { formatDate, toPersianDigits } from "@/lib/format";
import { SUBSCRIPTION_PLANS } from "@/lib/subscriptionPlans";
import CoinsActions from "@/components/dashboard/CoinsActions";
import PageHeader from "@/components/dashboard/PageHeader";
import CoinBadge from "@/components/dashboard/CoinBadge";
import PaymentResultModal from "@/components/dashboard/PaymentResultModal";

// محاسبه روزهای باقی مانده اشتراک — خارج از بدنه کامپوننت (توابع ناخالص در render مجاز نیستند)
function calcDaysLeft(endsAt: string | Date) {
  return Math.max(
    0,
    Math.ceil((new Date(endsAt).getTime() - Date.now()) / 86_400_000)
  );
}

export default async function CoinsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { brand } = await getRequestBrandInfo();
  const [wallet, settings, transactions, active] = await Promise.all([
    ensureWallet(user.id),
    getBrandSettings(brand.id),
    prisma.transaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    getActiveSubscription(user.id),
  ]);

  // وضعیت اشتراک فعال برای نمایش در تب اشتراک کیف پول
  const daysLeft = active ? calcDaysLeft(active.endsAt) : 0;
  const isLifetime = daysLeft > 365 * 50;
  const subStatus = active
    ? isLifetime
      ? "بدون تاریخ انقضا — مادام العمر"
      : `${toPersianDigits(daysLeft)} روز باقی مانده — تا ${formatDate(active.endsAt)}`
    : null;

  const serializedTransactions = transactions.map((t) => ({
    id: t.id,
    type: t.type,
    coins: t.coins,
    amountToman: t.amountToman,
    status: t.status,
    description: t.description,
    createdAt: t.createdAt.toISOString(),
  }));

  return (
    <div>
      {/* هدر یکپارچه */}
      <PageHeader
        title="کیف پول"
        icon={<Wallet className="w-5 h-5 text-foreground" strokeWidth={1.8} />}
        left={<CoinBadge />}
      />

      <div className="max-w-[600px] mx-auto px-4 md:px-6 pt-4 md:pt-6 pb-4 space-y-4">
      {/* تب ها: خرید، فروش، تاریخچه */}
      <CoinsActions
        coinValue={settings.coinValue}
        minWithdrawCoins={settings.minWithdrawCoins}
        balance={wallet.balance}
        referralCode={user.referralCode ?? user.id}
        transactions={serializedTransactions}
        buyCoinsEnabled={settings.buyCoinsEnabled}
        withdrawCoinsEnabled={settings.withdrawCoinsEnabled}
        plans={SUBSCRIPTION_PLANS}
        subTier={active?.tier ?? null}
        subStatus={subStatus}
      />
      </div>
      <PaymentResultModal />
    </div>
  );
}
