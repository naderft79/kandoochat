// تولید و ارسال کد OTP
import { NextResponse } from "next/server";
import { createHash, randomInt } from "crypto";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth";
import { getAllSettings } from "@/lib/settings";
import { sendOtpSms } from "@/lib/sms";
import { rateLimit, otpRateLimit, getClientIdentifier } from "@/lib/rate-limit";
import { verifyCaptcha } from "@/lib/captcha";

export async function POST(request: Request) {
  try {
    const ip = getClientIdentifier(request);
    const { allowed, retryAfterMs } = await rateLimit(`otp:${ip}`, otpRateLimit);
    if (!allowed) {
      return NextResponse.json(
        { error: "تعداد درخواست های کد تایید بیش از حد مجاز است" },
        { status: 429, headers: { "Retry-After": String(Math.ceil((retryAfterMs ?? 60000) / 1000)) } }
      );
    }

    const user = await requireUser();

    // کپچا — جلوی اسپم پیامک با نشست لاگین‌شده
    const body = await request.json().catch(() => ({}));
    if (!(await verifyCaptcha(body?.captchaId, body?.captchaText))) {
      return NextResponse.json({ error: "کد امنیتی اشتباه است یا منقضی شده؛ دوباره تلاش کنید" }, { status: 400 });
    }

    const settings = await getAllSettings();

    if (!settings.otpEnabled) {
      return NextResponse.json({ error: "تایید موبایل فعال نیست" }, { status: 400 });
    }

    if (user.phoneVerified) {
      return NextResponse.json({ error: "موبایل شما قبلا تایید شده است" }, { status: 400 });
    }

    // تولید کد ۶ رقمی
    const code = randomInt(100000, 1000000).toString();
    const codeHash = createHash("sha256").update(`${user.id}:${code}`).digest("hex");
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // ۲ دقیقه

    // حذف کدهای قبلی کاربر و ایجاد کد جدید
    await prisma.$transaction([
      prisma.otpCode.deleteMany({ where: { userId: user.id } }),
      prisma.otpCode.create({
        data: { userId: user.id, codeHash, expiresAt },
      }),
    ]);

    const sent = await sendOtpSms(user.phone, code);
    if (!sent) {
      return NextResponse.json({ error: "ارسال پیامک ناموفق بود" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, message: "کد تایید ارسال شد" });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[otp/send] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
