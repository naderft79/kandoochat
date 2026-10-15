// API واکنش (reaction) به پیام
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth";
import { publishToConversation } from "@/lib/chatEvents";

const reactionSchema = z.object({
  messageId: z.string().min(1),
  emoji: z.string().min(1).max(10).nullable(),
});

export async function PATCH(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const parsed = reactionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "اطلاعات نامعتبر" }, { status: 400 });
    }

    const { messageId, emoji } = parsed.data;

    // بررسی اینکه پیام مربوط به گفتگوی کاربر است
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: { conversation: true },
    });
    if (!message) {
      return NextResponse.json({ error: "پیام یافت نشد" }, { status: 404 });
    }
    const conv = message.conversation;
    if (conv.userAId !== user.id && conv.userBId !== user.id) {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    }

    await prisma.message.update({
      where: { id: messageId },
      data: { reaction: emoji },
    });

    // اطلاع لحظه ای واکنش به طرف مقابل گفتگو
    publishToConversation(message.conversationId, "reaction", {
      messageId,
      reaction: emoji,
      byUserId: user.id,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[messages/reaction] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
