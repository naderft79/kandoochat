// ربات هدیه — ارسال هدیه از کاربران فیک به کاربران واقعی
import { prisma } from "@/lib/prisma";
import { getAllSettings } from "@/lib/settings";
import { isWithinActiveHours, isWithinActiveWeekdays, randomDelay, getHourlySentCount, isUserInGlobalCooldown } from "@/lib/botHelpers";

export async function runGiftBotCycle(): Promise<{ sent: number; skipped: number }> {
  const settings = await getAllSettings();

  if (!settings.botGiftEnabled) return { sent: 0, skipped: 0 };
  if (!isWithinActiveHours(settings.botActiveHoursStart, settings.botActiveHoursEnd)) return { sent: 0, skipped: 0 };
  if (!isWithinActiveWeekdays(settings.botActiveWeekdays)) return { sent: 0, skipped: 0 };

  const hourlyCount = await getHourlySentCount("GIFT");
  if (hourlyCount >= settings.botGiftMaxPerHour) return { sent: 0, skipped: 0 };

  const cooldownMs = settings.botGiftCooldownHours * 60 * 60 * 1000;

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
    select: { id: true, gender: true, city: true },
    take: settings.botGiftPerRun * 3,
    orderBy: { lastSeen: "asc" },
  });

  const eligible: typeof users = [];
  for (const u of users) {
    if (await isUserInGlobalCooldown(u.id, settings.botGlobalCooldownMinutes)) continue;
    const last = await prisma.botLog.findFirst({
      where: { botType: "GIFT", targetId: u.id, status: "SENT" },
      orderBy: { createdAt: "desc" }, select: { createdAt: true },
    });
    if (last && Date.now() - last.createdAt.getTime() < cooldownMs) continue;
    eligible.push(u);
  }

  // پیدا کردن هدایای فعال با قیمت مناسب
  const gifts = await prisma.gift.findMany({
    where: {
      isActive: true,
      coinPrice: { lte: settings.botGiftMaxCoins },
    },
  });

  if (gifts.length === 0) {
    console.log("[bot-gift] No gifts available");
    return { sent: 0, skipped: 0 };
  }

  const targets = eligible.slice(0, settings.botGiftPerRun);
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
    const gift = gifts[Math.floor(Math.random() * gifts.length)];

    // پیدا کردن یا ساخت گفتگو
    const [aId, bId] = sender.id < target.id ? [sender.id, target.id] : [target.id, sender.id];
    let conversation = await prisma.conversation.findFirst({
      where: { OR: [{ userAId: aId, userBId: bId }, { userAId: bId, userBId: aId }] },
    });
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: { userAId: aId, userBId: bId, startedBy: aId },
      });
    }

    try {
      await prisma.giftPurchase.create({
        data: {
          giftId: gift.id,
          senderId: sender.id,
          receiverId: target.id,
          conversationId: conversation.id,
          coinsPaid: 0, // فیک رایگان
        },
      });
      sent++;
      await prisma.botLog.create({
        data: {
          botType: "GIFT",
          senderId: sender.id,
          targetId: target.id,
          status: "SENT",
          detail: gift.name,
        },
      });
      console.log(`[bot-gift] ${sender.id} sent ${gift.name} to ${target.id}`);
    } catch (err) {
      console.error("[bot-gift] error:", err);
      skipped++;
    }

    await randomDelay(settings.botDelayMinMs, settings.botDelayMaxMs);
  }

  console.log(`[bot-gift] Cycle: ${sent} sent, ${skipped} skipped`);
  return { sent, skipped };
}
