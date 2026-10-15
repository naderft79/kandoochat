// API به روزرسانی lastSeen و isOnline کاربر
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, isImpersonating, AuthError } from "@/lib/auth";
import { getRequestIp } from "@/lib/client-ip";
import { recordHeartbeatIfDue } from "@/lib/login-events";
import { publishPresence } from "@/lib/presenceEvents";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json().catch(() => ({}));
    const isOnline = body.isOnline !== false;
    // در جلسه impersonate، IP و فعالیت ادمین نباید روی حساب کاربر ثبت شود
    const trackIp = !(await isImpersonating());
    const ip = getRequestIp(request);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastSeen: new Date(),
        isOnline,
        ...(trackIp ? { lastIp: ip, lastIpAt: new Date() } : {}),
      },
    });
    if (trackIp) await recordHeartbeatIfDue(user.id, ip, request.headers.get("user-agent"));
    // اطلاع لحظه ای تغییر وضعیت آنلاین/آفلاین به شنوندگان SSE
    publishPresence({ userId: user.id, isOnline, lastSeen: new Date().toISOString() });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
