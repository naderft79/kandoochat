// ربات پاسخ خودکار — پاسخ خودکار فیک به کاربرانی که به پیام ربات جواب داده‌اند
import { prisma } from "@/lib/prisma";
import { getAllSettings } from "@/lib/settings";
import { publishToConversation } from "@/lib/chatEvents";
import { pickTemplateAsync, replaceVariables, BotTemplateCategory } from "@/lib/botTemplates";
import { isWithinActiveHours, isWithinActiveWeekdays, randomDelay, getHourlySentCount } from "@/lib/botHelpers";

// شمارش پاسخ به هر کاربر — از دیتابیس محاسبه می شود

export async function runAutoReplyBotCycle(): Promise<{ sent: number; skipped: number }> {
  const settings = await getAllSettings();

  if (!settings.botAutoReplyEnabled) return { sent: 0, skipped: 0 };
  if (!isWithinActiveHours(settings.botActiveHoursStart, settings.botActiveHoursEnd)) return { sent: 0, skipped: 0 };
  if (!isWithinActiveWeekdays(settings.botActiveWeekdays)) return { sent: 0, skipped: 0 };

  const hourlyCount = await getHourlySentCount("AUTO_REPLY");
  if (hourlyCount >= settings.botAutoReplyMaxPerHour) return { sent: 0, skipped: 0 };

  const delayMs = settings.botAutoReplyDelaySeconds * 1000;
  const maxPerUser = settings.botAutoReplyMaxPerUser;

  // پیدا کردن گفتگوهایی که فیک پیام داده، کاربر جواب داده، ولی فیک جواب نداده
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // پیام‌های فیک در هفته گذشته
  const botMessages = await prisma.message.findMany({
    where: {
      sender: { isFake: true },
      createdAt: { gte: oneWeekAgo },
    },
    select: {
      id: true,
      conversationId: true,
      senderId: true,
      createdAt: true,
      conversation: {
        select: {
          id: true,
          userAId: true,
          userBId: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  let sent = 0;
  let skipped = 0;

  for (const botMsg of botMessages) {
    // شناسایی کاربر هدف
    const targetId = botMsg.conversation.userAId === botMsg.senderId
      ? botMsg.conversation.userBId
      : botMsg.conversation.userAId;

    // بررسی محدودیت max per user — از دیتابیس
    const replyCount = await prisma.botLog.count({
      where: { botType: "AUTO_REPLY", targetId, status: "SENT" },
    });
    if (replyCount >= maxPerUser) {
      continue;
    }

    // بررسی آیا کاربر جواب داده
    const userReply = await prisma.message.findFirst({
      where: {
        conversationId: botMsg.conversationId,
        senderId: targetId,
        createdAt: { gt: botMsg.createdAt },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!userReply) continue;

    // بررسی آیا فیک بعد از جواب کاربر، پیامی فرستاده
    const botReply = await prisma.message.findFirst({
      where: {
        conversationId: botMsg.conversationId,
        senderId: botMsg.senderId,
        createdAt: { gt: userReply.createdAt },
      },
    });

    if (botReply) continue; // فیک قبلا جواب داده

    // بررسی تاخیر
    const timeSinceUserReply = Date.now() - userReply.createdAt.getTime();
    if (timeSinceUserReply < delayMs) continue;

    // انتخاب قالب پاسخ
    const template = await pickTemplateAsync(
      "CASUAL" as BotTemplateCategory,
      "FEMALE",
      "MALE",
      settings.botUseDynamicTemplates
    );
    if (!template) {
      skipped++;
      continue;
    }

    // دریافت اطلاعات کاربر
    const target = await prisma.user.findUnique({
      where: { id: targetId },
      select: { id: true, firstName: true, city: true, age: true, job: true },
    });
    if (!target) {
      skipped++;
      continue;
    }

    const finalText = replaceVariables(template.text, {
      firstName: target.firstName,
      city: target.city ?? undefined,
      age: target.age,
      job: target.job,
    });

    try {
      const msg = await prisma.message.create({
        data: {
          conversationId: botMsg.conversationId,
          senderId: botMsg.senderId,
          content: finalText,
          type: "TEXT",
          isRead: false,
        },
        include: {
          replyTo: { select: { id: true, content: true, type: true, senderId: true } },
        },
      });
      publishToConversation(botMsg.conversationId, "message", msg);
      await prisma.conversation.update({
        where: { id: botMsg.conversationId },
        data: { updatedAt: new Date() },
      });

      sent++;
      await prisma.botLog.create({
        data: {
          botType: "AUTO_REPLY",
          senderId: botMsg.senderId,
          targetId: target.id,
          templateId: template.id,
          category: template.category,
          status: "SENT",
        },
      });
      console.log(`[bot-auto-reply] ${botMsg.senderId} replied to ${target.id}: ${finalText.substring(0, 30)}...`);
    } catch (err) {
      console.error("[bot-auto-reply] error:", err);
      skipped++;
    }

    await randomDelay(settings.botDelayMinMs, settings.botDelayMaxMs);
  }

  console.log(`[bot-auto-reply] Cycle: ${sent} sent, ${skipped} skipped`);
  return { sent, skipped };
}
