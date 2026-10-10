// توابع مشترک ربات‌ها — ساعت فعال، روز فعال، تاخیر تصادفی، محدودیت ساعتی
import { prisma } from "@/lib/prisma";
import { getAllSettings } from "@/lib/settings";

// شخصیت‌سازی پیام بر اساس تنظیمات
export type BotPersonality = "friendly" | "flirty" | "formal" | "playful" | "mysterious";

export function applyPersonality(text: string, personality: string): string {
  switch (personality) {
    case "formal":
      return text.replace(/سلام عزیزم/g, "سلام، خوشوقت شدیم").replace(/عزیزم/g, "دوست عزیز");
    case "flirty":
      return text.replace(/سلام/g, "سلام، خوشگل").replace(/چطوری/g, "حالت خوبه عزیزم؟");
    case "playful":
      return text.replace(/سلام/g, "هی، سلام").replace(/خوبی/g, "چطوری، چی می‌شه");
    case "mysterious":
      return text.replace(/سلام/g, "سلام، نمی‌دونم چی بگم ولی").replace(/چطوری/g, "فکر می‌کنم خوبی");
    default:
      return text;
  }
}

// شبیه‌سازی typing indicator قبل از ارسال پیام
export async function simulateTyping(delaySeconds: number): Promise<void> {
  if (delaySeconds <= 0) return;
  const jitter = Math.random() * 0.5;
  await new Promise((resolve) => setTimeout(resolve, (delaySeconds + jitter) * 1000));
}

// read receipt خودکار — خواندن پیام‌های کاربر در گفتگوهای فیک
export async function autoReadUserMessages(fakeUserId: string): Promise<number> {
  const settings = await getAllSettings();
  if (!settings.botAutoRead) return 0;

  // پیدا کردن گفتگوهای فیک
  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [{ userAId: fakeUserId }, { userBId: fakeUserId }],
    },
    select: { id: true },
  });

  let read = 0;
  for (const conv of conversations) {
    const unread = await prisma.message.updateMany({
      where: {
        conversationId: conv.id,
        senderId: { not: fakeUserId },
        isRead: false,
      },
      data: { isRead: true },
    });
    read += unread.count;
  }
  return read;
}

// بررسی اینکه آیا ساعت فعلی در بازه مجاز است
export function isWithinActiveHours(start: number, end: number): boolean {
  const hour = new Date().getHours();
  if (start <= end) {
    return hour >= start && hour < end;
  }
  return hour >= start || hour < end;
}

// بررسی روزهای هفته فعال
export function isWithinActiveWeekdays(weekdays: string): boolean {
  if (weekdays === "everyday" || !weekdays) return true;
  const days = weekdays.split(",").map((d) => d.trim().toLowerCase());
  const jsDay = new Date().getDay();
  const dayMap: Record<number, string> = {
    0: "sun", 1: "mon", 2: "tue", 3: "wed", 4: "thu", 5: "fri", 6: "sat",
  };
  return days.includes(dayMap[jsDay] ?? "everyday");
}

// تاخیر تصادفی بین min و max میلی‌ثانیه
export function randomDelay(minMs: number, maxMs: number): Promise<void> {
  const delay = minMs + Math.random() * (maxMs - minMs);
  return new Promise((resolve) => setTimeout(resolve, delay));
}

// شمارش پیام‌های ارسالی در ساعت جاری از دیتابیس
export async function getHourlySentCount(botType: string): Promise<number> {
  const hourStart = new Date(Math.floor(Date.now() / (60 * 60 * 1000)) * (60 * 60 * 1000));
  return prisma.botLog.count({
    where: {
      botType,
      status: "SENT",
      createdAt: { gte: hourStart },
    },
  });
}

