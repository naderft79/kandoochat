// صفحه آمار پیشرفته ادمین
import { prisma } from "@/lib/prisma";
import { formatToman, formatCoins, toPersianDigits } from "@/lib/format";
import { BarChart3, Users, Heart, MessageCircle, Gift, Rocket, Flag, TrendingUp } from "lucide-react";
import AdminCharts from "@/components/admin/AdminCharts";

export default async function AdminStatsPage() {
  const now = new Date();
  const dayAgo = new Date(now.getTime() - 86400000);
  const weekAgo = new Date(now.getTime() - 7 * 86400000);

  const [
    totalUsers,
    newUsersToday,
    newUsersWeek,
    activeSubs,
    totalMessages,
    messagesToday,
    totalLikes,
    superLikes,
    totalBoosts,
    activeBoosts,
    pendingReports,
    totalTransfers,
    transferCoinsSum,
    totalPurchases,
    purchaseSum,
    coinPurchaseCoins,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "USER" } }),
    prisma.user.count({ where: { role: "USER", createdAt: { gte: dayAgo } } }),
    prisma.user.count({ where: { role: "USER", createdAt: { gte: weekAgo } } }),
    prisma.subscription.count({ where: { endsAt: { gt: now } } }),
    prisma.message.count(),
    prisma.message.count({ where: { createdAt: { gte: dayAgo } } }),
    prisma.like.count({ where: { type: "LIKE" } }),
    prisma.like.count({ where: { type: "SUPER_LIKE" } }),
    prisma.boost.count(),
    prisma.boost.count({ where: { endsAt: { gt: now } } }),
    prisma.report.count({ where: { status: "PENDING" } }),
    prisma.coinTransfer.count(),
    prisma.coinTransfer.aggregate({ _sum: { coins: true } }),
    prisma.transaction.count({ where: { type: "COIN_PURCHASE", status: "COMPLETED" } }),
    prisma.transaction.aggregate({ where: { type: "COIN_PURCHASE", status: "COMPLETED" }, _sum: { amountToman: true } }),
    prisma.transaction.aggregate({ where: { type: "COIN_PURCHASE", status: "COMPLETED" }, _sum: { coins: true } }),
  ]);

  const stats = [
    { icon: Users, label: "کل کاربران", value: toPersianDigits(totalUsers), sub: `+${toPersianDigits(newUsersToday)} امروز` },
    { icon: TrendingUp, label: "کاربران جدید (هفته)", value: toPersianDigits(newUsersWeek), sub: `+${toPersianDigits(newUsersToday)} امروز` },
    { icon: MessageCircle, label: "کل پیام ها", value: toPersianDigits(totalMessages), sub: `${toPersianDigits(messagesToday)} امروز` },
    { icon: Heart, label: "کل لایک ها", value: toPersianDigits(totalLikes), sub: `${toPersianDigits(superLikes)} سوپر لایک` },
    { icon: Gift, label: "انتقال سکه", value: toPersianDigits(totalTransfers), sub: formatCoins(transferCoinsSum._sum.coins ?? 0) },
    { icon: Rocket, label: "کل بوست ها", value: toPersianDigits(totalBoosts), sub: `${toPersianDigits(activeBoosts)} فعال` },
    { icon: Flag, label: "گزارش های در انتظار", value: toPersianDigits(pendingReports), sub: "نیازمند رسیدگی" },
    { icon: TrendingUp, label: "کل خرید سکه", value: toPersianDigits(totalPurchases), sub: formatToman(purchaseSum._sum.amountToman ?? 0) },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          آمار پیشرفته
        </h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="bg-white border border-ig-border rounded-lg p-4">
            <s.icon className="w-5 h-5 text-ig-blue mb-3" strokeWidth={1.5} />
            <p className="text-xs text-ig-gray">{s.label}</p>
            <p className="font-bold text-foreground mt-1 text-sm sm:text-base">{s.value}</p>
            <p className="text-xs text-ig-gray mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* آمار اشتراک */}
      <div className="bg-white border border-ig-border rounded-lg p-5">
        <h2 className="text-sm font-bold text-foreground mb-3">آمار کلی</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-2 border-b border-ig-border">
            <span className="text-ig-gray">اشتراک های فعال</span>
            <span className="font-bold text-foreground">{toPersianDigits(activeSubs)}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-ig-border">
            <span className="text-ig-gray">سکه فروخته شده</span>
            <span className="font-bold text-foreground">{formatCoins(coinPurchaseCoins._sum.coins ?? 0)}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-ig-gray">درآمد کل فروش</span>
            <span className="font-bold text-foreground">{formatToman(purchaseSum._sum.amountToman ?? 0)}</span>
          </div>
        </div>
      </div>

      {/* نمودارهای آماری */}
      <AdminCharts />
    </div>
  );
}
