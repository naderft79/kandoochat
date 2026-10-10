// سیستم ربات تشویقی — منطق ارسال پیام از کاربران فیک به کاربران واقعی
// شروط پیشرفته: جنسیت، سن، شهر، وضعیت اشتراک، فعالیت، تعداد پیام، زمان
// بهبود: فیلتر عکس، آنلاین، قد، درآمد، لیست سیاه/سفید، follow-up، dry-run، BotLog

import { prisma } from "@/lib/prisma";
import { getAllSettings } from "@/lib/settings";
import { publishToConversation } from "@/lib/chatEvents";
import { pickTemplateAsync, replaceVariables, BotTemplateCategory } from "@/lib/botTemplates";
import {
  isWithinActiveHours,
  isWithinActiveWeekdays,
  randomDelay,
  getHourlySentCount,
  getLastSentToUser,
  logBotAction,
  hasUserAnswered,
  checkAndMarkAnswered,
  applyPersonality,
  simulateTyping,
} from "@/lib/botHelpers";

// نوع شرایط ارسال ربات
export type BotConditions = {
  // چه کاربرانی هدف هستند
  targetNewUsers: boolean;
  targetOldUsers: boolean;
  targetInactive: boolean;
  targetNoPhoto: boolean;
  targetNoBio: boolean;
  targetNoSubscription: boolean;
  targetWithSubscription: boolean;
  targetSpecificGender: string;
  targetMinAge: number;
  targetMaxAge: number;
  targetSpecificCity: string;
  targetMinConversations: number;
  targetMaxConversations: number;
  // هدف‌گیری پیشرفته
  targetOnlineOnly: boolean;
  targetRecentlyOnlineHours: number;
  targetMinPhotos: number;
  targetMaxPhotos: number;
  targetVerifiedOnly: boolean;
  targetMinHeight: number;
  targetMaxHeight: number;
  targetIncomeMin: number;
  targetHasJob: boolean;
  targetReferralOnly: boolean;
  useWhitelist: boolean;
  // چه زمانی ارسال شود
  sendIntervalMinutes: number;
  messagesPerRun: number;
  activeWeekdays: string;
  // از چه کاربرانی ارسال شود
  senderGender: string;
  senderMinAge: number;
  senderMaxAge: number;
  senderMatchCity: boolean;
  senderVerifiedOnly: boolean;
  senderHasPhoto: boolean;
  // کدام دسته قالب
  templateCategory: BotTemplateCategory | "RANDOM";
  // ساعت مجاز ارسال
  activeHoursStart: number;
  activeHoursEnd: number;
  // جلوگیری از ارسال مکرر
  cooldownHours: number;
  // بهبود ها
  maxPerHour: number;
  followupEnabled: boolean;
  followupHours: number;
  followupMax: number;
  skipAnswered: boolean;
  dryRun: boolean;
  useDynamicTemplates: boolean;
};

// شرایط پیش فرض
export const DEFAULT_BOT_CONDITIONS: BotConditions = {
  targetNewUsers: true,
  targetOldUsers: true,
  targetInactive: true,
  targetNoPhoto: false,
  targetNoBio: false,
  targetNoSubscription: true,
  targetWithSubscription: false,
  targetSpecificGender: "ALL",
  targetMinAge: 18,
  targetMaxAge: 99,
  targetSpecificCity: "",
  targetMinConversations: 0,
  targetMaxConversations: 0,
  targetOnlineOnly: false,
  targetRecentlyOnlineHours: 0,
  targetMinPhotos: 0,
  targetMaxPhotos: 0,
  targetVerifiedOnly: false,
  targetMinHeight: 0,
  targetMaxHeight: 0,
  targetIncomeMin: 0,
  targetHasJob: false,
  targetReferralOnly: false,
  useWhitelist: false,
  sendIntervalMinutes: 30,
  messagesPerRun: 5,
  activeWeekdays: "everyday",
  senderGender: "ANY",
  senderMinAge: 18,
  senderMaxAge: 99,
  senderMatchCity: false,
  senderVerifiedOnly: false,
  senderHasPhoto: true,
  templateCategory: "RANDOM",
  activeHoursStart: 8,
  activeHoursEnd: 23,
  cooldownHours: 24,
  maxPerHour: 20,
  followupEnabled: false,
  followupHours: 4,
  followupMax: 2,
  skipAnswered: true,
  dryRun: false,
  useDynamicTemplates: true,
};

