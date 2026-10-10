// ربات بازدید پروفایل — بازدید پروفایل کاربران واقعی توسط کاربران فیک
import { prisma } from "@/lib/prisma";
import { getAllSettings } from "@/lib/settings";
import { isWithinActiveHours, isWithinActiveWeekdays, randomDelay, getHourlySentCount, isUserInGlobalCooldown } from "@/lib/botHelpers";

export async function runViewBotCycle(): Promise<{ sent: number; skipped: number }> {
  const settings = await getAllSettings();

  if (!settings.botViewEnabled) return { sent: 0, skipped: 0 };
  if (!isWithinActiveHours(settings.botActiveHoursStart, settings.botActiveHoursEnd)) return { sent: 0, skipped: 0 };
  if (!isWithinActiveWeekdays(settings.botActiveWeekdays)) return { sent: 0, skipped: 0 };

  const hourlyCount = await getHourlySentCount("PROFILE_VIEW");
  if (hourlyCount >= settings.botViewMaxPerHour) return { sent: 0, skipped: 0 };

  const cooldownMs = settings.botViewCooldownHours * 60 * 60 * 1000;

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

  const users = await prisma.user.findMany({
    where,
    select: { id: true, gender: true },
    take: settings.botViewPerRun * 3,
    orderBy: { lastSeen: "asc" },
  });

  const eligible: typeof users = [];
  for (const u of users) {
    if (await isUserInGlobalCooldown(u.id, settings.botGlobalCooldownMinutes)) continue;
    const last = await prisma.botLog.findFirst({
      where: { botType: "PROFILE_VIEW", targetId: u.id, status: "SENT" },
      orderBy: { createdAt: "desc" }, select: { createdAt: true },
    });
    if (last && Date.now() - last.createdAt.getTime() < cooldownMs) continue;
    eligible.push(u);
  }

  const targets = eligible.slice(0, settings.botViewPerRun);
  let sent = 0;
  let skipped = 0;

  for (const target of targets) {
    // انتخاب فیک
    const senderWhere: Record<string, unknown> = {
      isFake: true,
      isActive: true,
      role: "USER",
    };

    if (target.gender === "MALE") {
      senderWhere.gender = "FEMALE";
    } else if (target.gender === "FEMALE") {
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

    // بررسی عدم تکرار اخیر
    const recentView = await prisma.profileView.findFirst({
      where: {
        viewerId: sender.id,
        viewedId: target.id,
        createdAt: { gte: new Date(Date.now() - cooldownMs) },
      },
    });
    if (recentView) {
      skipped++;
      continue;
    }

    try {
      await prisma.profileView.create({
        data: { viewerId: sender.id, viewedId: target.id },
      });
      sent++;
      await prisma.botLog.create({
        data: {
          botType: "PROFILE_VIEW",
          senderId: sender.id,
          targetId: target.id,
          status: "SENT",
        },
      });
      console.log(`[bot-view] ${sender.id} viewed ${target.id}`);
    } catch (err) {
      console.error("[bot-view] error:", err);
      skipped++;
    }

    await randomDelay(settings.botDelayMinMs, settings.botDelayMaxMs);
  }

  console.log(`[bot-view] Cycle: ${sent} sent, ${skipped} skipped`);
  return { sent, skipped };
}
