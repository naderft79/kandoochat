// API دریافت سطح اشتراک برای کاربران
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth";

export async function GET() {
  try {
    await requireUser();
    const tiers = await prisma.subscriptionTier.findMany({
      where: { isActive: true },
      orderBy: { coinsPerMonth: "asc" },
    });

    // مقادیر پیش فرض اگر هنوز ساخته نشده
    if (tiers.length === 0) {
      return NextResponse.json({
        tiers: [
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
        ],
      });
    }

    return NextResponse.json({ tiers });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[tiers GET] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
