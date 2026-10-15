// ارسال کد تایید برای ثبت نام یا بازیابی رمز (بدون نیاز به ورود)
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIdentifier } from "@/lib/rate-limit";
import { issueOtp } from "@/lib/phoneOtp";
import { verifyCaptcha } from "@/lib/captcha";

const schema = z.object({
  phone: z.string().regex(/^09\d{9}$/, "شماره موبایل معتبر نیست"),
  purpose: z.enum(["REGISTER", "RESET"]),
  captchaId: z.string().min(1),
  captchaText: z.string().min(1).max(20),
});

export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "درخواست نامعتبر" }, { status: 400 });
    const { phone, purpose } = parsed.data;

    // کپچا — جلوی اسپم پیامک و ثبت نام انبوه بات ها را می گیرد
    if (!(await verifyCaptcha(parsed.data.captchaId, parsed.data.captchaText))) {
      return NextResponse.json({ error: "کد امنیتی اشتباه است یا منقضی شده؛ دوباره تلاش کنید" }, { status: 400 });
    }

    // محدودیت هم بر اساس IP و هم شماره (جلوگیری از اسپم پیامک)
    const ip = getClientIdentifier(request);
    const limit = { windowMs: 15 * 60 * 1000, maxRequests: 5 };
    const [byIp, byPhone] = await Promise.all([rateLimit(`potp-ip:${ip}`, { windowMs: 15 * 60 * 1000, maxRequests: 15 }), rateLimit(`potp:${phone}`, limit)]);
    if (!byIp.allowed || !byPhone.allowed) {
      return NextResponse.json({ error: "تعداد درخواست ها بیش از حد مجاز است. بعدا تلاش کنید" }, { status: 429 });
    }

    const user = await prisma.user.findUnique({ where: { phone }, select: { id: true, isActive: true } });
    if (purpose === "REGISTER" && user) {
      return NextResponse.json({ error: "این شماره قبلا ثبت نام کرده است. وارد شوید" }, { status: 409 });
    }
    // برای بازیابی رمز وجود/عدم وجود حساب فاش نمی شود
    if (purpose === "RESET" && (!user || !user.isActive)) {
      return NextResponse.json({ ok: true });
    }

    const r = await issueOtp(phone, purpose);
    if (!r.ok) {
      if ("retryAfterSec" in r) return NextResponse.json({ error: `لطفا ${r.retryAfterSec} ثانیه دیگر دوباره تلاش کنید`, retryAfterSec: r.retryAfterSec }, { status: 429 });
      return NextResponse.json({ error: "ارسال پیامک ناموفق بود" }, { status: 502 });
    }
    return NextResponse.json({ ok: true, ...(r.devCode ? { devCode: r.devCode } : {}) });
  } catch (err) {
    console.error("[auth/otp/send] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
