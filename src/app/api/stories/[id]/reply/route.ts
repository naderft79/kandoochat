// API ریپلای/پاسخ به استوری — پیام در چت + نوتیفیکیشن
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth";
import { hasActiveSubscription } from "@/lib/finance";
import { sanitizeString } from "@/lib/sanitize";
import { publishToConversation } from "@/lib/chatEvents";
import { notifyUser } from "@/lib/notifications";

const replySchema = z.object({
  content: z.string().min(1, "متن خالی است").max(500),
});

// POST — ارسال ریپلای به استوری + شروع گفتگو
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id: storyId } = await params;
    const body = await request.json();
    const parsed = replySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "متن نامعتبر" }, { status: 400 });
    }

    const story = await prisma.story.findUnique({
      where: { id: storyId },
      select: { id: true, userId: true },
    });
    if (!story) {
      return NextResponse.json({ error: "استوری یافت نشد" }, { status: 404 });
    }

    // شرط تکمیل پروفایل حذف شد — پیام دادن با هر پروفایلی آزاد است

    // ثبت ریپلای
    const reply = await prisma.storyReply.create({
      data: {
        storyId,
        senderId: user.id,
        receiverId: story.userId,
        content: sanitizeString(parsed.data.content, 500),
      },
    });

    // ایجاد یا یافتن گفتگو
    const [userAId, userBId] = [user.id, story.userId].sort();
    let conversation = await prisma.conversation.findUnique({
      where: { userAId_userBId: { userAId, userBId } },
    });

    if (!conversation) {
      // فقط شروع کننده گفتگو باید اشتراک فعال داشته باشد
      const meSub = await hasActiveSubscription(user.id);
      if (!meSub) {
        return NextResponse.json(
          { error: "SUBSCRIPTION_REQUIRED" },
          { status: 402 }
        );
      }
      conversation = await prisma.conversation.create({
        data: { userAId, userBId, startedBy: user.id },
      });
    }

    // ارسال پیام در چت با اشاره به استوری
    const msg = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: user.id,
        content: sanitizeString(parsed.data.content, 500),
        type: "TEXT",
      },
      include: {
        replyTo: { select: { id: true, content: true, type: true, senderId: true } },
      },
    });
    publishToConversation(conversation.id, "message", msg);

    // به روز رسانی زمان گفتگو
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });

    // نوتیفیکیشن برای صاحب استوری
    await notifyUser(story.userId, "STORY_REPLY", "پاسخ جدید به استوری شما", `${sanitizeString(parsed.data.content, 500).slice(0, 50)}...`, {
      data: JSON.stringify({ storyId, replyId: reply.id, senderId: user.id, conversationId: conversation.id }),
      url: `/dashboard/chat/${conversation.id}`,
    }).catch(() => {});

    return NextResponse.json({ ok: true, reply, conversationId: conversation.id });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[story reply] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
