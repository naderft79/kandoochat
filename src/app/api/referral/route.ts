// API دعوت دوستان — آمار، لیست دعوت ها، مایلستون و لیدربورد
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth";
import { getBrandSettings } from "@/lib/brandSettings";
import { parseBrandFromUA } from "@/lib/brands";
import { ensureReferralCode, findUserByReferralCode, createPendingReferral } from "@/lib/referral";

// دریافت اطلاعات کامل دعوت دوستان
export async function GET(request: Request) {
  try {
    const user = await requireUser();
    // مقادیر پاداش بر اساس تنظیمات همان اپ
    const { brandId } = parseBrandFromUA(request.headers.get("user-agent"));
    const settings = await getBrandSettings(brandId);
    const code = await ensureReferralCode(user);

    const referrals = await prisma.referral.findMany({
      where: { referrerId: user.id },
      include: {
        referred: {
          select: {
            id: true, firstName: true, createdAt: true,
            photos: { select: { url: true }, where: { isVerified: true, isRejected: false, isDeletedByUser: false, isProfile: true }, take: 1 },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const paid = referrals.filter((r) => r.status === "PAID");
    const pending = referrals.filter((r) => r.status === "PENDING");
    const earned = paid.reduce((sum, r) => sum + r.rewardCoins, 0)
      + (user.referralMilestonePaidAt ? settings.referralMilestoneCoins : 0);

    // لیدربورد ناشناس — تاپ ۱۰ دعوت کننده بر اساس دعوت های فعال
    const topReferrers = await prisma.referral.groupBy({
      by: ["referrerId"],
      where: { status: "PAID" },
      _count: { referredId: true },
      orderBy: { _count: { referredId: "desc" } },
      take: 10,
    });

    return NextResponse.json({
      code,
      rewardCoins: settings.referralRewardCoins,
      milestone: {
        target: settings.referralMilestoneCount,
        reward: settings.referralMilestoneCoins,
        progress: paid.length,
        paidAt: user.referralMilestonePaidAt,
      },
      stats: {
        invited: referrals.length,
        pending: pending.length,
        paid: paid.length,
        earned,
      },
      referrals: referrals.map((r) => ({
        id: r.id,
        status: r.status,
        rewardCoins: r.rewardCoins,
        createdAt: r.createdAt,
        paidAt: r.paidAt,
        referred: {
          firstName: r.referred.firstName,
          photo: r.referred.photos[0]?.url ?? null,
        },
      })),
      leaderboard: topReferrers.map((t, i) => ({
        rank: i + 1,
        invites: t._count.referredId,
        isMe: t.referrerId === user.id,
      })),
    });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[referral GET] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

// ثبت دعوت دستی — برای سازگاری؛ رکورد در انتظار ساخته می شود و پاداش بعد از فعالیت آزاد می شود
export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const { referrerId } = body as { referrerId: string };

    if (!referrerId || referrerId === user.id) {
      return NextResponse.json({ error: "کد دعوت نامعتبر است" }, { status: 400 });
    }

    // بررسی اینکه قبلا دعوت شده یا نه
    const existing = await prisma.referral.findUnique({
      where: { referredId: user.id },
    });
    if (existing) {
      return NextResponse.json({ error: "قبلا با کد دعوت ثبت شده اید" }, { status: 400 });
    }

    const referrer = await findUserByReferralCode(referrerId);
    if (!referrer || referrer.id === user.id) {
      return NextResponse.json({ error: "کاربر دعوت کننده یافت نشد" }, { status: 404 });
    }

    const created = await createPendingReferral(referrer.id, user.id);
    if (!created) {
      return NextResponse.json({ error: "امکان ثبت دعوت وجود ندارد" }, { status: 400 });
    }

    console.log(`[referral] pending: ${referrer.id} invited ${user.id}`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[referral POST] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
