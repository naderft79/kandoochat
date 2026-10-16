// API ثبت نام کاربر جدید
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { PROVINCES } from "@/lib/iran";
import { sanitizeName, sanitizeUsername, sanitizeJob } from "@/lib/sanitize";
import { rateLimit, registerRateLimit, getClientIdentifier } from "@/lib/rate-limit";
import { getRequestIp } from "@/lib/client-ip";
import { recordLoginEvent } from "@/lib/login-events";
import { verifyProof } from "@/lib/phoneOtp";
import { getAllSettings } from "@/lib/settings";
import { verifyCaptcha } from "@/lib/captcha";
import { containsProfanity } from "@/lib/profanity";

const PERSIAN_NAME_RE = /^[آءأإابپتثجچحخدذرزژسشصضطظعغفقکگلمنوهیئؤ\s\u200C]+$/;

const registerSchema = z.object({
  phone: z.string("شماره موبایل را وارد کنید").regex(/^09\d{9}$/, "شماره موبایل معتبر نیست (مثال: ۰۹۱۲۳۴۵۶۷۸۹)"),
  password: z.string("رمز عبور را وارد کنید").regex(/^\d{5,7}$/, "رمز عبور باید ۵ تا ۷ رقم باشد"),
  username: z.string("یوزرنیم را وارد کنید").min(3, "یوزرنیم باید حداقل ۳ کاراکتر باشد").max(30, "یوزرنیم نباید بیش از ۳۰ کاراکتر باشد").regex(/^[a-zA-Z0-9_]+$/, "یوزرنیم فقط میتواند حروف انگلیسی، عدد و زیرخط باشد"),
  firstName: z.string("نام را وارد کنید").min(2, "نام حداقل ۲ حرف باشد").max(50, "نام نباید بیش از ۵۰ حرف باشد").regex(PERSIAN_NAME_RE, "فقط اسم فارسی پشتیبانی می شود"),
  // نام خانوادگی اختیاری است — اگر وارد شده باشد باید فارسی باشد (بعد از پارس چک می شود)
  lastName: z.string().max(50, "نام خانوادگی نباید بیش از ۵۰ حرف باشد").optional().default(""),
  gender: z.enum(["MALE", "FEMALE"], "جنسیت را انتخاب کنید"),
  province: z.string("استان را انتخاب کنید").min(1, "استان را انتخاب کنید"),
  city: z.string("شهر را انتخاب کنید").min(1, "شهر را انتخاب کنید"),
  age: z.coerce.number("سال تولد را انتخاب کنید").int("سن معتبر نیست").min(18, "حداقل سن ۱۸ سال است").max(90, "حداکثر سن ۹۰ سال است"),
  height: z.coerce.number("قد را انتخاب کنید").int("قد معتبر نیست").min(120, "قد حداقل ۱۲۰ سانتی متر است").max(230, "قد حداکثر ۲۳۰ سانتی متر است"),
  weight: z.coerce.number("وزن را انتخاب کنید").int("وزن معتبر نیست").min(35, "وزن حداقل ۳۵ کیلوگرم است").max(250, "وزن حداکثر ۲۵۰ کیلوگرم است"),
  income: z.coerce.number("درآمد ماهانه را انتخاب کنید").int("درآمد معتبر نیست").min(0, "درآمد معتبر نیست").max(10_000_000_000, "درآمد معتبر نیست"),
  job: z.string().max(100).optional().or(z.literal("")),
  referralCode: z.string().optional(),
  phoneProof: z.string().optional(),
  termsAccepted: z.boolean().optional(),
  isSpecial: z.boolean().optional(),
  specialSlug: z.string().max(100).optional(),
  captchaId: z.string().min(1),
  captchaText: z.string().min(1).max(20),
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

    // کپچا — جلوی ثبت نام انبوه بات ها
    if (!(await verifyCaptcha(data.captchaId, data.captchaText))) {
      return NextResponse.json(
        { error: "کد امنیتی اشتباه است یا منقضی شده؛ دوباره تلاش کنید" },
        { status: 400 }
      );
    }

    const settings0 = await getAllSettings();

    // پرچم ویژه فقط با اسلاگ مخفی ثبت نام ویژه فعال می شود — خودکار قابل ادعا نیست
    const isSpecial = !!data.isSpecial && data.specialSlug === settings0.specialRegisterSlug;
    if (data.isSpecial && !isSpecial) {
      return NextResponse.json({ error: "لینک ثبت نام ویژه معتبر نیست" }, { status: 400 });
    }

    // تایید قوانین و ۱۸ سال تمام — برای همه ثبت نام ها (عادی و ویژه)
    if (data.termsAccepted !== true) {
      return NextResponse.json({ error: "پذیرش قوانین و تایید ۱۸ سال تمام الزامی است" }, { status: 400 });
    }

    // تایید موبایل اجباری (مگر اینکه مدیر تایید پیامکی را غیرفعال کرده باشد)
    let phoneOk = false;
    if (settings0.otpEnabled) {
      if (!(await verifyProof(data.phoneProof, data.phone, "REGISTER"))) {
        return NextResponse.json({ error: "ابتدا شماره موبایل خود را با کد پیامکی تایید کنید" }, { status: 400 });
      }
      phoneOk = true;
    }

    // پاکسازی ورودی های متنی
    data.firstName = sanitizeName(data.firstName);
    data.lastName = sanitizeName(data.lastName);
    if (data.lastName && !PERSIAN_NAME_RE.test(data.lastName)) {
      return NextResponse.json({ error: "نام خانوادگی باید فارسی باشد" }, { status: 400 });
    }
    data.username = sanitizeUsername(data.username);
    // فیلتر الفاظ رکیک و سکسی در نام، نام خانوادگی و یوزرنیم
    if (containsProfanity(data.firstName)) {
      return NextResponse.json({ error: "این نام مجاز نیست" }, { status: 400 });
    }
    if (data.lastName && containsProfanity(data.lastName)) {
      return NextResponse.json({ error: "این نام خانوادگی مجاز نیست" }, { status: 400 });
    }
    if (containsProfanity(data.username)) {
      return NextResponse.json({ error: "این یوزرنیم مجاز نیست" }, { status: 400 });
    }
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
        job: data.job || null,
        isSpecial,
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
    let freeWeekSub = false;
    let referrerName = "";
    if (data.referralCode) {
      try {
        const referrer = await findUserByReferralCode(data.referralCode);
        if (referrer && referrer.id !== user.id) {
          const created = await createPendingReferral(referrer.id, user.id);
          if (created) {
            referrerName = referrer.firstName;
            // قانون «اشتراک یک هفته ای» — اعضای دعوت شده یک هفته اشتراک رایگان می گیرند
            if (settings0.freeWeekSubscription) {
              const endsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
              await prisma.subscription.create({
                data: { userId: user.id, tier: "یک هفته رایگان", startsAt: new Date(), endsAt, coinsPaid: 0 },
              });
              await prisma.notification.create({
                data: {
                  userId: user.id,
                  type: "SUBSCRIPTION_PURCHASED",
                  title: "اشتراک هدیه",
                  body: `یک هفته اشتراک رایگان به هدیه دعوت ${referrer.firstName} فعال شد`,
                },
              });
              freeWeekSub = true;
            }
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

    // اطلاع پیامکی به مدیران — ثبت نام کاربر جدید
    void import("@/lib/sms").then(({ notifyAdminsSms }) =>
      notifyAdminsSms("کاربر جدیدی ثبت نام کرد")
    );

    return NextResponse.json({ ok: true, freeWeekSub, referrerName });
  } catch (err) {
    console.error("[register] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
