// API بوست پروفایل با سکه
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth";
import { ensureWallet } from "@/lib/finance";
import { getAllSettings } from "@/lib/settings";

export async function POST() {
  try {
    const user = await requireUser();
    const settings = await getAllSettings();

    await ensureWallet(user.id);
    const wallet = await prisma.wallet.findUnique({ where: { userId: user.id } });
    if (!wallet || wallet.balance < settings.boostCostCoins) {
      return NextResponse.json({ error: "موجودی سکه کافی نیست" }, { status: 400 });
    }

    // بررسی بوست فعال
    const activeBoost = await prisma.boost.findFirst({
      where: { userId: user.id, endsAt: { gt: new Date() } },
    });
    if (activeBoost) {
      return NextResponse.json({ error: "بوست فعال دارید" }, { status: 400 });
    }

    const endsAt = new Date(Date.now() + settings.boostDurationMinutes * 60 * 1000);

    await prisma.$transaction([
      prisma.wallet.update({
        where: { userId: user.id },
        data: { balance: { decrement: settings.boostCostCoins } },
      }),
      prisma.boost.create({
        data: { userId: user.id, endsAt },
      }),
      prisma.transaction.create({
        data: {
          userId: user.id,
          type: "BOOST_PURCHASE",
          coins: -settings.boostCostCoins,
          amountToman: settings.boostCostCoins * settings.coinValue,
          status: "COMPLETED",
          description: `بوست پروفایل (${settings.boostDurationMinutes} دقیقه)`,
        },
      }),
      prisma.notification.create({
        data: {
          userId: user.id,
          type: "BOOST_ACTIVATED",
          title: "بوست فعال شد",
          body: `پروفایل شما تا ${settings.boostDurationMinutes} دقیقه در صدر نتایج قرار دارد`,
        },
      }),
    ]);

    console.log(`[boost] user ${user.id} activated boost until ${endsAt.toISOString()}`);
    return NextResponse.json({ ok: true, endsAt });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[boost] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

// وضعیت بوست فعلی
export async function GET() {
  try {
    const user = await requireUser();
    const activeBoost = await prisma.boost.findFirst({
      where: { userId: user.id, endsAt: { gt: new Date() } },
      orderBy: { endsAt: "desc" },
    });
    return NextResponse.json({ boost: activeBoost });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[boost GET] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

