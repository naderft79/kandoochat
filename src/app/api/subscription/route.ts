// API خرید اشتراک با سکه — پلن ها فقط بر اساس مدت زمان
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth";
import { ensureWallet, getActiveSubscription } from "@/lib/finance";
import { isoToJalaliDisplay } from "@/lib/jalali";
import { getPlan, planEndsAt } from "@/lib/subscriptionPlans";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json().catch(() => ({}));
    const plan = getPlan(typeof body.plan === "string" ? body.plan : null);
    if (!plan) {
      return NextResponse.json({ error: "پلن نامعتبر است" }, { status: 400 });
    }

    const wallet = await ensureWallet(user.id);
    if (wallet.balance < plan.coins) {
      return NextResponse.json(
        { error: `موجودی کافی نیست. برای این پلن به ${plan.coins} سکه نیاز دارید` },
        { status: 400 }
      );
    }

    // اگر اشتراک فعال دارد، تمدید از پایان اشتراک فعلی
    const active = await getActiveSubscription(user.id);
    const startsAt = active ? active.endsAt : new Date();
    const endsAt = planEndsAt(startsAt, plan);
    const validText =
      plan.months === null
        ? "برای همیشه"
        : `تا ${isoToJalaliDisplay(endsAt.toISOString().slice(0, 10))}`;

    await prisma.$transaction([
      prisma.wallet.update({
        where: { userId: user.id },
        data: { balance: { decrement: plan.coins } },
      }),
      prisma.subscription.create({
        data: { userId: user.id, tier: plan.name, startsAt, endsAt, coinsPaid: plan.coins },
      }),
      prisma.transaction.create({
        data: {
          userId: user.id,
          type: "SUBSCRIPTION",
          coins: -plan.coins,
          amountToman: 0,
          status: "COMPLETED",
          description: `خرید اشتراک ${plan.name}`,
        },
      }),
      prisma.notification.create({
        data: {
          userId: user.id,
          type: "SUBSCRIPTION_PURCHASED",
          title: "اشتراک فعال شد",
          body: `اشتراک ${plan.name} شما فعال شد و ${validText} معتبر است`,
          data: JSON.stringify({ link: "/dashboard/subscription" }),
        },
      }),
    ]);

    console.log(`[subscription] user ${user.id} purchased plan ${plan.key} until ${endsAt.toISOString()}`);
    // اطلاع پیامکی به مدیران — خرید اشتراک با سکه
    void import("@/lib/sms").then(({ notifyAdminsSms }) =>
      notifyAdminsSms("اشتراک جدیدی خریداری شد")
    );
    return NextResponse.json({ ok: true, endsAt });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[subscription] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
