// API ثبت بازدید استوری
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id: storyId } = await params;

    const story = await prisma.story.findUnique({ where: { id: storyId } });
    if (!story) {
      return NextResponse.json({ error: "استوری یافت نشد" }, { status: 404 });
    }

    // ثبت بازدید (اگر قبلا ثبت نشده باشد)
    await prisma.storyView.upsert({
      where: {
        storyId_viewerId: { storyId, viewerId: user.id },
      },
      create: { storyId, viewerId: user.id },
      update: {},
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[story view] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
