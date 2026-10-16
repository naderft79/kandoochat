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
    // در جلسه impersonate هیچ تغییری روی حضور کاربر نمی آید — آنلاین بودن فقط با ورود خود کاربر ثبت می شود
    if (await isImpersonating()) return NextResponse.json({ ok: true });
    const body = await request.json().catch(() => ({}));
    const isOnline = body.isOnline !== false;
    const ip = getRequestIp(request);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastSeen: new Date(),
        isOnline,
        lastIp: ip,
        lastIpAt: new Date(),
      },
    });
    await recordHeartbeatIfDue(user.id, ip, request.headers.get("user-agent"));
    // اطلاع لحظه ای تغییر وضعیت آنلاین/آفلاین به شنوندگان SSE
    publishPresence({ userId: user.id, isOnline, lastSeen: new Date().toISOString() });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
