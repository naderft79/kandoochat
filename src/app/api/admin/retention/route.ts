// API آمار Retention و Churn برای ادمین
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, AuthError } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();
    const now = new Date();

    // کاربران ثبت نام شده در ۷ روز گذشته (روزانه)
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyRegistrations = await prisma.user.groupBy({
      by: ["createdAt"],
      where: { createdAt: { gte: sevenDaysAgo } },
      _count: { id: true },
    });

    // گروه بندی بر اساس روز
    const dailyMap: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      dailyMap[key] = 0;
    }
    dailyRegistrations.forEach((r) => {
      const key = r.createdAt.toISOString().split("T")[0];
      if (key in dailyMap) dailyMap[key] += 1;
    });

    // کاربران فعال در ۲۴ ساعت گذشته (DAU)
    const oneDayAgo = new Date(now);
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    const dau = await prisma.user.count({
      where: { lastSeen: { gte: oneDayAgo }, isActive: true },
    });

    // کاربران فعال در ۷ روز گذشته (WAU)
    const wau = await prisma.user.count({
      where: { lastSeen: { gte: sevenDaysAgo }, isActive: true },
    });

    // کاربران فعال در ۳۰ روز گذشته (MAU)
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const mau = await prisma.user.count({
      where: { lastSeen: { gte: thirtyDaysAgo }, isActive: true },
    });

    // کل کاربران فعال
    const totalActive = await prisma.user.count({ where: { isActive: true } });

    // کاربران غیرفعال (churned) — در ۳۰ روز گذشته بازدید نکرده اند
    const churned = await prisma.user.count({
      where: { lastSeen: { lt: thirtyDaysAgo }, isActive: true },
    });

    // کاربران جدید امروز
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const newToday = await prisma.user.count({
      where: { createdAt: { gte: todayStart } },
    });

    // کاربران جدید ۷ روز گذشته
    const newThisWeek = await prisma.user.count({
      where: { createdAt: { gte: sevenDaysAgo } },
    });

    // نرخ retention (DAU/MAU)
    const retentionRate = mau > 0 ? (dau / mau) * 100 : 0;

    // نرخ churn
    const churnRate = totalActive > 0 ? (churned / totalActive) * 100 : 0;

    // استریک های فعال
    const activeStreaks = await prisma.streak.count({
      where: { count: { gte: 3 } },
    });

    // اشتراک های فعال
    const activeSubscriptions = await prisma.subscription.count({
      where: { endsAt: { gte: now } },
    });

    return NextResponse.json({
      dailyRegistrations: Object.entries(dailyMap).map(([date, count]) => ({ date, count })),
      dau,
      wau,
      mau,
      totalActive,
      churned,
      newToday,
      newThisWeek,
      retentionRate: Math.round(retentionRate * 10) / 10,
      churnRate: Math.round(churnRate * 10) / 10,
      activeStreaks,
      activeSubscriptions,
    });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[admin retention API] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
