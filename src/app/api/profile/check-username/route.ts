// API بررسی عدم تکرار یوزرنیم
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");

    if (!username || username.length < 3) {
      return NextResponse.json({ available: false, error: "حداقل ۳ کاراکتر" });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return NextResponse.json({ available: false, error: "فقط حروف انگلیسی، عدد و زیرخط" });
    }

    const existing = await prisma.user.findUnique({
      where: { username },
    });

    if (existing && existing.id !== user.id) {
      return NextResponse.json({ available: false, error: "این یوزرنیم قبلا انتخاب شده" });
    }

    return NextResponse.json({ available: true });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
