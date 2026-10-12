// API ورود کاربر
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { rateLimit, loginRateLimit, getClientIdentifier } from "@/lib/rate-limit";
import { getRequestIp } from "@/lib/client-ip";
import { recordLoginEvent } from "@/lib/login-events";
import { ADMIN_ROLES } from "@/lib/auth";
import { isUserApp, isAdminApp } from "@/lib/app-ua";

const loginSchema = z.object({
  phone: z.union([
    z.string().regex(/^09\d{9}$/),
    z.literal("1"),
  ]),
  password: z.string().min(1).max(100),
});

export async function POST(request: Request) {
  try {
    const ip = getClientIdentifier(request);
    const { allowed, retryAfterMs } = await rateLimit(`login:${ip}`, loginRateLimit);
    if (!allowed) {
      return NextResponse.json(
        { error: "تعداد درخواست ها بیش از حد مجاز است. لطفا بعدا تلاش کنید." },
        { status: 429, headers: { "Retry-After": String(Math.ceil((retryAfterMs ?? 60000) / 1000)) } }
      );
    }

    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "شماره موبایل یا رمز عبور نامعتبر است" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { phone: parsed.data.phone },
    });
    // پیام یکسان برای جلوگیری از افشای وجود کاربر
    if (!user || !(await bcrypt.compare(parsed.data.password, user.password))) {
      return NextResponse.json(
        { error: "شماره موبایل یا رمز عبور اشتباه است" },
        { status: 401 }
      );
    }
    if (!user.isActive) {
      return NextResponse.json(
        { error: "حساب شما مسدود شده است" },
        { status: 403 }
      );
    }

    // جداسازی اپ ها: ورود مدیر در اپ کاربر و ورود کاربر عادی در اپ مدیریت
    // با همان پاسخ رمز اشتباه رد می شود تا هیچ اشاره ای به علت نشود
    const ua = request.headers.get("user-agent");
    const isAdminRole = (ADMIN_ROLES as readonly string[]).includes(user.role);
    if ((isAdminRole && isUserApp(ua)) || (!isAdminRole && isAdminApp(ua))) {
      console.warn(
        `[login] blocked ${isAdminRole ? "admin-in-user-app" : "user-in-admin-app"}: ${user.phone}`
      );
      return NextResponse.json(
        { error: "شماره موبایل یا رمز عبور اشتباه است" },
        { status: 401 }
      );
    }

    // ثبت آخرین IP ورود برای نمایش در پنل ادمین
    const clientIp = getRequestIp(request);
    await prisma.user.update({
      where: { id: user.id },
      data: { lastIp: clientIp, lastIpAt: new Date() },
    });
    await recordLoginEvent(user.id, "LOGIN", clientIp, request.headers.get("user-agent"));
    await createSession(user.id, user.role as import("@/lib/auth").UserRole);
    return NextResponse.json({ ok: true, role: user.role });
  } catch (err) {
    console.error("[login] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
