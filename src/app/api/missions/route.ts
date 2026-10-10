// API ماموریت های روزانه — دریافت لیست و پاداش
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth";
import { ensureWallet } from "@/lib/finance";
import { getAllSettings } from "@/lib/settings";

// دریافت ماموریت های روزانه کاربر
export async function GET() {
  try {
    const user = await requireUser();

    const missions = await prisma.mission.findMany({
      where: { isActive: true },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const userMissions = await prisma.userMission.findMany({
      where: {
        userId: user.id,
        date: { gte: today },
      },
    });

    const result = missions.map((m) => {
      const um = userMissions.find((u) => u.missionId === m.id);
      return {
        id: m.id,
        key: m.key,
        title: m.title,
        description: m.description,
        rewardCoins: m.rewardCoins,
        target: m.target,
        icon: m.icon,
        progress: um?.progress ?? 0,
        completed: um?.completed ?? false,
        claimed: um?.claimed ?? false,
      };
    });

    return NextResponse.json({ missions: result });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[missions GET] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

// دریافت پاداش ماموریت
export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const { missionId } = (await request.json()) as { missionId?: string };

    if (!missionId) {
      return NextResponse.json({ error: "شناسه ماموریت الزامی است" }, { status: 400 });
    }

    const mission = await prisma.mission.findUnique({
      where: { id: missionId },
    });

    if (!mission || !mission.isActive) {
      return NextResponse.json({ error: "ماموریت یافت نشد" }, { status: 404 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const userMission = await prisma.userMission.findFirst({
      where: {
        userId: user.id,
        missionId,
        date: { gte: today },
      },
    });

    if (!userMission || !userMission.completed || userMission.claimed) {
      return NextResponse.json({ error: "پاداش این ماموریت قابل دریافت نیست" }, { status: 400 });
    }

    const settings = await getAllSettings();
    await ensureWallet(user.id);

    await prisma.$transaction([
      prisma.userMission.update({
        where: { id: userMission.id },
        data: { claimed: true },
      }),
      prisma.wallet.update({
        where: { userId: user.id },
        data: { balance: { increment: mission.rewardCoins } },
      }),
      prisma.transaction.create({
        data: {
          userId: user.id,
          type: "REFERRAL_REWARD",
          coins: mission.rewardCoins,
          amountToman: mission.rewardCoins * settings.coinValue,
          status: "COMPLETED",
          description: `پاداش ماموریت: ${mission.title}`,
        },
      }),
    ]);

    console.log(`[missions] user ${user.id} claimed mission ${mission.key}, reward: ${mission.rewardCoins}`);

    // آزادسازی پاداش دعوت در صورت تکمیل شرایط (اولین ماموریت دریافت شده + پروفایل کامل)
    const { maybeActivateReferral } = await import("@/lib/referral");
    void maybeActivateReferral(user.id);

    return NextResponse.json({ ok: true, reward: mission.rewardCoins });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[missions POST] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