// آخرین زمان ارسال ربات به یک کاربر از دیتابیس
export async function getLastSentToUser(targetId: string, botType: string): Promise<Date | null> {
  const lastLog = await prisma.botLog.findFirst({
    where: {
      targetId,
      botType,
      status: "SENT",
    },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  return lastLog?.createdAt ?? null;
}

// بررسی cooldown از دیتابیس
export async function isUserInCooldown(targetId: string, botType: string, cooldownHours: number): Promise<boolean> {
  if (cooldownHours <= 0) return false;
  const lastSent = await getLastSentToUser(targetId, botType);
  if (!lastSent) return false;
  const cooldownMs = cooldownHours * 60 * 60 * 1000;
  return Date.now() - lastSent.getTime() < cooldownMs;
}

// بررسی cooldown بین انواع مختلف ربات برای یک کاربر
export async function isUserInGlobalCooldown(targetId: string, cooldownMinutes: number): Promise<boolean> {
  if (cooldownMinutes <= 0) return false;
  const since = new Date(Date.now() - cooldownMinutes * 60 * 1000);
  const recent = await prisma.botLog.findFirst({
    where: {
      targetId,
      status: "SENT",
      createdAt: { gte: since },
    },
    select: { id: true },
  });
  return !!recent;
}

// بررسی ساعت و روز فعال از تنظیمات
export async function isBotActiveTime(): Promise<boolean> {
  const s = await getAllSettings();
  if (!isWithinActiveHours(s.botActiveHoursStart, s.botActiveHoursEnd)) return false;
  if (!isWithinActiveWeekdays(s.botActiveWeekdays)) return false;
  return true;
}

// ثبت در BotLog
export async function logBotAction(params: {
  botType: string;
  senderId?: string;
  targetId?: string;
  templateId?: string;
  category?: string;
  status: string;
  detail?: string;
  conversationStep?: number;
}) {
  try {
    await prisma.botLog.create({ data: params });
  } catch (err) {
    console.error("[botHelpers] logBotAction error:", err);
  }
}

// بررسی اینکه آیا کاربر به پیام ربات جواب داده
export async function hasUserAnswered(targetId: string): Promise<boolean> {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const botMessages = await prisma.message.findMany({
    where: {
      sender: { isFake: true },
      conversation: { OR: [{ userAId: targetId }, { userBId: targetId }] },
      createdAt: { gte: oneWeekAgo },
    },
    select: { conversationId: true, createdAt: true },
    take: 1,
    orderBy: { createdAt: "desc" },
  });
  if (botMessages.length === 0) return false;
  const lastBotMsg = botMessages[0];
  const reply = await prisma.message.findFirst({
    where: {
      conversationId: lastBotMsg.conversationId,
      senderId: targetId,
      createdAt: { gt: lastBotMsg.createdAt },
    },
  });
  return !!reply;
}

// محاسبه امتیاز تعامل کاربر — برای اولویت در ارسال
export async function computeEngagementScore(targetId: string): Promise<number> {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [messagesReceived, messagesAnswered, likesReceived, giftsReceived, profileViews] = await Promise.all([
    prisma.botLog.count({ where: { botType: "MESSAGE", targetId, status: { in: ["SENT", "ANSWERED"] }, createdAt: { gte: oneWeekAgo } } }),
    prisma.botLog.count({ where: { botType: "MESSAGE", targetId, status: "ANSWERED", createdAt: { gte: oneWeekAgo } } }),
    prisma.botLog.count({ where: { botType: "LIKE", targetId, status: "SENT", createdAt: { gte: oneWeekAgo } } }),
    prisma.botLog.count({ where: { botType: "GIFT", targetId, status: "SENT", createdAt: { gte: oneWeekAgo } } }),
    prisma.botLog.count({ where: { botType: "PROFILE_VIEW", targetId, status: "SENT", createdAt: { gte: oneWeekAgo } } }),
  ]);

  // فرمول: پاسخ‌ها وزن بیشتر دارند
  const score = (messagesAnswered * 10) + (messagesReceived * 2) + (likesReceived * 3) + (giftsReceived * 5) + (profileViews * 1);

  // کاهش تدریجی — اگر کاربر در ۷ روز گذشته جواب نداده، امتیاز کمتر
  if (messagesReceived > 0 && messagesAnswered === 0) {
    return Math.floor(score * 0.3);
  }

  return score;
}

// پاک‌سازی خودکار لاگ‌های قدیمی
export async function cleanupOldBotLogs(): Promise<number> {
  const settings = await getAllSettings();
  const retentionDays = settings.botLogRetentionDays || 90;
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
  try {
    const result = await prisma.botLog.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });
    if (result.count > 0) {
      console.log(`[botHelpers] Cleaned up ${result.count} old bot logs (older than ${retentionDays} days)`);
    }
    return result.count;
  } catch (err) {
    console.error("[botHelpers] cleanupOldBotLogs error:", err);
    return 0;
  }
}

// علامت‌گذاری پیام ربات به عنوان ANSWERED و به‌روزرسانی answerCount قالب
export async function checkAndMarkAnswered(): Promise<number> {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const sentLogs = await prisma.botLog.findMany({
    where: {
      botType: "MESSAGE",
      status: "SENT",
      createdAt: { gte: oneWeekAgo },
      targetId: { not: null },
    },
    select: { id: true, targetId: true, templateId: true, createdAt: true },
    take: 100,
    orderBy: { createdAt: "desc" },
  });

  let marked = 0;
  for (const log of sentLogs) {
    if (!log.targetId) continue;
    const reply = await prisma.message.findFirst({
      where: {
        senderId: log.targetId,
        createdAt: { gt: log.createdAt },
        sender: { isFake: false },
      },
      include: { conversation: true },
    });
    if (reply) {
      await prisma.botLog.update({ where: { id: log.id }, data: { status: "ANSWERED" } });
      if (log.templateId && log.templateId.length > 10) {
        try {
          await prisma.botTemplate.update({
            where: { id: log.templateId },
            data: { answerCount: { increment: 1 } },
          });
        } catch { /* قالب static است */ }
      }
      marked++;
    }
  }
  return marked;
}
