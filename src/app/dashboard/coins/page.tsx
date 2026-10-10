// صفحه کیف پول: ۳ تب خرید، فروش، تاریخچه
import { redirect } from "next/navigation";
import { Wallet } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getAllSettings } from "@/lib/settings";
import { ensureWallet } from "@/lib/finance";
import CoinsActions from "@/components/dashboard/CoinsActions";
import PageHeader from "@/components/dashboard/PageHeader";
import CoinBadge from "@/components/dashboard/CoinBadge";
import PaymentResultModal from "@/components/dashboard/PaymentResultModal";

export default async function CoinsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [wallet, settings, transactions] = await Promise.all([
    ensureWallet(user.id),
    getAllSettings(),
    prisma.transaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

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
      />
      </div>
      <PaymentResultModal />
    </div>
  );
}
