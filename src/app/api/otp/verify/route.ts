// تایید کد OTP
import { NextResponse } from "next/server";
import { z } from "zod";
import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth";

const verifySchema = z.object({
  code: z.string().length(6),
});

const MAX_ATTEMPTS = 5;

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const parsed = verifySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "کد نامعتبر است" }, { status: 400 });
    }

    const otp = await prisma.otpCode.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    if (!otp) {
      return NextResponse.json({ error: "کد تایید یافت نشد. دوباره درخواست کنید" }, { status: 400 });
    }

    if (new Date() > otp.expiresAt) {
      await prisma.otpCode.delete({ where: { id: otp.id } });
      return NextResponse.json({ error: "کد تایید منقضی شده است" }, { status: 400 });
    }

    if (otp.attempts >= MAX_ATTEMPTS) {
      await prisma.otpCode.delete({ where: { id: otp.id } });
      return NextResponse.json({ error: "تعداد تلاش ها بیش از حد مجاز است. دوباره درخواست کنید" }, { status: 400 });
    }

    const codeHash = createHash("sha256").update(`${user.id}:${parsed.data.code}`).digest("hex");
    if (codeHash !== otp.codeHash) {
      await prisma.otpCode.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
      return NextResponse.json({ error: "کد تایید اشتباه است" }, { status: 400 });
    }

    // تایید موفق — حذف کد و علامت‌گذاری موبایل
    await prisma.$transaction([
      prisma.otpCode.delete({ where: { id: otp.id } }),
      prisma.user.update({ where: { id: user.id }, data: { phoneVerified: true } }),
    ]);

    console.log(`[otp/verify] user ${user.id} phone verified`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[otp/verify] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
