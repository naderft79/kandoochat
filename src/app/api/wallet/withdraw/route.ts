// API درخواست برداشت سکه و تبدیل به تومان
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth";
import { getAllSettings } from "@/lib/settings";
import { ensureWallet } from "@/lib/finance";
import { checkWithdrawEligibility } from "@/lib/withdraw";
import { rateLimitUser } from "@/lib/rate-limit";

const withdrawSchema = z.object({
  coins: z.coerce.number().int().min(1).max(1_000_000),
  cardNumber: z.string().regex(/^\d{16}$/, "شماره کارت باید ۱۶ رقم باشد"),
});

const RULE_ERRORS: Record<number, string> = {
  1: "هنوز ۱۵ روز از ثبت نام شما نگذشته است",
  2: "حداقل موجودی برای برداشت ۱۰۰ سکه است",
  3: "برای برداشت باید اشتراک ویژه داشته باشید",
  4: "برای برداشت باید احراز هویت کنید",
};

// وضعیت قوانین برداشت — اولین قانون رد شده برمی گردد
export async function GET() {
  try {
    const user = await requireUser();
    const eligibility = await checkWithdrawEligibility(user);
    return NextResponse.json(eligibility);
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[wallet/withdraw GET] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    // سقف درخواست برداشت: ۳ در روز
    const limited = await rateLimitUser(
      user.id,
      "withdraw",
      { windowMs: 24 * 60 * 60 * 1000, maxRequests: 3 },
      "به سقف درخواست برداشت در هر روز رسیدید (۳ درخواست)؛ لطفا فردا تلاش کنید"
    );
    if (limited) return limited;
    const body = await request.json();
    const parsed = withdrawSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "اطلاعات نامعتبر است" },
        { status: 400 }
      );
    }

    const { coins, cardNumber } = parsed.data;
    const { coinValue, minWithdrawCoins } = await getAllSettings();

    // قوانین برداشت — اولین قانون رد شده جلوی ثبت را می گیرد
    const eligibility = await checkWithdrawEligibility(user);
    if (eligibility.failedRule !== null) {
      return NextResponse.json(
        {
          error: RULE_ERRORS[eligibility.failedRule],
          failedRule: eligibility.failedRule,
          unlockAt: eligibility.unlockAt,
        },
        { status: 400 }
      );
    }

    const wallet = await ensureWallet(user.id);

    // حداقل مقدار برداشت
    if (wallet.balance < minWithdrawCoins) {
      return NextResponse.json(
        { error: `حداقل موجودی برای برداشت ${minWithdrawCoins} سکه است` },
        { status: 400 }
      );
    }
    if (coins < minWithdrawCoins) {
      return NextResponse.json(
        { error: `حداقل مقدار برداشت ${minWithdrawCoins} سکه است` },
        { status: 400 }
      );
    }
    if (coins > wallet.balance) {
      return NextResponse.json(
        { error: "موجودی سکه کافی نیست" },
        { status: 400 }
      );
    }

    const amountToman = coins * coinValue;

    // کسر سکه بلافاصله انجام می شود تا از خرج مجدد جلوگیری شود
    await prisma.$transaction([
      prisma.wallet.update({
        where: { userId: user.id },
        data: { balance: { decrement: coins } },
      }),
      prisma.withdrawRequest.create({
        data: { userId: user.id, coins, amountToman, cardNumber },
      }),
      prisma.transaction.create({
        data: {
          userId: user.id,
          type: "WITHDRAW",
          coins: -coins,
          amountToman,
          status: "PENDING",
          description: `درخواست برداشت ${coins} سکه`,
        },
      }),
    ]);

    console.log(`[wallet] user ${user.id} requested withdraw of ${coins} coins`);
    // اطلاع پیامکی به مدیران — درخواست برداشت جدید
    void import("@/lib/sms").then(({ notifyAdminsSms }) =>
      notifyAdminsSms("درخواست برداشت جدیدی ثبت شد")
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[wallet/withdraw] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
