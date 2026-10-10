// بررسی آزاد بودن یوزرنیم هنگام ثبت نام (عمومی، با محدودیت نرخ)
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIdentifier } from "@/lib/rate-limit";

export async function GET(request: Request) {
  try {
    const rl = await rateLimit(`chkuser:${getClientIdentifier(request)}`, { windowMs: 60 * 1000, maxRequests: 30 });
    if (!rl.allowed) return NextResponse.json({ error: "درخواست زیاد" }, { status: 429 });
    const username = new URL(request.url).searchParams.get("username") ?? "";
    if (username.length < 3) return NextResponse.json({ available: false, error: "حداقل ۳ کاراکتر" });
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return NextResponse.json({ available: false, error: "فقط حروف انگلیسی، عدد و زیرخط" });
    const existing = await prisma.user.findUnique({ where: { username }, select: { id: true } });
    return NextResponse.json(existing ? { available: false, error: "این یوزرنیم قبلا انتخاب شده" } : { available: true });
  } catch (err) {
    console.error("[auth/check-username] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
