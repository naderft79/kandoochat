// API ورود ادمین به حساب کاربر (impersonate)
import { NextResponse } from "next/server";
import { requireAdmin, impersonateUser, AuthError, ADMIN_ROLES } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAction } from "@/lib/audit";

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const { userId } = (await request.json()) as { userId: string };

    if (!userId) {
      return NextResponse.json({ error: "شناسه کاربر الزامی است" }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, isActive: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "کاربر یافت نشد" }, { status: 404 });
    }

    if (ADMIN_ROLES.includes(targetUser.role as any)) {
      return NextResponse.json({ error: "نمی توان وارد حساب مدیر شد" }, { status: 400 });
    }

    await impersonateUser(admin.id, targetUser.id, targetUser.role as import("@/lib/auth").UserRole);

    console.log(`[impersonate] admin ${admin.id} -> user ${targetUser.id}`);
    await logAction(admin.id, "IMPERSONATE", "USER", targetUser.id);
    return NextResponse.json({ ok: true, redirect: "/dashboard" });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    }
    console.error("[impersonate] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
