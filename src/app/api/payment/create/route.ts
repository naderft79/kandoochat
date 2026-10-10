// API ساخت درخواست پرداخت — هدایت کاربر به KandooPay
import { NextResponse } from "next/server";
import { z } from "zod";
import { randomBytes, randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth";
import { getSetting } from "@/lib/settings";
import { signPaymentToken, sanitizeReturnPath } from "@/lib/payment";
import { SITE_URL } from "@/lib/site";
import { rateLimit, apiRateLimit, getClientIdentifier } from "@/lib/rate-limit";
import { getPlan } from "@/lib/subscriptionPlans";

const createSchema = z.object({
  type: z.enum(["SUBSCRIPTION", "COINS"]),
  coins: z.coerce.number().int().min(1).max(100_000).optional(),
  plan: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const user = await requireUser();

    const ip = getClientIdentifier(request);
    const { allowed, retryAfterMs } = await rateLimit(`payment:create:${ip}`, apiRateLimit);
    if (!allowed) {
      return NextResponse.json(
        { error: "تعداد درخواست ها بیش از حد مجاز است" },
        { status: 429, headers: { "Retry-After": String(Math.ceil((retryAfterMs ?? 60000) / 1000)) } }
      );
    }

    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "درخواست نامعتبر" }, { status: 400 });
    }

    const { type } = parsed.data;
    let amountToman = 0;
    let coins = 0;
    let title = "";
    let planKey: string | null = null;

    if (type === "SUBSCRIPTION") {
      const plan = getPlan(parsed.data.plan);
      if (!plan) {
        return NextResponse.json({ error: "پلن نامعتبر است" }, { status: 400 });
      }
      planKey = plan.key;
      amountToman = plan.toman;
      title = `خرید اشتراک ${plan.name} کندو`;
    } else {
      coins = parsed.data.coins ?? 0;
      if (!coins) {
        return NextResponse.json({ error: "تعداد سکه الزامی است" }, { status: 400 });
      }
      const coinValue = await getSetting("COIN_VALUE");
      amountToman = coins * coinValue;
      title = "خرید سکه کندو";
    }

    if (amountToman < 1000) {
      return NextResponse.json({ error: "مبلغ پرداخت بسیار کم است" }, { status: 400 });
    }

    // مسیر بازگشت کاربر — از Referer header
    const referer = request.headers.get("referer");
    let returnPath = "/dashboard";
    if (referer) {
      try {
        const url = new URL(referer);
        returnPath = sanitizeReturnPath(url.pathname);
      } catch {
        // استفاده از مسیر پیش‌فرض
      }
    }

    const paymentId = randomUUID();
    const dbToken = randomBytes(32).toString("hex");

    const token = await signPaymentToken({
      paymentId,
      userId: user.id,
      type,
      coins,
      amountToman,
      returnPath,
    });

    const payment = await prisma.paymentRequest.create({
      data: {
        id: paymentId,
        userId: user.id,
        type,
        coins,
        plan: planKey,
        amountToman,
        token: dbToken,
        status: "PENDING",
        returnPath,
      },
    });

    // آدرس KandooPay از متغیر محیطی
    const kandooPayUrl = process.env.KANDOOPAY_URL?.replace(/\/$/, "") || "https://kandoopay.com";
    const appUrl = (process.env.KANDOO_PUBLIC_URL || SITE_URL).replace(/\/$/, "");
    const callbackUrl = `${kandooPayUrl}/checkout/kandoo?token=${encodeURIComponent(token)}&title=${encodeURIComponent(title)}&amount=${amountToman}&type=${type}&kandooUrl=${encodeURIComponent(appUrl)}&returnPath=${encodeURIComponent(returnPath)}`;

    console.log(`[payment/create] user ${user.id} created ${type} payment ${amountToman} toman, paymentId=${payment.id}`);

    return NextResponse.json({ ok: true, redirectUrl: callbackUrl, paymentId: payment.id });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[payment/create] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
