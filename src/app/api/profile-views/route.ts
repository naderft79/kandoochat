// API آمار بازدید پروفایل
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth";
import { incrementMissionProgress } from "@/lib/missions";

export async function GET() {
  try {
    const user = await requireUser();

    // آمار ۷ روز گذشته
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const views = await prisma.profileView.findMany({
      where: { viewedId: user.id, createdAt: { gte: sevenDaysAgo } },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        viewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            age: true,
            city: true,
            isVerified: true,
            isOnline: true,
          },
        },
      },
    });

    // گروه بندی روزانه
    const dailyStats: Record<string, number> = {};
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      dailyStats[d.toDateString()] = 0;
    }
    for (const v of views) {
      const key = new Date(v.createdAt).toDateString();
      if (key in dailyStats) dailyStats[key]++;
    }

    const totalThisWeek = views.length;
    const uniqueViewers = new Set(views.map((v) => v.viewerId)).size;

    return NextResponse.json({
      totalThisWeek,
      uniqueViewers,
      dailyStats: Object.entries(dailyStats).map(([date, count]) => ({ date, count })),
      recentViewers: views.slice(0, 20).map((v) => ({
        id: v.id,
        createdAt: v.createdAt,
        viewer: v.viewer,
      })),
    });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[profile-views] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

// ثبت بازدید پروفایل
export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const { viewedId } = body as { viewedId: string };

    if (!viewedId || viewedId === user.id) {
      return NextResponse.json({ ok: true });
    }

    // جلوگیری از اسپم: هر بازدیدکننده فقط یک بار در ۲۴ ساعت ثبت می شود
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentView = await prisma.profileView.findFirst({
      where: { viewerId: user.id, viewedId, createdAt: { gte: dayAgo } },
      select: { id: true },
    });
    if (recentView) return NextResponse.json({ ok: true });

    await prisma.profileView.create({
      data: { viewerId: user.id, viewedId },
    });

    // ماموریت بازدید پروفایل ها
    void incrementMissionProgress(user.id, "open_10_profiles");

    // نوتیفیکیشن بازدید پروفایل — فقط اگر کاربر این نوتیف را فعال کرده باشد
    const settings = await prisma.userSettings.findUnique({
      where: { userId: viewedId },
      select: { notifProfileViews: true },
    });
    if (settings?.notifProfileViews !== false) {
      await prisma.notification.create({
        data: {
          userId: viewedId,
          type: "PROFILE_VIEW",
          title: "بازدید جدید پروفایل",
          body: `${user.firstName} پروفایل شما را مشاهده کرد`,
          data: JSON.stringify({ viewerId: user.id }),
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[profile-views POST] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
