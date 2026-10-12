// خروج از همه دستگاه ها — با جلو بردن passwordChangedAt همه سشن ها باطل می شوند
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, destroySession, AuthError } from "@/lib/auth";

export async function POST() {
  try {
    const user = await requireUser();
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordChangedAt: new Date() },
    });
    await destroySession();
    console.log(`[account/logout-all] user ${user.id} invalidated all sessions`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[account/logout-all] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
