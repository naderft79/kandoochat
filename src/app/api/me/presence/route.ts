// API به روزرسانی lastSeen و isOnline کاربر
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, isImpersonating, AuthError } from "@/lib/auth";
import { getRequestIp } from "@/lib/client-ip";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json().catch(() => ({}));
    const isOnline = body.isOnline !== false;
    // در جلسه impersonate، IP ادمین نباید روی حساب کاربر ثبت شود
    const trackIp = !(await isImpersonating());

    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastSeen: new Date(),
        isOnline,
        ...(trackIp ? { lastIp: getRequestIp(request), lastIpAt: new Date() } : {}),
      },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
