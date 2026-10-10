// API استریک روزانه — بروزرسانی و دریافت وضعیت
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth";
import { getAllSettings } from "@/lib/settings";
import { incrementMissionProgress } from "@/lib/missions";

export async function GET() {
  try {
    const user = await requireUser();
    const now = new Date();
    const today = now.toDateString();

    let streak = await prisma.streak.findUnique({ where: { userId: user.id } });

    if (!streak) {
      // اولین بازدید
      streak = await prisma.streak.create({
        data: { userId: user.id, count: 1, lastVisit: now },
      });
    } else {
      const lastDate = new Date(streak.lastVisit);
      const lastDayStr = lastDate.toDateString();

      if (lastDayStr !== today) {
        // ماموریت ورود روزانه
        void incrementMissionProgress(user.id, "daily_login");
        // بررسی اینکه آیا دیروز هم بازدید کرده (برای حفظ استریک)
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const isYesterday = lastDate.toDateString() === yesterday.toDateString();

        const newCount = isYesterday ? streak.count + 1 : 1;
        streak = await prisma.streak.update({
          where: { userId: user.id },
          data: { count: newCount, lastVisit: now },
        });

        // پاداش استریک هر ۷ روز
        if (newCount % 7 === 0) {
          const settings = await getAllSettings();
          const { ensureWallet } = await import("@/lib/finance");
          await ensureWallet(user.id);
          await prisma.$transaction([
            prisma.wallet.update({
              where: { userId: user.id },
              data: { balance: { increment: settings.streakRewardCoins } },
            }),
            prisma.transaction.create({
              data: {
                userId: user.id,
                type: "STREAK_REWARD",
                coins: settings.streakRewardCoins,
                amountToman: settings.streakRewardCoins * settings.coinValue,
                status: "COMPLETED",
                description: `پاداش ${newCount} روز استریک`,
              },
            }),
            prisma.notification.create({
              data: {
                userId: user.id,
                type: "STREAK_REWARD",
                title: "پاداش استریک",
                body: `شما ${settings.streakRewardCoins} سکه پاداش ${newCount} روز استریک دریافت کردید`,
              },
            }),
          ]);
        }
      }
    }

    // بروزرسانی وضعیت آنلاین
    await prisma.user.update({
      where: { id: user.id },
      data: { isOnline: true, lastSeen: now },
    });

    return NextResponse.json({ streak: streak.count });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[streak] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
