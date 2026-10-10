// API لایک استوری
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth";

// POST — لایک/حذف لایک استوری
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

    // بررسی لایک موجود
    const existing = await prisma.storyLike.findUnique({
      where: { storyId_userId: { storyId, userId: user.id } },
    });

    if (existing) {
      await prisma.storyLike.delete({ where: { id: existing.id } });
      return NextResponse.json({ ok: true, liked: false });
    } else {
      await prisma.storyLike.create({ data: { storyId, userId: user.id } });

      // نوتیفیکیشن برای صاحب استوری
      if (story.userId !== user.id) {
        await prisma.notification.create({
          data: {
            userId: story.userId,
            type: "LIKE",
            title: "لایک استوری",
            body: `${user.firstName} استوری شما را لایک کرد`,
            data: JSON.stringify({ senderId: user.id, storyId }),
          },
        });
      }

      return NextResponse.json({ ok: true, liked: true });
    }
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[story like] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
