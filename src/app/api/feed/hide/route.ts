// «نشان نده»: پنهان کردن یک پروفایل از فید خانه
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth";

const schema = z.object({ hiddenId: z.string().min(1) });

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success || parsed.data.hiddenId === user.id) {
      return NextResponse.json({ error: "درخواست نامعتبر" }, { status: 400 });
    }
    const exists = await prisma.user.findUnique({ where: { id: parsed.data.hiddenId }, select: { id: true } });
    if (!exists) return NextResponse.json({ error: "کاربر یافت نشد" }, { status: 404 });
    await prisma.feedHide.upsert({
      where: { userId_hiddenId: { userId: user.id, hiddenId: parsed.data.hiddenId } },
      update: {},
      create: { userId: user.id, hiddenId: parsed.data.hiddenId },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[feed/hide] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

// برگرداندن «نشان نده»
export async function DELETE(request: Request) {
  try {
    const user = await requireUser();
    const hiddenId = new URL(request.url).searchParams.get("hiddenId");
    if (!hiddenId) return NextResponse.json({ error: "درخواست نامعتبر" }, { status: 400 });
    await prisma.feedHide.deleteMany({ where: { userId: user.id, hiddenId } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[feed/hide DELETE] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
