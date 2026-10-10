// ربات مچ — ایجاد لایک متقابل و مچ بین کاربر فیک و کاربر واقعی
import { prisma } from "@/lib/prisma";
import { getAllSettings } from "@/lib/settings";
import { isWithinActiveHours, isWithinActiveWeekdays, randomDelay, getHourlySentCount, isUserInGlobalCooldown } from "@/lib/botHelpers";

export async function runMatchBotCycle(): Promise<{ sent: number; skipped: number }> {
  const settings = await getAllSettings();

  if (!settings.botMatchEnabled) return { sent: 0, skipped: 0 };
  if (!isWithinActiveHours(settings.botActiveHoursStart, settings.botActiveHoursEnd)) return { sent: 0, skipped: 0 };
  if (!isWithinActiveWeekdays(settings.botActiveWeekdays)) return { sent: 0, skipped: 0 };

  const hourlyCount = await getHourlySentCount("MATCH");
  if (hourlyCount >= settings.botMatchMaxPerHour) return { sent: 0, skipped: 0 };

  // انتخاب کاربران هدف
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
    take: settings.botMatchPerRun * 3,
    orderBy: { lastSeen: "asc" },
  });

  let sent = 0;
  let skipped = 0;

  for (const target of users.slice(0, settings.botMatchPerRun)) {
    if (await isUserInGlobalCooldown(target.id, settings.botGlobalCooldownMinutes)) {
      skipped++;
      continue;
    }
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

    // بررسی عدم وجود مچ قبلی
    const [aId, bId] = sender.id < target.id ? [sender.id, target.id] : [target.id, sender.id];
    const existingMatch = await prisma.match.findUnique({
      where: { userAId_userBId: { userAId: aId, userBId: bId } },
    });
    if (existingMatch) {
      skipped++;
      continue;
    }

    try {
      // لایک از فیک به کاربر
      const existingLike1 = await prisma.like.findFirst({
        where: { senderId: sender.id, receiverId: target.id, type: "LIKE" },
      });
      if (!existingLike1) {
        await prisma.like.create({
          data: { senderId: sender.id, receiverId: target.id, type: "LIKE", isMatched: true },
        });
      }

      // لایک از کاربر به فیک (شبیه‌سازی لایک متقابل)
      const existingLike2 = await prisma.like.findFirst({
        where: { senderId: target.id, receiverId: sender.id, type: "LIKE" },
      });
      if (!existingLike2) {
        await prisma.like.create({
          data: { senderId: target.id, receiverId: sender.id, type: "LIKE", isMatched: true },
        });
      }

      // ایجاد مچ
      await prisma.match.create({
        data: { userAId: aId, userBId: bId },
      });

      sent++;
      await prisma.botLog.create({
        data: {
          botType: "MATCH",
          senderId: sender.id,
          targetId: target.id,
          status: "SENT",
        },
      });
      console.log(`[bot-match] Match created: ${sender.id} <-> ${target.id}`);
    } catch (err) {
      console.error("[bot-match] error:", err);
      skipped++;
    }

    await randomDelay(settings.botDelayMinMs, settings.botDelayMaxMs);
  }

  console.log(`[bot-match] Cycle: ${sent} sent, ${skipped} skipped`);
  return { sent, skipped };
}
