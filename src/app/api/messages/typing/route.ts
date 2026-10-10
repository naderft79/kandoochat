// API وضعیت تایپ — ثبت و بررسی با دیتابیس
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth";
import { publishToConversation } from "@/lib/chatEvents";

const typingSchema = z.object({
  conversationId: z.string().min(1),
  isTyping: z.boolean(),
});

// POST — ثبت وضعیت تایپ
export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const parsed = typingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "اطلاعات نامعتبر" }, { status: 400 });
    }

    const { conversationId, isTyping } = parsed.data;

    // بررسی مالکیت گفتگو
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation || (conversation.userAId !== user.id && conversation.userBId !== user.id)) {
      return NextResponse.json({ error: "گفتگو یافت نشد" }, { status: 404 });
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 5000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isTyping,
        typingConversationId: isTyping ? conversationId : null,
        typingExpiresAt: isTyping ? expiresAt : null,
      },
    });

    // اطلاع رسانی وضعیت تایپ به طرف مقابل از طریق SSE
    publishToConversation(conversationId, "typing", { userId: user.id, isTyping });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[typing POST] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

// GET — بررسی وضعیت تایپ طرف مقابل
export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId") ?? "";

    if (!conversationId) {
      return NextResponse.json({ error: "شناسه گفتگو لازم است" }, { status: 400 });
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation || (conversation.userAId !== user.id && conversation.userBId !== user.id)) {
      return NextResponse.json({ error: "گفتگو یافت نشد" }, { status: 404 });
    }

    const otherUserId =
      conversation.userAId === user.id
        ? conversation.userBId
        : conversation.userAId;

    const otherUser = await prisma.user.findUnique({
      where: { id: otherUserId },
      select: { isTyping: true, typingConversationId: true, typingExpiresAt: true },
    });

    const now = new Date();
    const isTyping = !!(
      otherUser?.isTyping &&
      otherUser?.typingConversationId === conversationId &&
      (!otherUser?.typingExpiresAt || otherUser.typingExpiresAt > now)
    );

    return NextResponse.json({ isTyping });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[typing GET] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
