// API آمار لحظه ای پنل ادمین
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, AuthError } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // اجرای همزمان همه query ها
    const [
      userStats,
      onlineUsers,
      todaySignups,
      todayMessages,
      totalMessages,
      todayRevenue,
      totalRevenue,
    ] = await Promise.all([
      // گروه بندی کاربران بر اساس جنسیت در یک query
      prisma.user.groupBy({
        by: ["gender"],
        where: { role: "USER" },
        _count: true,
      }),
      prisma.user.count({ where: { role: "USER", isOnline: true } }),
      prisma.user.count({ where: { role: "USER", createdAt: { gte: todayStart } } }),
      prisma.message.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.message.count(),
      prisma.transaction.aggregate({
        where: {
          createdAt: { gte: todayStart },
          status: "COMPLETED",
          type: { in: ["COIN_PURCHASE", "SUBSCRIPTION"] },
        },
        _sum: { amountToman: true },
      }),
      prisma.transaction.aggregate({
        where: {
          status: "COMPLETED",
          type: { in: ["COIN_PURCHASE", "SUBSCRIPTION"] },
        },
        _sum: { amountToman: true },
      }),
    ]);

    const totalUsers = userStats.reduce((sum, g) => sum + g._count, 0);
    const totalMales = userStats.find((g) => g.gender === "MALE")?._count ?? 0;
    const totalFemales = userStats.find((g) => g.gender === "FEMALE")?._count ?? 0;

    return NextResponse.json({
      totalUsers,
      onlineUsers,
      todaySignups,
      totalMales,
      totalFemales,
      todayMessages,
      totalMessages,
      todayRevenue: todayRevenue._sum.amountToman ?? 0,
      totalRevenue: totalRevenue._sum.amountToman ?? 0,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    }
    console.error("[admin/stats-header] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