// انتخاب کاربر هدف بر اساس شرایط
async function selectTargetUsers(conditions: BotConditions, limit: number) {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

  const where: Record<string, unknown> = {
    role: "USER",
    isActive: true,
    isFake: false,
  };

  // فیلتر جنسیت
  if (conditions.targetSpecificGender !== "ALL") {
    where.gender = conditions.targetSpecificGender;
  }

  // فیلتر سن
  where.age = { gte: conditions.targetMinAge, lte: conditions.targetMaxAge };

  // فیلتر شهر
  if (conditions.targetSpecificCity) {
    where.city = conditions.targetSpecificCity;
  }

  // فیلتر عکس پروفایل
  if (conditions.targetNoPhoto) {
    where.photos = { none: { isProfile: true } };
  }

  // فیلتر بیو
  if (conditions.targetNoBio) {
    where.OR = [{ bio: null }, { bio: "" }];
  }

  // فیلتر اشتراک
  if (conditions.targetNoSubscription && !conditions.targetWithSubscription) {
    where.subscriptions = { none: { endsAt: { gt: now } } };
  } else if (conditions.targetWithSubscription && !conditions.targetNoSubscription) {
    where.subscriptions = { some: { endsAt: { gt: now } } };
  }

  // فیلتر کاربران جدید/قدیمی
  if (conditions.targetNewUsers && !conditions.targetOldUsers) {
    where.createdAt = { gte: sevenDaysAgo };
  } else if (conditions.targetOldUsers && !conditions.targetNewUsers) {
    where.createdAt = { lt: sevenDaysAgo };
  }

  // فیلتر کاربران غیرفعال
  if (conditions.targetInactive) {
    where.lastSeen = { lt: threeDaysAgo };
  }

  // فیلتر فقط آنلاین
  if (conditions.targetOnlineOnly) {
    where.isOnline = true;
  }

  // فیلتر اخیراً آنلاین
  if (conditions.targetRecentlyOnlineHours > 0) {
    const recentAgo = new Date(now.getTime() - conditions.targetRecentlyOnlineHours * 60 * 60 * 1000);
    where.lastSeen = { gte: recentAgo };
  }

  // فیلتر تایید شده
  if (conditions.targetVerifiedOnly) {
    where.isVerified = true;
  }

  // فیلتر قد
  if (conditions.targetMinHeight > 0 || conditions.targetMaxHeight > 0) {
    const heightFilter: Record<string, number> = {};
    if (conditions.targetMinHeight > 0) heightFilter.gte = conditions.targetMinHeight;
    if (conditions.targetMaxHeight > 0) heightFilter.lte = conditions.targetMaxHeight;
    where.height = heightFilter;
  }

  // فیلتر درآمد
  if (conditions.targetIncomeMin > 0) {
    where.income = { gte: conditions.targetIncomeMin };
  }

  // فیلتر شغل
  if (conditions.targetHasJob) {
    where.NOT = [{ job: null }, { job: "" }];
  }

  // فیلتر رفرالی
  if (conditions.targetReferralOnly) {
    where.receivedReferral = { isNot: null };
  }

  // لیست سیاه
  const excluded = await prisma.botExclude.findMany({ select: { userId: true } });
  if (excluded.length > 0) {
    where.id = { notIn: excluded.map((e) => e.userId) };
  }

  // لیست سفید
  if (conditions.useWhitelist) {
    const whitelisted = await prisma.botWhitelist.findMany({ select: { userId: true } });
    if (whitelisted.length > 0) {
      where.id = { in: whitelisted.map((w) => w.userId) };
    }
  }

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      gender: true,
      age: true,
      city: true,
      firstName: true,
      job: true,
      createdAt: true,
      lastSeen: true,
      photos: { select: { id: true }, where: { isProfile: true, isDeletedByUser: false } },
    },
    take: limit * 3,
    orderBy: { lastSeen: "asc" },
  });

  // فیلتر تعداد عکس در حافظه
  let eligible = users;
  if (conditions.targetMinPhotos > 0 || conditions.targetMaxPhotos > 0) {
    eligible = users.filter((u) => {
      const count = u.photos.length;
      if (conditions.targetMinPhotos > 0 && count < conditions.targetMinPhotos) return false;
      if (conditions.targetMaxPhotos > 0 && count > conditions.targetMaxPhotos) return false;
      return true;
    });
  }

  // فیلتر cooldown از دیتابیس
  const cooldownMs = conditions.cooldownHours * 60 * 60 * 1000;
  const checkedCooldown: typeof eligible = [];
  for (const u of eligible) {
    const lastSent = await getLastSentToUser(u.id, "MESSAGE");
    if (lastSent && Date.now() - lastSent.getTime() < cooldownMs) continue;
    checkedCooldown.push(u);
  }
  eligible = checkedCooldown;

  // فیلتر skipAnswered
  if (conditions.skipAnswered) {
    const checked: typeof eligible = [];
    for (const u of eligible) {
      const answered = await hasUserAnswered(u.id);
      if (!answered) checked.push(u);
    }
    eligible = checked;
  }

  return eligible.slice(0, limit);
}

