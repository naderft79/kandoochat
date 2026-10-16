// ابزارهای پرداخت — امضا، تایید و تسویه توکن ارتباط با KandooPay
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";
import { ensureWallet, getActiveSubscription } from "@/lib/finance";
import { isoToJalaliDisplay } from "@/lib/jalali";
import { toPersianDigits } from "@/lib/format";
import { getPlan, planEndsAt, SUBSCRIPTION_PLANS } from "@/lib/subscriptionPlans";

export type PaymentTokenPayload = {
  paymentId: string;
  userId: string;
  type: "SUBSCRIPTION" | "COINS";
  coins: number;
  amountToman: number;
  returnPath: string;
};

function getSharedSecret() {
  const secret = process.env.KANDOOPAY_SHARED_SECRET;
  if (!secret) throw new Error("KANDOOPAY_SHARED_SECRET is not set");
  if (secret.length < 32) throw new Error("KANDOOPAY_SHARED_SECRET must be at least 32 characters");
  return new TextEncoder().encode(secret);
}

export async function signPaymentToken(payload: PaymentTokenPayload) {
  return new SignJWT(payload as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS512" })
    .setIssuedAt()
    .setIssuer("kandoo")
    .setAudience("kandoopay")
    .setExpirationTime("30m")
    .sign(getSharedSecret());
}

export async function verifyPaymentToken(token: string): Promise<PaymentTokenPayload> {
  const { payload } = await jwtVerify(token, getSharedSecret(), {
    issuer: "kandoo",
    audience: "kandoopay",
  });
  return payload as unknown as PaymentTokenPayload;
}

export function sanitizeReturnPath(path: string | null): string {
  if (!path) return "/dashboard";
  // فقط مسیرهای داخلی مجاز
  if (!path.startsWith("/") || path.startsWith("//")) return "/dashboard";
  // جلوگیری از حمله open redirect
  try {
    const u = new URL(path, "http://localhost");
    if (u.hostname !== "localhost") return "/dashboard";
  } catch {
    return "/dashboard";
  }
  return path;
}

/**
 * تسویه پرداخت موفق — ایجاد تراکنش، اعطای سکه یا اشتراک
 * این عمل idempotent است: فقط وقتی status === PENDING اجرا می شود
 */
export async function fulfillPayment(paymentId: string, refId?: string | null) {
  const payment = await prisma.paymentRequest.findUnique({ where: { id: paymentId } });
  if (!payment) throw new Error("Payment not found");
  if (payment.status === "PAID") return { alreadyPaid: true };
  if (payment.status !== "PENDING") return { alreadySettled: true };

  if (payment.type === "SUBSCRIPTION") {
    // پلن ذخیره شده روی درخواست پرداخت؛ رکوردهای قدیمی یک ماهه فرض می شوند
    const plan = getPlan(payment.plan) ?? SUBSCRIPTION_PLANS[0];
    const active = await getActiveSubscription(payment.userId);
    const startsAt = active ? active.endsAt : new Date();
    const endsAt = planEndsAt(startsAt, plan);
    const validText =
      plan.months === null
        ? "برای همیشه"
        : `تا ${isoToJalaliDisplay(endsAt.toISOString().slice(0, 10))}`;

    await prisma.$transaction([
      prisma.paymentRequest.update({
        where: { id: payment.id, status: "PENDING" },
        data: { status: "PAID", authority: refId || null },
      }),
      prisma.subscription.create({
        data: { userId: payment.userId, tier: plan.name, startsAt, endsAt, coinsPaid: 0 },
      }),
      prisma.transaction.create({
        data: {
          userId: payment.userId,
          type: "SUBSCRIPTION",
          coins: 0,
          amountToman: payment.amountToman,
          status: "COMPLETED",
          description: `خرید اشتراک ${plan.name} (پرداخت ریالی)`,
        },
      }),
      prisma.notification.create({
        data: {
          userId: payment.userId,
          type: "SUBSCRIPTION_PURCHASED",
          title: "اشتراک فعال شد",
          body: `اشتراک ${plan.name} شما با موفقیت فعال شد و ${validText} معتبر است`,
          data: JSON.stringify({ link: "/dashboard/subscription" }),
        },
      }),
    ]);

    console.log(`[payment] user ${payment.userId} subscription activated until ${endsAt.toISOString()}, refId=${refId ?? "-"}`);
    // اطلاع پیامکی به مدیران — خرید اشتراک
    void import("@/lib/sms").then(({ notifyAdminsSms }) =>
      notifyAdminsSms("اشتراک جدیدی خریداری شد")
    );
    return { alreadyPaid: false, endsAt };
  }

  // خرید سکه
  await ensureWallet(payment.userId);

  await prisma.$transaction([
    prisma.paymentRequest.update({
      where: { id: payment.id, status: "PENDING" },
      data: { status: "PAID", authority: refId || null },
    }),
    prisma.wallet.update({
      where: { userId: payment.userId },
      data: { balance: { increment: payment.coins } },
    }),
    prisma.transaction.create({
      data: {
        userId: payment.userId,
        type: "COIN_PURCHASE",
        coins: payment.coins,
        amountToman: payment.amountToman,
        status: "COMPLETED",
        description: `خرید ${payment.coins} سکه (پرداخت ریالی)`,
      },
    }),
    prisma.notification.create({
      data: {
        userId: payment.userId,
        type: "COIN_PURCHASE",
        title: "سکه خریداری شد",
        body: `${toPersianDigits(payment.coins)} سکه با موفقیت به کیف پول شما اضافه شد`,
        data: JSON.stringify({ link: "/dashboard/coins" }),
      },
    }),
  ]);

  console.log(`[payment] user ${payment.userId} received ${payment.coins} coins, refId=${refId ?? "-"}`);
  // اطلاع پیامکی به مدیران — خرید سکه
  void import("@/lib/sms").then(({ notifyAdminsSms }) =>
    notifyAdminsSms("سکه جدیدی خریداری شد")
  );
  return { alreadyPaid: false };
}

/**
 * علامت‌گذاری پرداخت ناموفق یا لغو شده
 */
export async function failPayment(paymentId: string, status: "FAILED" | "CANCELLED" = "FAILED") {
  const payment = await prisma.paymentRequest.findUnique({ where: { id: paymentId } });
  if (!payment) return;
  if (payment.status !== "PENDING") return;

  await prisma.$transaction([
    prisma.paymentRequest.update({
      where: { id: payment.id, status: "PENDING" },
      data: { status },
    }),
    prisma.transaction.create({
      data: {
        userId: payment.userId,
        type: payment.type === "SUBSCRIPTION" ? "SUBSCRIPTION" : "COIN_PURCHASE",
        coins: 0,
        amountToman: payment.amountToman,
        status: "REJECTED",
        description: payment.type === "SUBSCRIPTION" ? "خرید اشتراک (ناموفق)" : `خرید ${payment.coins} سکه (ناموفق)`,
      },
    }),
  ]);
}

