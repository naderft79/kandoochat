// API ثبت نام کاربر جدید
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { PROVINCES } from "@/lib/iran";
import { sanitizeName, sanitizeUsername, sanitizeJob, sanitizeString } from "@/lib/sanitize";
import { rateLimit, registerRateLimit, getClientIdentifier } from "@/lib/rate-limit";
import { getRequestIp } from "@/lib/client-ip";
import { recordLoginEvent } from "@/lib/login-events";
import { verifyProof } from "@/lib/phoneOtp";
import { getAllSettings } from "@/lib/settings";

const registerSchema = z.object({
  phone: z.string().regex(/^09\d{9}$/, "شماره موبایل معتبر نیست"),
  password: z.string().regex(/^\d{5,7}$/, "رمز عبور باید ۵ تا ۷ رقم باشد"),
  username: z.string().min(3, "یوزرنیم باید حداقل ۳ کاراکتر باشد").max(30).regex(/^[a-zA-Z0-9_]+$/, "یوزرنیم فقط میتواند حروف انگلیسی، عدد و زیرخط باشد"),
  firstName: z.string().min(2, "نام کوتاه است").max(50).regex(/^[آءأإابپتثجچحخدذرزژسشصضطظعغفقکگلمنوهیئؤ\s\u200C]+$/, "نام باید فارسی باشد"),
  lastName: z.string().min(2, "نام خانوادگی کوتاه است").max(50).regex(/^[آءأإابپتثجچحخدذرزژسشصضطظعغفقکگلمنوهیئؤ\s\u200C]+$/, "نام خانوادگی باید فارسی باشد"),
  gender: z.enum(["MALE", "FEMALE"]),
  province: z.string("استان را انتخاب کنید").min(1, "استان را انتخاب کنید"),
  city: z.string("شهر را انتخاب کنید").min(1, "شهر را انتخاب کنید"),
  age: z.coerce.number("سن معتبر نیست").int().min(18, "حداقل سن ۱۸ سال است").max(90),
  height: z.coerce.number("قد معتبر نیست").int().min(120, "قد معتبر نیست").max(230, "قد معتبر نیست"),
  weight: z.coerce.number("وزن معتبر نیست").int().min(35, "وزن معتبر نیست").max(250, "وزن معتبر نیست"),
  income: z.coerce.number().int().min(0).max(10_000_000_000),
  carModel: z.string().max(100).optional().or(z.literal("")),
  neighborhood: z.string().max(100).optional().or(z.literal("")),
  job: z.string().max(100).optional().or(z.literal("")),
  referralCode: z.string().optional(),
  phoneProof: z.string().optional(),
  termsAccepted: z.boolean().optional(),
  isSpecial: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    const ip = getClientIdentifier(request);
    const { allowed, retryAfterMs } = await rateLimit(`register:${ip}`, registerRateLimit);
    if (!allowed) {
      return NextResponse.json(
        { error: "تعداد ثبت نام از این آدرس بیش از حد مجاز است" },
        { status: 429, headers: { "Retry-After": String(Math.ceil((retryAfterMs ?? 60000) / 1000)) } }
      );
    }

    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "اطلاعات نامعتبر است" },
        { status: 400 }
      );
    }
    const data = parsed.data;

    // تایید قوانین و ۱۸ سال تمام (ثبت نام معمولی)
    if (!data.isSpecial && data.termsAccepted !== true) {
      return NextResponse.json({ error: "پذیرش قوانین و تایید ۱۸ سال تمام الزامی است" }, { status: 400 });
    }

    // تایید موبایل اجباری (مگر اینکه مدیر تایید پیامکی را غیرفعال کرده باشد)
    const settings0 = await getAllSettings();
    let phoneOk = false;
    if (settings0.otpEnabled && !data.isSpecial) {
      if (!(await verifyProof(data.phoneProof, data.phone, "REGISTER"))) {
        return NextResponse.json({ error: "ابتدا شماره موبایل خود را با کد پیامکی تایید کنید" }, { status: 400 });
      }
      phoneOk = true;
    }

    // پاکسازی ورودی های متنی
    data.firstName = sanitizeName(data.firstName);
    data.lastName = sanitizeName(data.lastName);
    data.username = sanitizeUsername(data.username);
    if (data.carModel) data.carModel = sanitizeString(data.carModel, 100);
    if (data.neighborhood) data.neighborhood = sanitizeString(data.neighborhood, 100);
    if (data.job) data.job = sanitizeJob(data.job);

    // اعتبارسنجی استان و شهر
    if (!PROVINCES[data.province]?.includes(data.city)) {
      return NextResponse.json(
        { error: "استان یا شهر معتبر نیست" },
        { status: 400 }
      );
    }

    const existingPhone = await prisma.user.findUnique({
      where: { phone: data.phone },
    });
    if (existingPhone) {
      return NextResponse.json(
        { error: "این شماره موبایل قبلا ثبت شده است" },
        { status: 409 }
      );
    }

    const existingUsername = await prisma.user.findUnique({
      where: { username: data.username },
    });
    if (existingUsername) {
      return NextResponse.json(
        { error: "این یوزرنیم قبلا انتخاب شده است" },
        { status: 409 }
      );
    }

    const hashed = await bcrypt.hash(data.password, 10);
    // کد دعوت ۷ کاراکتری برای کاربر جدید — ترکیب حروف بزرگ و اعداد
    const { generateReferralCode, findUserByReferralCode, createPendingReferral } = await import("@/lib/referral");
    const newReferralCode = await generateReferralCode();
    const user = await prisma.user.create({
      data: {
        phone: data.phone,
        username: data.username,
        password: hashed,
        firstName: data.firstName,
        lastName: data.lastName,
        gender: data.gender,
        province: data.province,
        city: data.city,
        age: data.age,
        height: data.height,
        weight: data.weight,
        income: data.income,
        carModel: data.carModel || null,
        neighborhood: data.neighborhood || null,
        job: data.job || null,
        isSpecial: data.isSpecial ?? false,
        phoneVerified: phoneOk,
        termsAcceptedAt: data.termsAccepted ? new Date() : null,
        passwordChangedAt: new Date(),
        referralCode: newReferralCode || null,
        wallet: { create: { balance: 0 } },
      },
    });

    // ثبت آخرین IP ثبت نام برای نمایش در پنل ادمین
    const clientIp = getRequestIp(request);
    await prisma.user.update({
      where: { id: user.id },
      data: { lastIp: clientIp, lastIpAt: new Date() },
    });
    await recordLoginEvent(user.id, "REGISTER", clientIp, request.headers.get("user-agent"));
    await createSession(user.id, user.role as import("@/lib/auth").UserRole);

    // ثبت کد دعوت اگر وجود داشته باشد — رکورد در انتظار ساخته می شود و پاداش بعد از فعالیت دعوت شده آزاد می شود
    if (data.referralCode) {
      try {
        const referrer = await findUserByReferralCode(data.referralCode);
        if (referrer && referrer.id !== user.id) {
          const created = await createPendingReferral(referrer.id, user.id);
          if (created) {
            await prisma.notification.create({
              data: {
                userId: referrer.id,
                type: "REFERRAL_REWARD",
                title: "دعوت جدید",
                body: `${user.firstName} با کد دعوت شما ثبت نام کرد. پاداش بعد از فعالیت او برای هر دو نفر آزاد می شود`,
              },
            });
            // ماموریت دعوت دوستان برای دعوت کننده
            const { incrementMissionProgress } = await import("@/lib/missions");
            void incrementMissionProgress(referrer.id, "invite_friend");
            console.log(`[register] pending referral: ${referrer.id} invited ${user.id}`);
          }
        }
      } catch (refErr) {
        console.error("[register] referral error:", refErr);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[register] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
