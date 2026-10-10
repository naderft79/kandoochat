// ربات بازدید استوری — بازدید استوری کاربران واقعی توسط کاربران فیک
import { prisma } from "@/lib/prisma";
import { getAllSettings } from "@/lib/settings";
import { isWithinActiveHours, isWithinActiveWeekdays, randomDelay, getHourlySentCount, isUserInGlobalCooldown } from "@/lib/botHelpers";

export async function runStoryBotCycle(): Promise<{ sent: number; skipped: number }> {
  const settings = await getAllSettings();

  if (!settings.botStoryViewEnabled) return { sent: 0, skipped: 0 };
  if (!isWithinActiveHours(settings.botActiveHoursStart, settings.botActiveHoursEnd)) return { sent: 0, skipped: 0 };
  if (!isWithinActiveWeekdays(settings.botActiveWeekdays)) return { sent: 0, skipped: 0 };

  const hourlyCount = await getHourlySentCount("STORY_VIEW");
  if (hourlyCount >= settings.botStoryViewMaxPerHour) return { sent: 0, skipped: 0 };

  const now = new Date();

  // پیدا کردن استوری‌های فعال کاربران هدف
  const where: Record<string, unknown> = {
    role: "USER",
    isActive: true,
    isFake: false,
  };

  if (settings.botTargetGender !== "ALL") {
    where.gender = settings.botTargetGender;
  }

  where.age = { gte: settings.botTargetMinAge, lte: settings.botTargetMaxAge };

  const excluded = await prisma.botExclude.findMany({ select: { userId: true } });
  if (excluded.length > 0) {
    where.id = { notIn: excluded.map((e) => e.userId) };
  }

  // پیدا کردن استوری‌های فعال
  const stories = await prisma.story.findMany({
    where: {
      expiresAt: { gt: now },
      user: { ...where },
    },
    select: {
      id: true,
      userId: true,
      user: { select: { gender: true } },
    },
    take: settings.botStoryViewPerRun * 2,
    orderBy: { createdAt: "desc" },
  });

  let sent = 0;
  let skipped = 0;

  for (const story of stories.slice(0, settings.botStoryViewPerRun)) {
    // بررسی cooldown جهانی
    if (await isUserInGlobalCooldown(story.userId, settings.botGlobalCooldownMinutes)) {
      skipped++;
      continue;
    }
    // انتخاب فیک
    const senderWhere: Record<string, unknown> = {
      isFake: true,
      isActive: true,
      role: "USER",
    };

    if (story.user.gender === "MALE") {
      senderWhere.gender = "FEMALE";
    } else if (story.user.gender === "FEMALE") {
      senderWhere.gender = "MALE";
    }

    const senders = await prisma.user.findMany({
      where: senderWhere,
      select: { id: true },
      take: 5,
    });

    if (senders.length === 0) {
      skipped++;
      continue;
    }

    const sender = senders[Math.floor(Math.random() * senders.length)];

    // بررسی عدم تکرار
    const existing = await prisma.storyView.findUnique({
      where: { storyId_viewerId: { storyId: story.id, viewerId: sender.id } },
    });
    if (existing) {
      skipped++;
      continue;
    }

    try {
      await prisma.storyView.create({
        data: { storyId: story.id, viewerId: sender.id },
      });
      sent++;
      await prisma.botLog.create({
        data: {
          botType: "STORY_VIEW",
          senderId: sender.id,
          targetId: story.userId,
          status: "SENT",
          detail: story.id,
        },
      });
      console.log(`[bot-story] ${sender.id} viewed story ${story.id}`);
    } catch (err) {
      console.error("[bot-story] error:", err);
      skipped++;
    }

    await randomDelay(settings.botDelayMinMs, settings.botDelayMaxMs);
  }

  console.log(`[bot-story] Cycle: ${sent} sent, ${skipped} skipped`);
  return { sent, skipped };
}
