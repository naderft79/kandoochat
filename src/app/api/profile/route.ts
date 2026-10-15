// API ویرایش پروفایل کاربر
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError, isProtectedRoot, ROOT_LOCKED_MESSAGE } from "@/lib/auth";
import { PROVINCES } from "@/lib/iran";
import { sanitizeName, sanitizeUsername, sanitizeJob, sanitizeString, sanitizeBio } from "@/lib/sanitize";
import { checkProfileCompletion } from "@/lib/profileCheck";
import { incrementMissionProgress } from "@/lib/missions";

const PERSIAN_NAME_RE = /^[آءأإابپتثجچحخدذرزژسشصضطظعغفقکگلمنوهیئؤ\s\u200C]+$/;

const profileSchema = z.object({
  username: z.string("یوزرنیم را وارد کنید").min(3, "یوزرنیم باید حداقل ۳ کاراکتر باشد").max(30, "یوزرنیم نباید بیش از ۳۰ کاراکتر باشد").regex(/^[a-zA-Z0-9_]+$/, "یوزرنیم فقط میتواند حروف انگلیسی، عدد و زیرخط باشد"),
  firstName: z.string("نام را وارد کنید").min(2, "نام حداقل ۲ حرف باشد").max(50, "نام نباید بیش از ۵۰ حرف باشد").regex(PERSIAN_NAME_RE, "فقط اسم فارسی پشتیبانی می شود"),
  // نام خانوادگی اختیاری است — اگر وارد شده باشد باید فارسی باشد (بعد از پارس چک می شود)
  lastName: z.string().max(50, "نام خانوادگی نباید بیش از ۵۰ حرف باشد").optional().default(""),
  province: z.string("استان را انتخاب کنید").min(1, "استان را انتخاب کنید"),
  city: z.string("شهر را انتخاب کنید").min(1, "شهر را انتخاب کنید"),
  age: z.coerce.number("سن را وارد کنید").int("سن معتبر نیست").min(18, "حداقل سن ۱۸ سال است").max(90, "حداکثر سن ۹۰ سال است"),
  height: z.coerce.number("قد را وارد کنید").int("قد معتبر نیست").min(120, "قد حداقل ۱۲۰ سانتی متر است").max(230, "قد حداکثر ۲۳۰ سانتی متر است"),
  weight: z.coerce.number("وزن را وارد کنید").int("وزن معتبر نیست").min(35, "وزن حداقل ۳۵ کیلوگرم است").max(250, "وزن حداکثر ۲۵۰ کیلوگرم است"),
  income: z.coerce.number("درآمد ماهانه را وارد کنید").int("درآمد معتبر نیست").min(0, "درآمد معتبر نیست").max(10_000_000_000, "درآمد معتبر نیست"),
  carModel: z.string().max(100, "مدل ماشین طولانی است").optional().or(z.literal("")),
  neighborhood: z.string().max(100, "نام محله طولانی است").optional().or(z.literal("")),
  job: z.string().max(100, "نام شغل طولانی است").optional().or(z.literal("")),
  bio: z.string().max(500, "درباره من نباید بیش از ۵۰۰ حرف باشد").optional().or(z.literal("")),
});

export async function PUT(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const parsed = profileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "اطلاعات نامعتبر است" },
        { status: 400 }
      );
    }
    const data = parsed.data;

    // پاکسازی ورودی های متنی
    data.firstName = sanitizeName(data.firstName);
    data.lastName = sanitizeName(data.lastName);
    if (data.lastName && !PERSIAN_NAME_RE.test(data.lastName)) {
      return NextResponse.json({ error: "نام خانوادگی باید فارسی باشد" }, { status: 400 });
    }
    data.username = sanitizeUsername(data.username);
    if (data.bio) data.bio = sanitizeBio(data.bio);
    if (data.job) data.job = sanitizeJob(data.job);
    if (data.carModel) data.carModel = sanitizeString(data.carModel, 100);
    if (data.neighborhood) data.neighborhood = sanitizeString(data.neighborhood, 100);

    if (!PROVINCES[data.province]?.includes(data.city)) {
      return NextResponse.json(
        { error: "استان یا شهر معتبر نیست" },
        { status: 400 }
      );
    }

    if (data.username !== user.username) {
      // یوزرنیم حساب ریشه به هیچ وجه تغییر نمی کند
      if (isProtectedRoot(user)) {
        return NextResponse.json({ error: ROOT_LOCKED_MESSAGE }, { status: 403 });
      }
      const existing = await prisma.user.findUnique({
        where: { username: data.username },
      });
      if (existing && existing.id !== user.id) {
        return NextResponse.json(
          { error: "این یوزرنیم قبلا انتخاب شده است" },
          { status: 409 }
        );
      }
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        username: data.username,
        firstName: data.firstName,
        lastName: data.lastName,
        province: data.province,
        city: data.city,
        age: data.age,
        height: data.height,
        weight: data.weight,
        income: data.income,
        carModel: data.carModel || null,
        neighborhood: data.neighborhood || null,
        job: data.job || null,
        bio: data.bio || null,
      },
    });

    // ماموریت تکمیل پروفایل — فقط وقتی پروفایل واقعا کامل شده
    void checkProfileCompletion(user.id).then((r) => {
      if (r.isComplete) return incrementMissionProgress(user.id, "complete_profile");
    });

    // آزادسازی پاداش دعوت در صورت تکمیل شرایط
    const { maybeActivateReferral } = await import("@/lib/referral");
    void maybeActivateReferral(user.id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[profile] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
