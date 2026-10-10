// موتور گفتگوی چندمرحله‌ای — ادامه گفتگو با کاربرانی که به ربات جواب داده‌اند
import { prisma } from "@/lib/prisma";
import { getAllSettings } from "@/lib/settings";
import { publishToConversation } from "@/lib/chatEvents";
import { replaceVariables } from "@/lib/botTemplates";
import { detectReplyCategory, pickReply } from "@/lib/botReplies";
import { isWithinActiveHours, isWithinActiveWeekdays, randomDelay, getHourlySentCount, logBotAction } from "@/lib/botHelpers";

const MAX_CONVERSATION_STEPS = 5;

export async function runConversationBotCycle(): Promise<{ sent: number; skipped: number }> {
  const settings = await getAllSettings();

  if (!settings.botAutoReplyEnabled) return { sent: 0, skipped: 0 };
  if (!isWithinActiveHours(settings.botActiveHoursStart, settings.botActiveHoursEnd)) return { sent: 0, skipped: 0 };
  if (!isWithinActiveWeekdays(settings.botActiveWeekdays)) return { sent: 0, skipped: 0 };

  const hourlyCount = await getHourlySentCount("CONVERSATION");
  if (hourlyCount >= settings.botAutoReplyMaxPerHour) return { sent: 0, skipped: 0 };

  // پیدا کردن گفتگوهای فعال که کاربر آخرین پیام را داده
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // آخرین پیام در هر گفتگو که فیک شروع کرده
  const conversations = await prisma.conversation.findMany({
    where: {
      updatedAt: { gte: oneDayAgo },
      OR: [
        { userA: { isFake: true } },
        { userB: { isFake: true } },
      ],
    },
    select: {
      id: true,
      userAId: true,
      userBId: true,
      updatedAt: true,
    },
    take: 30,
    orderBy: { updatedAt: "desc" },
  });

  let sent = 0;
  let skipped = 0;

  for (const conv of conversations) {
    // آخرین پیام در این گفتگو
    const lastMsg = await prisma.message.findFirst({
      where: { conversationId: conv.id },
      orderBy: { createdAt: "desc" },
      select: { id: true, senderId: true, content: true, createdAt: true },
    });

    if (!lastMsg) continue;

    // شناسایی فیک و واقعی
    const fakeId = await isFakeUser(conv.userAId) ? conv.userAId : conv.userBId;
    const realId = fakeId === conv.userAId ? conv.userBId : conv.userAId;

    // اگر آخرین پیام از فیک است، یعنی نوبت کاربر است — skip
    if (lastMsg.senderId === fakeId) {
      skipped++;
      continue;
    }

    // شمارش تبادل پیام در این گفتگو
    const msgCount = await prisma.message.count({
      where: { conversationId: conv.id },
    });

    // اگر بیش از حد مجاز تبادل داشته، پایان گفتگو
    if (msgCount >= MAX_CONVERSATION_STEPS * 2) {
      // ارسال پیام خداحافظی اگر هنوز نفرستاده
      const closingSent = await prisma.botLog.findFirst({
        where: {
          botType: "CONVERSATION",
          targetId: realId,
          detail: "closing",
        },
      });
      if (!closingSent) {
        const closingReply = pickReply("CLOSING");
        if (closingReply) {
          const ok = await sendConversationMessage(conv.id, fakeId, closingReply.text);
          if (ok) {
            sent++;
            await logBotAction({
              botType: "CONVERSATION",
              senderId: fakeId,
              targetId: realId,
              status: "SENT",
              detail: "closing",
              conversationStep: Math.floor(msgCount / 2),
            });
          }
        }
      }
      skipped++;
      continue;
    }

    // بررسی اینکه آیا فیک قبلاً به این پیام جواب داده
    const existingReply = await prisma.message.findFirst({
      where: {
        conversationId: conv.id,
        senderId: fakeId,
        createdAt: { gt: lastMsg.createdAt },
      },
    });
    if (existingReply) {
      skipped++;
      continue;
    }

    // بررسی تاخیر — حداقل delaySeconds از آخرین پیام کاربر
    const delayMs = settings.botAutoReplyDelaySeconds * 1000;
    if (Date.now() - lastMsg.createdAt.getTime() < delayMs) {
      skipped++;
      continue;
    }

    // تشخیص دسته پاسخ
    const category = detectReplyCategory(lastMsg.content || "");
    const reply = pickReply(category);
    if (!reply) {
      skipped++;
      continue;
    }

    // جایگزینی متغیرها
    const realUser = await prisma.user.findUnique({
      where: { id: realId },
      select: { firstName: true, city: true, age: true, job: true },
    });
    const finalText = replaceVariables(reply.text, {
      firstName: realUser?.firstName ?? "",
      city: realUser?.city ?? undefined,
      age: realUser?.age ?? undefined,
      job: realUser?.job ?? undefined,
    });

    const ok = await sendConversationMessage(conv.id, fakeId, finalText);
    if (ok) {
      sent++;
      const step = Math.floor(msgCount / 2) + 1;
      await logBotAction({
        botType: "CONVERSATION",
        senderId: fakeId,
        targetId: realId,
        status: "SENT",
        detail: `step-${step}`,
        conversationStep: step,
      });
      console.log(`[bot-conversation] ${fakeId} replied to ${realId} (step ${step}): ${finalText.substring(0, 30)}...`);
    } else {
      skipped++;
    }

    await randomDelay(settings.botDelayMinMs, settings.botDelayMaxMs);
  }

  console.log(`[bot-conversation] Cycle: ${sent} sent, ${skipped} skipped`);
  return { sent, skipped };
}

// بررسی اینکه آیا کاربر فیک است
async function isFakeUser(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isFake: true },
  });
  return user?.isFake ?? false;
}

// ارسال پیام در گفتگو
async function sendConversationMessage(conversationId: string, senderId: string, text: string): Promise<boolean> {
  try {
    const msg = await prisma.message.create({
      data: {
        conversationId,
        senderId,
        content: text,
        type: "TEXT",
        isRead: false,
      },
      include: {
        replyTo: { select: { id: true, content: true, type: true, senderId: true } },
      },
    });
    publishToConversation(conversationId, "message", msg);
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });
    return true;
  } catch (err) {
    console.error("[bot-conversation] sendConversationMessage error:", err);
    return false;
  }
}
