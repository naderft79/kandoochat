// تعیین رمز جدید بعد از تایید کد پیامکی
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyProof } from "@/lib/phoneOtp";
import { isProtectedRoot, ROOT_LOCKED_MESSAGE } from "@/lib/auth";
import { rateLimit, getClientIdentifier } from "@/lib/rate-limit";

const schema = z.object({
  phone: z.string().regex(/^09\d{9}$/),
  proof: z.string().min(10),
  password: z.string().regex(/^\d{5,7}$/, "رمز عبور باید ۵ تا ۷ رقم باشد"),
});

export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "درخواست نامعتبر" }, { status: 400 });
    const { phone, proof, password } = parsed.data;
    if (!(await verifyProof(proof, phone, "RESET"))) {
      return NextResponse.json({ error: "تایید شماره منقضی شده است. دوباره کد بگیرید" }, { status: 400 });
    }
    const rl = await rateLimit(`preset:${getClientIdentifier(request)}:${phone}`, { windowMs: 15 * 60 * 1000, maxRequests: 10 });
    if (!rl.allowed) return NextResponse.json({ error: "تلاش های زیاد؛ بعدا دوباره امتحان کنید" }, { status: 429 });
    const user = await prisma.user.findUnique({ where: { phone }, select: { id: true, isActive: true, username: true } });
    if (!user || !user.isActive) return NextResponse.json({ error: "حساب یافت نشد" }, { status: 404 });
    // رمز حساب ریشه به هیچ وجه تغییر نمی کند
    if (isProtectedRoot(user)) {
      return NextResponse.json({ error: ROOT_LOCKED_MESSAGE }, { status: 403 });
    }
    // به محض تغییر رمز همه سشن های قبلی کاربر باطل می شوند
    await prisma.user.update({ where: { id: user.id }, data: { password: await bcrypt.hash(password, 10), passwordChangedAt: new Date() } });
    console.log(`[auth/reset-password] password reset for user ${user.id}`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[auth/reset-password] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
