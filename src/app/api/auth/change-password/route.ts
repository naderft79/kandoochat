// API تغییر رمز عبور کاربر با تایید رمز فعلی
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, createSession, AuthError, type UserRole } from "@/lib/auth";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "رمز فعلی را وارد کنید"),
  newPassword: z.string().regex(/^\d{5,7}$/, "رمز جدید باید ۵ تا ۷ رقم باشد"),
});

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "ورودی نامعتبر" },
        { status: 400 }
      );
    }

    // بررسی رمز فعلی
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { password: true },
    });
    if (!dbUser) {
      return NextResponse.json({ error: "کاربر یافت نشد" }, { status: 404 });
    }

    const isValid = await bcrypt.compare(parsed.data.currentPassword, dbUser.password);
    if (!isValid) {
      return NextResponse.json({ error: "رمز فعلی اشتباه است" }, { status: 401 });
    }

    // جلوگیری از تکرار رمز قبلی
    const isSamePassword = await bcrypt.compare(parsed.data.newPassword, dbUser.password);
    if (isSamePassword) {
      return NextResponse.json({ error: "رمز جدید نباید با رمز فعلی یکسان باشد" }, { status: 400 });
    }

    // به روز رسانی رمز — سشن های دیگر باطل و سشن فعلی تازه سازی می شود
    const hashedPassword = await bcrypt.hash(parsed.data.newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword, passwordChangedAt: new Date() },
    });
    await createSession(user.id, user.role as UserRole);

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[change-password] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
