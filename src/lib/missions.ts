// پیشرفت ماموریت های روزانه — افزایش progress و علامت تکمیل
import { prisma } from "@/lib/prisma";

// افزایش پیشرفت یک ماموریت برای کاربر؛ اگر به target رسید completed می شود
export async function incrementMissionProgress(userId: string, missionKey: string, amount = 1) {
  try {
    const mission = await prisma.mission.findUnique({ where: { key: missionKey } });
    if (!mission || !mission.isActive) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await prisma.userMission.findFirst({
      where: { userId, missionId: mission.id, date: { gte: today } },
    });

    if (existing) {
      if (existing.completed) return; // قبلاً تمام شده
      const progress = existing.progress + amount;
      await prisma.userMission.update({
        where: { id: existing.id },
        data: { progress, completed: progress >= mission.target },
      });
    } else {
      await prisma.userMission.create({
        data: {
          userId,
          missionId: mission.id,
          progress: amount,
          completed: amount >= mission.target,
          date: new Date(),
        },
      });
    }
  } catch (err) {
    console.error(`[missions] increment ${missionKey} failed for ${userId}:`, err);
  }
}
