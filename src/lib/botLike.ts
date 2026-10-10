// ربات لایک — ارسال لایک و سوپر لایک از کاربران فیک به کاربران واقعی
import { prisma } from "@/lib/prisma";
import { getAllSettings } from "@/lib/settings";
import { isWithinActiveHours, isWithinActiveWeekdays, randomDelay, getHourlySentCount, isUserInGlobalCooldown, logBotAction } from "@/lib/botHelpers";

export async function runLikeBotCycle(): Promise<{ sent: number; skipped: number }> {
  const settings = await getAllSettings();

  if (!settings.botLikeEnabled) return { sent: 0, skipped: 0 };
  if (!isWithinActiveHours(settings.botActiveHoursStart, settings.botActiveHoursEnd)) return { sent: 0, skipped: 0 };
  if (!isWithinActiveWeekdays(settings.botActiveWeekdays)) return { sent: 0, skipped: 0 };

  const hourlyCount = await getHourlySentCount("LIKE");
  if (hourlyCount >= settings.botLikeMaxPerHour) return { sent: 0, skipped: 0 };

  const now = new Date();
  const cooldownMs = settings.botLikeCooldownHours * 60 * 60 * 1000;

  // انتخاب کاربران هدف — مشابه ربات پیام اما ساده‌تر
  const where: Record<string, unknown> = {
    role: "USER",
    isActive: true,
    isFake: false,
  };

  if (settings.botTargetGender !== "ALL") {
    where.gender = settings.botTargetGender;
  }

  where.age = { gte: settings.botTargetMinAge, lte: settings.botTargetMaxAge };

  // لیست سیاه
  const excluded = await prisma.botExclude.findMany({ select: { userId: true } });
  if (excluded.length > 0) {
    where.id = { notIn: excluded.map((e) => e.userId) };
  }

  const users = await prisma.user.findMany({
    where,
    select: { id: true, gender: true, city: true },
    take: settings.botLikePerRun * 3,
    orderBy: { lastSeen: "asc" },
  });

  // فیلتر cooldown
  const eligible: typeof users = [];
  for (const u of users) {
    if (await isUserInGlobalCooldown(u.id, settings.botGlobalCooldownMinutes)) continue;
    const lastLog = await prisma.botLog.findFirst({
      where: { botType: "LIKE", targetId: u.id, status: "SENT" },
      orderBy: { createdAt: "desc" }, select: { createdAt: true },
    });
    if (lastLog && Date.now() - lastLog.createdAt.getTime() < cooldownMs) continue;
    eligible.push(u);
  }

  const targets = eligible.slice(0, settings.botLikePerRun);
  let sent = 0;
  let skipped = 0;

  for (const target of targets) {
    // انتخاب فیک ارسال‌کننده
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

    // تعیین نوع لایک (LIKE یا SUPER_LIKE)
    const isSuperLike = Math.random() * 100 < settings.botLikeSuperLikeChance;
    const type = isSuperLike ? "SUPER_LIKE" : "LIKE";

    // بررسی عدم تکرار
    const existing = await prisma.like.findFirst({
      where: { senderId: sender.id, receiverId: target.id, type },
    });
    if (existing) {
      skipped++;
      continue;
    }

    try {
      await prisma.like.create({
        data: { senderId: sender.id, receiverId: target.id, type },
      });
      sent++;
      await prisma.botLog.create({
        data: {
          botType: "LIKE",
          senderId: sender.id,
          targetId: target.id,
          status: "SENT",
          detail: type,
        },
      });
      console.log(`[bot-like] ${type} from ${sender.id} to ${target.id}`);
    } catch (err) {
      console.error("[bot-like] error:", err);
      skipped++;
    }

    await randomDelay(settings.botDelayMinMs, settings.botDelayMaxMs);
  }

  console.log(`[bot-like] Cycle: ${sent} sent, ${skipped} skipped`);
  return { sent, skipped };
}
