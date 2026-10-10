// API آمار پیشرفته ربات
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, AuthError } from "@/lib/auth";
import { getBotStats } from "@/lib/bot";

export async function GET() {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    throw e;
  }

  const stats = await getBotStats();

  // آمار روزانه ۷ روز گذشته
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const dailyLogs = await prisma.botLog.findMany({
    where: {
      botType: "MESSAGE",
      status: "SENT",
      createdAt: { gte: sevenDaysAgo },
    },
    select: { createdAt: true },
  });

  const dailyMap: Record<string, number> = {};
  for (const log of dailyLogs) {
    const day = log.createdAt.toISOString().split("T")[0];
    dailyMap[day] = (dailyMap[day] || 0) + 1;
  }

  // آمار هر دسته قالب
  const templateStats = await prisma.botTemplate.findMany({
    where: { isActive: true },
    select: { id: true, text: true, category: true, sendCount: true, answerCount: true, weight: true },
    orderBy: { sendCount: "desc" },
  });

  // آمار هر دسته
  const categoryStats: Record<string, { sent: number; answered: number }> = {};
  for (const t of templateStats) {
    if (!categoryStats[t.category]) {
      categoryStats[t.category] = { sent: 0, answered: 0 };
    }
    categoryStats[t.category].sent += t.sendCount;
    categoryStats[t.category].answered += t.answerCount;
  }

  return NextResponse.json({
    ...stats,
    daily: dailyMap,
    templateStats,
    categoryStats,
  });
}
