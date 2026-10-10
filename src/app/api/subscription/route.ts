// API خرید اشتراک ماهانه با سکه — پشتیبانی از انتخاب پلن
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth";
import { getSubscriptionCoinCost } from "@/lib/settings";
import { ensureWallet, getActiveSubscription } from "@/lib/finance";
import { isoToJalaliDisplay } from "@/lib/jalali";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json().catch(() => ({}));
    const tierKey = typeof body.tier === "string" ? body.tier : "BASIC";

    // هزینه پلن — از جدول پلن ها یا تنظیمات پیش فرض
    const tier = await prisma.subscriptionTier.findUnique({ where: { key: tierKey } });
    const coinCost = tier?.isActive ? tier.coinsPerMonth : await getSubscriptionCoinCost();
    const resolvedTier = tier?.isActive ? tier.key : "BASIC";

    const wallet = await ensureWallet(user.id);
    if (wallet.balance < coinCost) {
      return NextResponse.json(
        { error: `موجودی کافی نیست. برای اشتراک به ${coinCost} سکه نیاز دارید` },
        { status: 400 }
      );
    }

    // اگر اشتراک فعال دارد، تمدید از پایان اشتراک فعلی
    const active = await getActiveSubscription(user.id);
    const startsAt = active ? active.endsAt : new Date();
    const endsAt = new Date(startsAt.getTime() + 30 * 24 * 60 * 60 * 1000);

    await prisma.$transaction([
      prisma.wallet.update({
        where: { userId: user.id },
        data: { balance: { decrement: coinCost } },
      }),
      prisma.subscription.create({
        data: { userId: user.id, tier: resolvedTier, startsAt, endsAt, coinsPaid: coinCost },
      }),
      prisma.transaction.create({
        data: {
          userId: user.id,
          type: "SUBSCRIPTION",
          coins: -coinCost,
          amountToman: 0,
          status: "COMPLETED",
          description: `خرید اشتراک ماهانه ${tier?.name ?? resolvedTier}`,
        },
      }),
      prisma.notification.create({
        data: {
          userId: user.id,
          type: "SUBSCRIPTION_PURCHASED",
          title: "اشتراک فعال شد",
          body: `اشتراک ${tier?.isActive ? tier.name : "ماهانه"} شما فعال شد و تا ${isoToJalaliDisplay(endsAt.toISOString().slice(0, 10))} معتبر است`,
          data: JSON.stringify({ link: "/dashboard/subscription" }),
        },
      }),
    ]);

    console.log(`[subscription] user ${user.id} purchased ${resolvedTier} until ${endsAt.toISOString()}`);
    return NextResponse.json({ ok: true, endsAt });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[subscription] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