// انتخاب کاربر فیک مناسب برای ارسال
async function selectFakeSender(targetGender: string, conditions: BotConditions, targetCity?: string) {
  const where: Record<string, unknown> = {
    isFake: true,
    isActive: true,
    role: "USER",
  };

  // جنسیت ارسال کننده
  if (conditions.senderGender !== "ANY") {
    where.gender = conditions.senderGender;
  } else {
    if (targetGender === "MALE") {
      where.gender = "FEMALE";
    } else if (targetGender === "FEMALE") {
      where.gender = "MALE";
    }
  }

  // فیلتر سن
  where.age = { gte: conditions.senderMinAge, lte: conditions.senderMaxAge };

  // فقط فیک‌های تایید شده
  if (conditions.senderVerifiedOnly) {
    where.isVerified = true;
  }

  // تطبیق شهر
  if (conditions.senderMatchCity && targetCity) {
    where.city = targetCity;
  }

  const senders = await prisma.user.findMany({
    where,
    select: {
      id: true,
      gender: true,
      firstName: true,
      username: true,
      city: true,
      photos: { select: { url: true }, where: { isProfile: true, isDeletedByUser: false, isVerified: true, isRejected: false }, take: 1 },
    },
    take: 10,
  });

  // فیلتر فقط عکس‌دار
  let filtered = senders;
  if (conditions.senderHasPhoto) {
    filtered = senders.filter((s) => s.photos.length > 0);
  }

  if (filtered.length === 0) return null;
  return filtered[Math.floor(Math.random() * filtered.length)];
}

// ایجاد یا پیدا کردن گفتگو بین دو کاربر
async function getOrCreateConversation(userAId: string, userBId: string) {
  // ترتیب ای دی ها برای جلوگیری از تکرار
  const [aId, bId] = userAId < userBId ? [userAId, userBId] : [userBId, userAId];

  const existing = await prisma.conversation.findFirst({
    where: {
      OR: [
        { userAId: aId, userBId: bId },
        { userAId: bId, userBId: aId },
      ],
    },
  });

  if (existing) return existing;

  return await prisma.conversation.create({
    data: {
      userAId: aId,
      userBId: bId,
      startedBy: aId,
    },
  });
}

// ارسال یک پیام ربات
async function sendBotMessage(
  senderId: string,
  receiverId: string,
  text: string
): Promise<boolean> {
  try {
    const conversation = await getOrCreateConversation(senderId, receiverId);
    const msg = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId,
        content: text,
        type: "TEXT",
        isRead: false,
      },
      include: {
        replyTo: { select: { id: true, content: true, type: true, senderId: true } },
      },
    });
    publishToConversation(conversation.id, "message", msg);
    // به روز رسانی updatedAt گفتگو
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });
    return true;
  } catch (err) {
    console.error("[bot] sendBotMessage error:", err);
    return false;
  }
}

