// لاگین خودکار ادمین از طریق QR — فقط شبکه محلی/توسعه؛ توکن روزانه HMAC
import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSession, ADMIN_ROLES, type UserRole } from "@/lib/auth";
import { qrLoginEnabled, verifyQrToken } from "@/lib/qr-login";

export async function GET(request: Request) {
  if (!qrLoginEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const token = new URL(request.url).searchParams.get("t") ?? "";
  if (!verifyQrToken(token)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // اولین ادمین فعال سیستم
  const user = await prisma.user.findFirst({
    where: { role: { in: [...ADMIN_ROLES] }, isActive: true },
    orderBy: { createdAt: "asc" },
  });

  if (!user || !user.isActive) {
    return NextResponse.json({ error: "کاربر ادمین یافت نشد" }, { status: 404 });
  }

  await createSession(user.id, user.role as UserRole);
  console.log(`[qr-login] auto login as ${user.phone} (${user.role})`);
  redirect("/admin");
}
