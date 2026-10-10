// API آمار پیشرفته ادمین
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, AuthError } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalUsers,
      newUsers7d,
      newUsers30d,
      activeSubscriptions,
      totalRevenue,
      revenue7d,
      totalBoosts,
      activeBoosts,
      pendingReports,
      pendingWithdrawals,
      totalTransfers,
      transferVolume7d,
      todayLogins,
    ] = await Promise.all([
      prisma.user.count({ where: { role: "USER" } }),
      prisma.user.count({ where: { role: "USER", createdAt: { gte: sevenDaysAgo } } }),
      prisma.user.count({ where: { role: "USER", createdAt: { gte: thirtyDaysAgo } } }),
      prisma.subscription.count({ where: { endsAt: { gt: now } } }),
      prisma.transaction.aggregate({
        where: { type: "COIN_PURCHASE", status: "COMPLETED" },
        _sum: { amountToman: true },
      }),
      prisma.transaction.aggregate({
        where: { type: "COIN_PURCHASE", status: "COMPLETED", createdAt: { gte: sevenDaysAgo } },
        _sum: { amountToman: true },
      }),
      prisma.boost.count(),
      prisma.boost.count({ where: { endsAt: { gt: now } } }),
      prisma.report.count({ where: { status: "PENDING" } }),
      prisma.withdrawRequest.count({ where: { status: "PENDING" } }),
      prisma.coinTransfer.count({ where: { status: "COMPLETED" } }),
      prisma.coinTransfer.aggregate({
        where: { status: "COMPLETED", createdAt: { gte: sevenDaysAgo } },
        _sum: { coins: true },
      }),
      prisma.user.count({ where: { lastSeen: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } } }),
    ]);

    // آمار روزانه کاربران جدید (۷ روز)
    const dailyNewUsers: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const start = new Date(now);
      start.setDate(start.getDate() - i);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      const count = await prisma.user.count({
        where: { role: "USER", createdAt: { gte: start, lt: end } },
      });
      dailyNewUsers.push({ date: start.toDateString(), count });
    }

    // آمار روزانه درآمد (۷ روز)
    const dailyRevenue: { date: string; amount: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const start = new Date(now);
      start.setDate(start.getDate() - i);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      const result = await prisma.transaction.aggregate({
        where: {
          type: { in: ["COIN_PURCHASE", "SUBSCRIPTION"] },
          status: "COMPLETED",
          createdAt: { gte: start, lt: end },
        },
        _sum: { amountToman: true },
      });
      dailyRevenue.push({ date: start.toDateString(), amount: result._sum.amountToman || 0 });
    }

    // فعال ترین کاربران (بر اساس تعداد چت)
    const activeUsers = await prisma.user.findMany({
      where: { role: "USER", isActive: true },
      orderBy: { lastSeen: "desc" },
      take: 10,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        city: true,
        lastSeen: true,
        isOnline: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      overview: {
        totalUsers,
        newUsers7d,
        newUsers30d,
        activeSubscriptions,
        totalRevenue: totalRevenue._sum.amountToman || 0,
        revenue7d: revenue7d._sum.amountToman || 0,
        totalBoosts,
        activeBoosts,
        pendingReports,
        pendingWithdrawals,
        totalTransfers,
        transferVolume7d: transferVolume7d._sum.coins || 0,
        todayLogins,
      },
      charts: {
        dailyNewUsers,
        dailyRevenue,
      },
      activeUsers,
    });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[admin/stats] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
