// API درخواست تیک آبی — ۵ عکس سلفی + پیام صوتی و تایید مدیر
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
} from "@/lib/verification";

const REQUIRED_SELFIES = 5;

// وضعیت احراز هویت فعلی (هر دو نوع)
export async function GET() {
  try {
    const user = await requireUser();
    const [blueTick, kyc] = await Promise.all([
      prisma.verificationRequest.findFirst({
        where: { userId: user.id, kind: "BLUE_TICK" },
        orderBy: { createdAt: "desc" },
        select: { status: true, createdAt: true },
      }),
      prisma.verificationRequest.findFirst({
        where: { userId: user.id, kind: "KYC" },
        orderBy: { createdAt: "desc" },
        select: { status: true, createdAt: true },
      }),
    ]);
    return NextResponse.json({
      isVerified: user.isVerified,
      blueTickStatus: blueTick?.status ?? null,
      isIdentityVerified: user.isIdentityVerified,
      kycStatus: kyc?.status ?? null,
    });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

// ارسال درخواست تیک آبی
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

    if (user.isVerified) {
      return NextResponse.json({ error: "تیک آبی شما فعال است" }, { status: 400 });
    }

    const pending = await prisma.verificationRequest.findFirst({
      where: { userId: user.id, kind: "BLUE_TICK", status: "PENDING" },
      select: { id: true },
    });
    if (pending) {
      return NextResponse.json({ error: "درخواست شما در حال بررسی است" }, { status: 400 });
    }

    const formData = await request.formData();
    const selfies = formData
      .getAll("selfies")
      .filter((f): f is File => f instanceof File);
    const voice = formData.get("voice") as File | null;
    const acceptedRules = formData.get("acceptedRules") as string | null;

    if (selfies.length !== REQUIRED_SELFIES) {
      return NextResponse.json(
        { error: `ارسال ${REQUIRED_SELFIES} عکس سلفی الزامی است` },
        { status: 400 }
      );
    }

    for (const selfie of selfies) {
      const err = validateUpload(selfie, IMAGE_TYPES, "عکس سلفی");
      if (err) return NextResponse.json({ error: err }, { status: 400 });
    }

    const voiceErr = validateUpload(voice, AUDIO_TYPES, "پیام صوتی");
    if (voiceErr) return NextResponse.json({ error: voiceErr }, { status: 400 });

    if (acceptedRules !== "true") {
      return NextResponse.json({ error: "پذیرش قوانین الزامی است" }, { status: 400 });
    }

    // تشخیص چهره روی همه سلفی ها قبل از آپلود — اگر سرویس فعال باشد عکس نامناسب پذیرفته نمی شود
    const selfieBuffers = await Promise.all(
      selfies.map(async (f) => Buffer.from(await f.arrayBuffer()))
    );
    const faceCheck = await checkSelfieFaces(
      selfieBuffers.map((buffer, i) => ({ buffer, type: selfies[i].type }))
    );
    if (faceCheck.error) {
      return NextResponse.json({ error: faceCheck.error }, { status: 400 });
    }

    // ذخیره فایل ها — S3 در production، دیسک محلی در توسعه
    const selfieUrls = await Promise.all(
      selfieBuffers.map((buffer, i) =>
        uploadVerifyFile(user.id, buffer, selfies[i].type, selfies[i].name, "bluetick-selfie")
      )
    );
    const voiceUrl = await uploadVerifyFile(
      user.id,
      Buffer.from(await voice!.arrayBuffer()),
      voice!.type,
      voice!.name,
      "bluetick-voice"
    );

    await prisma.$transaction([
      prisma.verificationRequest.create({
        data: {
          userId: user.id,
          kind: "BLUE_TICK",
          status: "PENDING",
          selfieUrls: JSON.stringify(selfieUrls),
          voiceUrl,
          faceScore: faceCheck.faceScore,
          faceCount: faceCheck.faceCount,
          autoResult: faceCheck.autoResult,
        },
      }),
      prisma.notification.create({
        data: {
          userId: user.id,
          type: "VERIFY_BADGE",
          title: "درخواست تیک آبی ثبت شد",
          body: "درخواست شما در حال بررسی توسط تیم ما است. پس از تایید، تیک آبی فعال خواهد شد.",
        },
      }),
    ]);

    console.log(`[verify-badge] user ${user.id} submitted blue tick request`);
    return NextResponse.json({ ok: true, status: "PENDING" });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[verify-badge] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