// اجرای یک دور ربات — انتخاب هدف و ارسال پیام
export async function runBotCycle(): Promise<{ sent: number; skipped: number }> {
  const settings = await getAllSettings();

  // بررسی فعال بودن ربات
  if (!settings.botEnabled) {
    return { sent: 0, skipped: 0 };
  }

  // بررسی ساعت مجاز
  if (!isWithinActiveHours(settings.botActiveHoursStart, settings.botActiveHoursEnd)) {
    return { sent: 0, skipped: 0 };
  }

  // بررسی روزهای فعال
  if (!isWithinActiveWeekdays(settings.botActiveWeekdays)) {
    return { sent: 0, skipped: 0 };
  }

  // بررسی محدودیت ساعتی
  const hourlyCount = await getHourlySentCount("MESSAGE");
  if (hourlyCount >= settings.botMaxPerHour) {
    console.log("[bot] Hourly limit reached, skipping");
    return { sent: 0, skipped: 0 };
  }

  // ساخت شرایط از تنظیمات
  const conditions: BotConditions = {
    targetNewUsers: settings.botTargetNewUsers,
    targetOldUsers: settings.botTargetOldUsers,
    targetInactive: settings.botTargetInactive,
    targetNoPhoto: settings.botTargetNoPhoto,
    targetNoBio: settings.botTargetNoBio,
    targetNoSubscription: settings.botTargetNoSubscription,
    targetWithSubscription: settings.botTargetWithSubscription,
    targetSpecificGender: settings.botTargetGender,
    targetMinAge: settings.botTargetMinAge,
    targetMaxAge: settings.botTargetMaxAge,
    targetSpecificCity: settings.botTargetCity,
    targetMinConversations: settings.botTargetMinConversations,
    targetMaxConversations: settings.botTargetMaxConversations,
    targetOnlineOnly: settings.botTargetOnlineOnly,
    targetRecentlyOnlineHours: settings.botTargetRecentlyOnlineHours,
    targetMinPhotos: settings.botTargetMinPhotos,
    targetMaxPhotos: settings.botTargetMaxPhotos,
    targetVerifiedOnly: settings.botTargetVerifiedOnly,
    targetMinHeight: settings.botTargetMinHeight,
    targetMaxHeight: settings.botTargetMaxHeight,
    targetIncomeMin: settings.botTargetIncomeMin,
    targetHasJob: settings.botTargetHasJob,
    targetReferralOnly: settings.botTargetReferralOnly,
    useWhitelist: settings.botUseWhitelist,
    sendIntervalMinutes: settings.botIntervalMinutes,
    messagesPerRun: settings.botMessagesPerRun,
    activeWeekdays: settings.botActiveWeekdays,
    senderGender: settings.botSenderGender,
    senderMinAge: settings.botSenderMinAge,
    senderMaxAge: settings.botSenderMaxAge,
    senderMatchCity: settings.botSenderMatchCity,
    senderVerifiedOnly: settings.botSenderVerifiedOnly,
    senderHasPhoto: settings.botSenderHasPhoto,
    templateCategory: settings.botTemplateCategory as BotTemplateCategory | "RANDOM",
    activeHoursStart: settings.botActiveHoursStart,
    activeHoursEnd: settings.botActiveHoursEnd,
    cooldownHours: settings.botCooldownHours,
    maxPerHour: settings.botMaxPerHour,
    followupEnabled: settings.botFollowupEnabled,
    followupHours: settings.botFollowupHours,
    followupMax: settings.botFollowupMax,
    skipAnswered: settings.botSkipAnswered,
    dryRun: settings.botDryRun,
    useDynamicTemplates: settings.botUseDynamicTemplates,
  };

  // انتخاب کاربران هدف
  const targets = await selectTargetUsers(conditions, conditions.messagesPerRun);
  if (targets.length === 0) {
    return { sent: 0, skipped: 0 };
  }

  let sent = 0;
  let skipped = 0;

  for (const target of targets) {
    // انتخاب ارسال کننده فیک
    const sender = await selectFakeSender(target.gender, conditions, target.city);
    if (!sender) {
      skipped++;
      await logBotAction({ botType: "MESSAGE", targetId: target.id, status: "SKIPPED", detail: "no sender" });
      continue;
    }

    // انتخاب قالب پیام
    const category = conditions.templateCategory === "RANDOM"
      ? pickRandomCategory()
      : conditions.templateCategory;

    const template = await pickTemplateAsync(
      category, sender.gender, target.gender, conditions.useDynamicTemplates
    );
    if (!template) {
      skipped++;
      await logBotAction({ botType: "MESSAGE", senderId: sender.id, targetId: target.id, status: "SKIPPED", detail: "no template" });
      continue;
    }

    // جایگزینی متغیرهای پویا
    let finalText = replaceVariables(template.text, {
      firstName: target.firstName,
      city: target.city,
      age: target.age,
      job: target.job,
    });

    // اعمال شخصیت‌سازی
    finalText = applyPersonality(finalText, settings.botPersonality);

    // شبیه‌سازی typing قبل از ارسال
    if (!conditions.dryRun) {
      await simulateTyping(settings.botTypingDelaySeconds);
    }

    // ارسال پیام (یا شبیه‌سازی dry-run)
    if (conditions.dryRun) {
      console.log(`[bot][DRY-RUN] Would send from ${sender.id} to ${target.id}: ${finalText.substring(0, 40)}...`);
      sent++;
      await logBotAction({ botType: "MESSAGE", senderId: sender.id, targetId: target.id, templateId: template.id, category: template.category, status: "SENT", detail: "dry-run" });
    } else {
      const ok = await sendBotMessage(sender.id, target.id, finalText);
      if (ok) {
        sent++;
        // بروزرسانی sendCount قالب داینامیک
        if (conditions.useDynamicTemplates && template.id.length > 3) {
          try {
            await prisma.botTemplate.update({
              where: { id: template.id },
              data: { sendCount: { increment: 1 } },
            });
          } catch { /* قالب static است */ }
        }
        console.log(`[bot] Sent message from ${sender.id} to ${target.id}: ${finalText.substring(0, 30)}...`);
        await logBotAction({ botType: "MESSAGE", senderId: sender.id, targetId: target.id, templateId: template.id, category: template.category, status: "SENT" });
      } else {
        skipped++;
        await logBotAction({ botType: "MESSAGE", senderId: sender.id, targetId: target.id, status: "FAILED" });
      }
    }

    // تاخیر تصادفی بین ارسال ها
    await randomDelay(800, 2500);
  }

  // علامت‌گذاری پیام‌های جواب داده شده
  const answeredCount = await checkAndMarkAnswered();
  if (answeredCount > 0) {
    console.log(`[bot] Marked ${answeredCount} messages as ANSWERED`);
  }

  // اجرای follow-up اگر فعال باشد
  if (conditions.followupEnabled) {
    const followupResult = await runFollowupCycle(conditions);
    sent += followupResult.sent;
    skipped += followupResult.skipped;
  }

  console.log(`[bot] Cycle complete: ${sent} sent, ${skipped} skipped`);
  return { sent, skipped };
}

