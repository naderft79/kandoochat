// API استوری طلایی با سکه — 24 ساعت
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth";
import { ensureWallet } from "@/lib/finance";

const GOLDEN_STORY_COST = 100;
const GOLDEN_STORY_HOURS = 24;

export async function GET() {
  try {
    const user = await requireUser();
    const active = user.goldenStoryExpiresAt && new Date(user.goldenStoryExpiresAt) > new Date();
    return NextResponse.json({
      active: !!active,
      expiresAt: active ? user.goldenStoryExpiresAt : null,
    });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

export async function POST() {
  try {
    const user = await requireUser();

    const active = user.goldenStoryExpiresAt && new Date(user.goldenStoryExpiresAt) > new Date();
    if (active) {
      return NextResponse.json({ error: "استوری طلایی فعال دارید" }, { status: 400 });
    }

    await ensureWallet(user.id);
    const wallet = await prisma.wallet.findUnique({ where: { userId: user.id } });
    if (!wallet || wallet.balance < GOLDEN_STORY_COST) {
      return NextResponse.json({ error: "موجودی سکه کافی نیست" }, { status: 400 });
    }

    const expiresAt = new Date(Date.now() + GOLDEN_STORY_HOURS * 60 * 60 * 1000);

    await prisma.$transaction([
      prisma.wallet.update({
        where: { userId: user.id },
        data: { balance: { decrement: GOLDEN_STORY_COST } },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { goldenStoryExpiresAt: expiresAt },
      }),
      prisma.transaction.create({
        data: {
          userId: user.id,
          type: "GOLDEN_STORY",
          coins: -GOLDEN_STORY_COST,
          amountToman: 0,
          status: "COMPLETED",
          description: `استوری طلایی (${GOLDEN_STORY_HOURS} ساعت)`,
        },
      }),
      prisma.notification.create({
        data: {
          userId: user.id,
          type: "GOLDEN_STORY",
          title: "استوری طلایی فعال شد",
          body: `استوری شما به عنوان استوری طلایی فعال شد و تا ${GOLDEN_STORY_HOURS} ساعت آینده با رینگ طلایی و به تعداد بیشتری نمایش داده می شود`,
        },
      }),
    ]);

    console.log(`[golden-story] user ${user.id} activated golden story until ${expiresAt.toISOString()}`);
    return NextResponse.json({ ok: true, expiresAt });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[golden-story] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
