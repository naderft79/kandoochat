// API خرید سکه — ایجاد درخواست پرداخت و هدایت به KandooPay
import { NextResponse } from "next/server";
import { z } from "zod";
import { randomBytes, randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth";
import { getSetting } from "@/lib/settings";
import { signPaymentToken, sanitizeReturnPath } from "@/lib/payment";
import { SITE_URL } from "@/lib/site";
import { rateLimit, apiRateLimit, getClientIdentifier } from "@/lib/rate-limit";
import { isUserAppRequest } from "@/lib/app-ua";

const buySchema = z.object({
  coins: z.coerce.number().int().min(1).max(100_000),
});

export async function POST(request: Request) {
  try {
    // سیاست گوگل پلی: پرداخت ریالی داخل اپ اندروید غیرفعال است — فقط نسخه وب
    if (isUserAppRequest(request)) {
      return NextResponse.json(
        { error: "پرداخت در نسخه اپلیکیشن در دسترس نیست" },
        { status: 403 }
      );
    }

    const user = await requireUser();

    const ip = getClientIdentifier(request);
    const { allowed, retryAfterMs } = await rateLimit(`wallet:buy:${ip}`, apiRateLimit);
    if (!allowed) {
      return NextResponse.json(
        { error: "تعداد درخواست ها بیش از حد مجاز است" },
        { status: 429, headers: { "Retry-After": String(Math.ceil((retryAfterMs ?? 60000) / 1000)) } }
      );
    }

    const body = await request.json();
    const parsed = buySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "تعداد سکه نامعتبر است" },
        { status: 400 }
      );
    }

    const coins = parsed.data.coins;
    const coinValue = await getSetting("COIN_VALUE");
    const amountToman = coins * coinValue;

    if (amountToman < 1000) {
      return NextResponse.json({ error: "مبلغ پرداخت بسیار کم است" }, { status: 400 });
    }

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
      type: "COINS",
      coins,
      amountToman,
      returnPath,
    });

    const payment = await prisma.paymentRequest.create({
      data: {
        id: paymentId,
        userId: user.id,
        type: "COINS",
        coins,
        amountToman,
        token: dbToken,
        status: "PENDING",
        returnPath,
      },
    });

    const kandooPayUrl = process.env.KANDOOPAY_URL?.replace(/\/$/, "") || "https://kandoopay.com";
    const appUrl = (process.env.KANDOO_PUBLIC_URL || SITE_URL).replace(/\/$/, "");
    const callbackUrl = `${kandooPayUrl}/checkout/kandoo?token=${encodeURIComponent(token)}&title=${encodeURIComponent("خرید سکه کندو")}&amount=${amountToman}&type=COINS&kandooUrl=${encodeURIComponent(appUrl)}&returnPath=${encodeURIComponent(returnPath)}`;

    console.log(`[wallet/buy] user ${user.id} created coins payment ${amountToman} toman, paymentId=${payment.id}`);

    return NextResponse.json({ ok: true, redirectUrl: callbackUrl, paymentId: payment.id });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[wallet/buy] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