// اجرای follow-up — ارسال پیام دوم به کاربرانی که جواب نداده‌اند
async function runFollowupCycle(conditions: BotConditions): Promise<{ sent: number; skipped: number }> {
  const followupHoursAgo = new Date(Date.now() - conditions.followupHours * 60 * 60 * 1000);
  const followupMax = conditions.followupMax;

  // پیدا کردن پیام‌های ارسال شده در بازه followup که جواب نداده‌اند
  const sentLogs = await prisma.botLog.findMany({
    where: {
      botType: "MESSAGE",
      status: "SENT",
      createdAt: { lte: followupHoursAgo, gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      targetId: { not: null },
    },
    select: { id: true, targetId: true, senderId: true, templateId: true, category: true, createdAt: true },
    take: 50,
    orderBy: { createdAt: "desc" },
  });

  let sent = 0;
  let skipped = 0;

  for (const log of sentLogs) {
    if (!log.targetId || !log.senderId) continue;

    // بررسی تعداد follow-up های قبلی برای این کاربر
    const existingFollowups = await prisma.botLog.count({
      where: {
        botType: "MESSAGE",
        targetId: log.targetId,
        detail: { startsWith: "followup-" },
      },
    });
    if (existingFollowups >= followupMax) {
      skipped++;
      continue;
    }

    // بررسی اینکه آیا جواب داده
    const answered = await hasUserAnswered(log.targetId);
    if (answered) {
      skipped++;
      continue;
    }

    // بررسی اینکه followup قبلی برای این پیام انجام نشده
    const existingFollowupForLog = await prisma.botLog.findFirst({
      where: {
        botType: "MESSAGE",
        targetId: log.targetId,
        detail: { startsWith: "followup-" },
        createdAt: { gt: log.createdAt },
      },
    });
    if (existingFollowupForLog) {
      skipped++;
      continue;
    }

    // انتخاب قالب follow-up (WARM یا CASUAL)
    const followupCategory: BotTemplateCategory = Math.random() > 0.5 ? "WARM" : "CASUAL";
    const template = await pickTemplateAsync(
      followupCategory, "FEMALE", "MALE", conditions.useDynamicTemplates
    );
    if (!template) {
      skipped++;
      continue;
    }

    // دریافت اطلاعات کاربر
    const target = await prisma.user.findUnique({
      where: { id: log.targetId },
      select: { id: true, firstName: true, city: true, age: true, job: true, gender: true },
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

    if (conditions.dryRun) {
      console.log(`[bot][DRY-RUN] Followup to ${target.id}: ${finalText.substring(0, 40)}...`);
      sent++;
      await logBotAction({ botType: "MESSAGE", senderId: log.senderId, targetId: target.id, templateId: template.id, category: template.category, status: "SENT", detail: `followup-${existingFollowups + 1}` });
    } else {
      const ok = await sendBotMessage(log.senderId, target.id, finalText);
      if (ok) {
        sent++;
        if (conditions.useDynamicTemplates && template.id.length > 3) {
          try {
            await prisma.botTemplate.update({
              where: { id: template.id },
              data: { sendCount: { increment: 1 } },
            });
          } catch { /* قالب static است */ }
        }
        console.log(`[bot] Followup ${existingFollowups + 1} to ${target.id}: ${finalText.substring(0, 30)}...`);
        await logBotAction({ botType: "MESSAGE", senderId: log.senderId, targetId: target.id, templateId: template.id, category: template.category, status: "SENT", detail: `followup-${existingFollowups + 1}` });
      } else {
        skipped++;
        await logBotAction({ botType: "MESSAGE", senderId: log.senderId, targetId: target.id, status: "FAILED", detail: `followup-${existingFollowups + 1}-failed` });
      }
    }

    await randomDelay(1000, 3000);
  }

  console.log(`[bot] Followup cycle: ${sent} sent, ${skipped} skipped`);
  return { sent, skipped };
}

// انتخاب تصادفی دسته قالب
function pickRandomCategory(): BotTemplateCategory {
  const categories: BotTemplateCategory[] = [
    "CHAT_START", "FLIRTY", "CASUAL", "COMPLIMENT",
    "CURIOSITY", "PLAYFUL", "WARM",
  ];
  return categories[Math.floor(Math.random() * categories.length)];
}

// دریافت آمار ربات
export async function getBotStats() {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    fakeUsers,
    totalSent,
    sentToday,
    sent7Days,
    sent30Days,
    totalAnswered,
    dynamicTemplates,
    blacklistCount,
    whitelistCount,
    likeBotLogs,
    viewBotLogs,
    giftBotLogs,
    matchBotLogs,
    storyBotLogs,
    autoReplyLogs,
  ] = await Promise.all([
    prisma.user.count({ where: { isFake: true, isActive: true } }),
    prisma.botLog.count({ where: { botType: "MESSAGE", status: "SENT" } }),
    prisma.botLog.count({ where: { botType: "MESSAGE", status: "SENT", createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } } }),
    prisma.botLog.count({ where: { botType: "MESSAGE", status: "SENT", createdAt: { gte: sevenDaysAgo } } }),
    prisma.botLog.count({ where: { botType: "MESSAGE", status: "SENT", createdAt: { gte: thirtyDaysAgo } } }),
    prisma.botLog.count({ where: { botType: "MESSAGE", status: "ANSWERED" } }),
    prisma.botTemplate.count({ where: { isActive: true } }),
    prisma.botExclude.count(),
    prisma.botWhitelist.count(),
    prisma.botLog.count({ where: { botType: "LIKE", status: "SENT" } }),
    prisma.botLog.count({ where: { botType: "PROFILE_VIEW", status: "SENT" } }),
    prisma.botLog.count({ where: { botType: "GIFT", status: "SENT" } }),
    prisma.botLog.count({ where: { botType: "MATCH", status: "SENT" } }),
    prisma.botLog.count({ where: { botType: "STORY_VIEW", status: "SENT" } }),
    prisma.botLog.count({ where: { botType: "AUTO_REPLY", status: "SENT" } }),
  ]);

  const responseRate = totalSent > 0 ? Math.round((totalAnswered / totalSent) * 100) : 0;

  return {
    fakeUsers,
    totalSent,
    sentToday,
    sent7Days,
    sent30Days,
    totalAnswered,
    responseRate,
    dynamicTemplates,
    blacklistCount,
    whitelistCount,
    likeBotLogs,
    viewBotLogs,
    giftBotLogs,
    matchBotLogs,
    storyBotLogs,
    autoReplyLogs,
  };
}
