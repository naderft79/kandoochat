// API داده های نموداری پیشرفته برای پنل ادمین
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, AuthError } from "@/lib/auth";

// برچسب فارسی انواع تراکنش برای نمودار درآمد (انواع بدون درآمد تومانی حذف می شوند)
const TX_TYPE_LABELS: Record<string, string> = {
  COIN_PURCHASE: "خرید سکه",
  SUBSCRIPTION: "اشتراک",
  BOOST_PURCHASE: "بوست",
  REFERRAL_REWARD: "پاداش دعوت",
  STREAK_REWARD: "پاداش استریک",
  ADMIN_ADJUST: "تنظیم دستی ادمین",
};

export async function GET() {
  try {
    await requireAdmin();
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);

    // رشد کاربران (۳۰ روز اخیر) — روزانه + تجمعی
    const users = await prisma.user.findMany({
      where: { role: "USER", createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true, gender: true, age: true },
    });
    const userGrowth: { date: string; count: number; total: number }[] = [];
    let cumulative = await prisma.user.count({ where: { role: "USER", createdAt: { lt: thirtyDaysAgo } } });
    for (let i = 29; i >= 0; i--) {
      const day = new Date(now.getTime() - i * 86400000);
      const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
      const dayEnd = new Date(dayStart.getTime() + 86400000);
      const count = users.filter((u) => u.createdAt >= dayStart && u.createdAt < dayEnd).length;
      cumulative += count;
      userGrowth.push({
        date: dayStart.toLocaleDateString("fa-IR", { month: "short", day: "numeric" }),
        count,
        total: cumulative,
      });
    }

    // درآمد روزانه (۳۰ روز اخیر)
    const transactions = await prisma.transaction.findMany({
      where: { type: "COIN_PURCHASE", status: "COMPLETED", createdAt: { gte: thirtyDaysAgo } },
      select: { amountToman: true, coins: true, createdAt: true },
    });
    const dailyRevenue: { date: string; amount: number; coins: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const day = new Date(now.getTime() - i * 86400000);
      const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
      const dayEnd = new Date(dayStart.getTime() + 86400000);
      const dayTx = transactions.filter((t) => t.createdAt >= dayStart && t.createdAt < dayEnd);
      dailyRevenue.push({
        date: dayStart.toLocaleDateString("fa-IR", { month: "short", day: "numeric" }),
        amount: dayTx.reduce((sum, t) => sum + (t.amountToman ?? 0), 0),
        coins: dayTx.reduce((sum, t) => sum + (t.coins ?? 0), 0),
      });
    }

    // پیام ها روزانه (۳۰ روز اخیر)
    const messages = await prisma.message.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
    });
    const dailyMessages: { date: string; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const day = new Date(now.getTime() - i * 86400000);
      const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
      const dayEnd = new Date(dayStart.getTime() + 86400000);
      const count = messages.filter((m) => m.createdAt >= dayStart && m.createdAt < dayEnd).length;
      dailyMessages.push({
        date: dayStart.toLocaleDateString("fa-IR", { month: "short", day: "numeric" }),
        count,
      });
    }

    // لایک و سوپرلایک روزانه (۳۰ روز اخیر)
    const likes = await prisma.like.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { type: true, createdAt: true },
    });
    const dailyLikes: { date: string; likes: number; superLikes: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const day = new Date(now.getTime() - i * 86400000);
      const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
      const dayEnd = new Date(dayStart.getTime() + 86400000);
      const dayLikes = likes.filter((l) => l.createdAt >= dayStart && l.createdAt < dayEnd);
      dailyLikes.push({
        date: dayStart.toLocaleDateString("fa-IR", { month: "short", day: "numeric" }),
        likes: dayLikes.filter((l) => l.type === "LIKE").length,
        superLikes: dayLikes.filter((l) => l.type === "SUPER_LIKE").length,
      });
    }

    // فعالیت ساعتی: تعداد پیام ها در هر ساعت روز (۳۰ روز اخیر)
    const hourlyMessages: number[] = Array.from({ length: 24 }, () => 0);
    for (const m of messages) hourlyMessages[m.createdAt.getHours()] += 1;

    // اشتراک های جدید (۳۰ روز اخیر)
    const subscriptions = await prisma.subscription.findMany({
      where: { startsAt: { gte: thirtyDaysAgo } },
      select: { startsAt: true },
    });
    const dailySubs: { date: string; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const day = new Date(now.getTime() - i * 86400000);
      const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
      const dayEnd = new Date(dayStart.getTime() + 86400000);
      const count = subscriptions.filter((s) => s.startsAt >= dayStart && s.startsAt < dayEnd).length;
      dailySubs.push({
        date: dayStart.toLocaleDateString("fa-IR", { month: "short", day: "numeric" }),
        count,
      });
    }

    // قیف تبدیل: از ثبت نام تا خرید سکه و اشتراک (تعداد کاربران یکتا در هر مرحله)
    const [registered, phoneVerified, identityVerified, coinBuyers, subscribers] = await Promise.all([
      prisma.user.count({ where: { role: "USER" } }),
      prisma.user.count({ where: { role: "USER", phoneVerified: true } }),
      prisma.user.count({ where: { role: "USER", isIdentityVerified: true } }),
      prisma.transaction.findMany({
        where: { type: "COIN_PURCHASE", status: "COMPLETED" },
        distinct: ["userId"],
        select: { userId: true },
      }),
      prisma.subscription.findMany({ distinct: ["userId"], select: { userId: true } }),
    ]);
    const funnel = [
      { name: "ثبت نام", value: registered },
      { name: "موبایل تایید شده", value: phoneVerified },
      { name: "احراز هویت کامل", value: identityVerified },
      { name: "خرید سکه", value: coinBuyers.length },
      { name: "اشتراک", value: subscribers.length },
    ];

    // توزیع کاربران بر اساس استان (۱۰ استان برتر)
    const provinceGroups = await prisma.user.groupBy({
      by: ["province"],
      where: { role: "USER" },
      _count: { province: true },
      orderBy: { _count: { province: "desc" } },
      take: 10,
    });
    const provinceDistribution = provinceGroups.map((g) => ({ name: g.province, value: g._count.province }));

    // توزیع کاربران بر اساس شهر
    const allUsers = await prisma.user.findMany({
      where: { role: "USER" },
      select: { city: true, gender: true, age: true },
    });
    const cityMap = new Map<string, number>();
    for (const u of allUsers) {
      cityMap.set(u.city, (cityMap.get(u.city) ?? 0) + 1);
    }
    const cityDistribution = Array.from(cityMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    // توزیع جنسیت
    const maleCount = allUsers.filter((u) => u.gender === "MALE").length;
    const femaleCount = allUsers.filter((u) => u.gender === "FEMALE").length;
    const genderDistribution = [
      { name: "آقا", value: maleCount },
      { name: "خانم", value: femaleCount },
    ];

    // توزیع سنی
    const ageGroups = [
      { name: "۱۸-۲۵", min: 18, max: 25 },
      { name: "۲۶-۳۰", min: 26, max: 30 },
      { name: "۳۱-۳۵", min: 31, max: 35 },
      { name: "۳۶-۴۰", min: 36, max: 40 },
      { name: "۴۱+", min: 41, max: 200 },
    ];
    const ageDistribution = ageGroups.map((g) => ({
      name: g.name,
      value: allUsers.filter((u) => u.age >= g.min && u.age <= g.max).length,
    }));

    // درآمد بر اساس نوع تراکنش
    const txTypes = await prisma.transaction.groupBy({
      by: ["type"],
      where: { status: "COMPLETED" },
      _count: true,
      _sum: { amountToman: true },
    });
    const revenueByType = txTypes
      .filter((t) => (t._sum.amountToman ?? 0) > 0)
      .map((t) => ({
        name: TX_TYPE_LABELS[t.type] ?? "سایر",
        value: t._sum.amountToman ?? 0,
        count: t._count,
      }));

    // خلاصه آماری
    const totalLikes = await prisma.like.count();
    const totalSuperLikes = await prisma.like.count({ where: { type: "SUPER_LIKE" } });
    const totalBoosts = await prisma.boost.count();
    const totalTransfers = await prisma.coinTransfer.count();
    const totalSubs = await prisma.subscription.count();
    const activeSubs = await prisma.subscription.count({ where: { endsAt: { gt: now } } });
    const totalRevenue = await prisma.transaction.aggregate({
      where: { type: "COIN_PURCHASE", status: "COMPLETED" },
      _sum: { amountToman: true },
    });

    return NextResponse.json({
      userGrowth,
      dailyRevenue,
      dailyMessages,
      dailyLikes,
      dailySubs,
      hourlyMessages,
      funnel,
      provinceDistribution,
      cityDistribution,
      genderDistribution,
      ageDistribution,
      revenueByType,
      summary: {
        totalLikes,
        totalSuperLikes,
        totalBoosts,
        totalTransfers,
        totalSubs,
        activeSubs,
        totalRevenue: totalRevenue._sum.amountToman ?? 0,
      },
    });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[admin stats charts] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
