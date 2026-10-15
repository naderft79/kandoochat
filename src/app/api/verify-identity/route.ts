// API احراز هویت کامل (KYC) — سلفی + ویس + کارت ملی + مشخصات واقعی؛ لازم برای برداشت
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth";
import { rateLimitUser } from "@/lib/rate-limit";
import {
  IMAGE_TYPES,
  AUDIO_TYPES,
  validateUpload,
  uploadVerifyFile,
  checkSelfieFaces,
  isValidNationalCode,
} from "@/lib/verification";

// وضعیت احراز هویت کامل فعلی
export async function GET() {
  try {
    const user = await requireUser();
    const last = await prisma.verificationRequest.findFirst({
      where: { userId: user.id, kind: "KYC" },
      orderBy: { createdAt: "desc" },
      select: { status: true, createdAt: true },
    });
    return NextResponse.json({
      isIdentityVerified: user.isIdentityVerified,
      status: last?.status ?? null,
    });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

// ارسال درخواست احراز هویت کامل
export async function POST(request: Request) {
  try {
    const user = await requireUser();

    // سقف درخواست احراز (تیک آبی + کامل مشترک): ۳ در روز
    const limited = await rateLimitUser(
      user.id,
      "verify-request",
      { windowMs: 24 * 60 * 60 * 1000, maxRequests: 3 },
      "به سقف ارسال درخواست احراز در هر روز رسیدید؛ لطفا فردا تلاش کنید"
    );
    if (limited) return limited;

    if (user.isIdentityVerified) {
      return NextResponse.json({ error: "هویت شما تایید شده است" }, { status: 400 });
    }

    const pending = await prisma.verificationRequest.findFirst({
      where: { userId: user.id, kind: "KYC", status: "PENDING" },
      select: { id: true },
    });
    if (pending) {
      return NextResponse.json({ error: "درخواست شما در حال بررسی است" }, { status: 400 });
    }

    const formData = await request.formData();
    const selfie = formData.get("selfie") as File | null;
    const voice = formData.get("voice") as File | null;
    const idCardFront = formData.get("idCardFront") as File | null;
    const idCardBack = formData.get("idCardBack") as File | null;
    const nationalCode = ((formData.get("nationalCode") as string) ?? "").trim();
    const fullName = ((formData.get("fullName") as string) ?? "").trim();
    const birthDate = ((formData.get("birthDate") as string) ?? "").trim();
    const acceptedRules = formData.get("acceptedRules") as string | null;

    // اعتبارسنجی فایل ها
    const fileChecks: [File | null, string[], string][] = [
      [selfie, IMAGE_TYPES, "عکس سلفی"],
      [idCardFront, IMAGE_TYPES, "عکس روی کارت ملی"],
      [idCardBack, IMAGE_TYPES, "عکس پشت کارت ملی"],
      [voice, AUDIO_TYPES, "پیام صوتی"],
    ];
    for (const [file, types, label] of fileChecks) {
      const err = validateUpload(file, types, label);
      if (err) return NextResponse.json({ error: err }, { status: 400 });
    }

    // اعتبارسنجی مشخصات متنی
    if (!isValidNationalCode(nationalCode)) {
      return NextResponse.json({ error: "کد ملی وارد شده معتبر نیست" }, { status: 400 });
    }
    if (fullName.length < 3 || fullName.length > 100) {
      return NextResponse.json({ error: "نام و نام خانوادگی را کامل وارد کنید" }, { status: 400 });
    }
    // تاریخ تولد به صورت ISO میلادی (YYYY-MM-DD) از سمت کلاینت می آید؛ سن ۱۸ تا ۸۰
    const birthMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate);
    const birth = birthMatch
      ? new Date(Date.UTC(Number(birthMatch[1]), Number(birthMatch[2]) - 1, Number(birthMatch[3])))
      : null;
    if (!birth || isNaN(birth.getTime())) {
      return NextResponse.json({ error: "تاریخ تولد معتبر نیست" }, { status: 400 });
    }
    const now = new Date();
    const age =
      now.getUTCFullYear() -
      birth.getUTCFullYear() -
      (now < new Date(Date.UTC(now.getUTCFullYear(), birth.getUTCMonth(), birth.getUTCDate())) ? 1 : 0);
    if (age < 18 || age > 80) {
      return NextResponse.json({ error: "سن شما باید بین ۱۸ تا ۸۰ سال باشد" }, { status: 400 });
    }
    if (acceptedRules !== "true") {
      return NextResponse.json({ error: "پذیرش قوانین الزامی است" }, { status: 400 });
    }

    // تشخیص چهره روی سلفی
    const selfieBuffer = Buffer.from(await selfie!.arrayBuffer());
    const faceCheck = await checkSelfieFaces([{ buffer: selfieBuffer, type: selfie!.type }]);
    if (faceCheck.error) {
      return NextResponse.json({ error: faceCheck.error }, { status: 400 });
    }

    // آپلود فایل ها
    const [selfieUrl, voiceUrl, idCardFrontUrl, idCardBackUrl] = await Promise.all([
      uploadVerifyFile(user.id, selfieBuffer, selfie!.type, selfie!.name, "kyc-selfie"),
      (async () =>
        uploadVerifyFile(
          user.id,
          Buffer.from(await voice!.arrayBuffer()),
          voice!.type,
          voice!.name,
          "kyc-voice"
        ))(),
      (async () =>
        uploadVerifyFile(
          user.id,
          Buffer.from(await idCardFront!.arrayBuffer()),
          idCardFront!.type,
          idCardFront!.name,
          "kyc-idfront"
        ))(),
      (async () =>
        uploadVerifyFile(
          user.id,
          Buffer.from(await idCardBack!.arrayBuffer()),
          idCardBack!.type,
          idCardBack!.name,
          "kyc-idback"
        ))(),
    ]);

    await prisma.$transaction([
      prisma.verificationRequest.create({
        data: {
          userId: user.id,
          kind: "KYC",
          status: "PENDING",
          selfieUrls: JSON.stringify([selfieUrl]),
          voiceUrl,
          idCardFrontUrl,
          idCardBackUrl,
          nationalCode,
          fullName,
          birthDate,
          faceScore: faceCheck.faceScore,
          faceCount: faceCheck.faceCount,
          autoResult: faceCheck.autoResult,
        },
      }),
      prisma.notification.create({
        data: {
          userId: user.id,
          type: "VERIFY_IDENTITY",
          title: "درخواست احراز هویت ثبت شد",
          body: "مدارک شما در حال بررسی توسط تیم ما است. پس از تایید، امکان برداشت برای شما فعال می شود.",
        },
      }),
    ]);

    console.log(`[verify-identity] user ${user.id} submitted kyc request`);
    return NextResponse.json({ ok: true, status: "PENDING" });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[verify-identity] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
