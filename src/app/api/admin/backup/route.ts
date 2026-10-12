// API بکاپ گیری از دیتابیس — فقط ادمین
import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin, AuthError } from "@/lib/auth";
import { logAction } from "@/lib/audit";

export async function GET() {
  try {
    const admin = await requireAdmin();

    // دریافت تمام داده های جدول ها
    const [
      users, settings, transactions, subscriptions, withdrawRequests,
      conversations, messages, coinTransfers, paymentRequests, notifications,
      likes, blocks, reports, profileViews, boosts, streaks, referrals,
      profilePhotos, userSettings, interests, userInterests, missions, userMissions,
      auditLogs, stories, storyViews, storyLikes, storyReplies, tickets, ticketMessages,
      matches, gifts, giftPurchases,
    ] = await Promise.all([
      prisma.user.findMany(),
      prisma.setting.findMany(),
      prisma.transaction.findMany(),
      prisma.subscription.findMany(),
      prisma.withdrawRequest.findMany(),
      prisma.conversation.findMany(),
      prisma.message.findMany(),
      prisma.coinTransfer.findMany(),
      prisma.paymentRequest.findMany(),
      prisma.notification.findMany(),
      prisma.like.findMany(),
      prisma.block.findMany(),
      prisma.report.findMany(),
      prisma.profileView.findMany(),
      prisma.boost.findMany(),
      prisma.streak.findMany(),
      prisma.referral.findMany(),
      prisma.profilePhoto.findMany(),
      prisma.userSettings.findMany(),
      prisma.interest.findMany(),
      prisma.userInterest.findMany(),
      prisma.mission.findMany(),
      prisma.userMission.findMany(),
      prisma.auditLog.findMany(),
      prisma.story.findMany(),
      prisma.storyView.findMany(),
      prisma.storyLike.findMany(),
      prisma.storyReply.findMany(),
      prisma.ticket.findMany(),
      prisma.ticketMessage.findMany(),
      prisma.match.findMany(),
      prisma.gift.findMany(),
      prisma.giftPurchase.findMany(),
    ]);

    const backup = {
      meta: {
        version: 1,
        createdAt: new Date().toISOString(),
        exportedBy: admin.id,
      },
      data: {
        users, settings, transactions, subscriptions, withdrawRequests,
        conversations, messages, coinTransfers, paymentRequests, notifications,
        likes, blocks, reports, profileViews, boosts, streaks, referrals,
        profilePhotos, userSettings, interests, userInterests, missions, userMissions,
        auditLogs, stories, storyViews, storyLikes, storyReplies, tickets, ticketMessages,
        matches, gifts, giftPurchases,
      },
    };

    await logAction(admin.id, "BACKUP_EXPORT", "SYSTEM", undefined, "full backup");
    console.log(`[admin backup] ${admin.id} exported backup at ${backup.meta.createdAt}`);

    const filename = `kandoo-backup-${new Date().toISOString().split("T")[0]}.json`;
    return new NextResponse(JSON.stringify(backup, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[admin backup GET] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

// بازیابی بکاپ
export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();

    if (!body.meta || !body.data) {
      return NextResponse.json({ error: "فایل بکاپ نامعتبر" }, { status: 400 });
    }

    const d = body.data;

    // پاک کردن تمام جداول به ترتیب وابستگی
    await prisma.$transaction([
      prisma.giftPurchase.deleteMany(),
      prisma.gift.deleteMany(),
      prisma.match.deleteMany(),
      prisma.ticketMessage.deleteMany(),
      prisma.ticket.deleteMany(),
      prisma.storyReply.deleteMany(),
      prisma.storyLike.deleteMany(),
      prisma.storyView.deleteMany(),
      prisma.story.deleteMany(),
      prisma.auditLog.deleteMany(),
      prisma.userMission.deleteMany(),
      prisma.mission.deleteMany(),
      prisma.userInterest.deleteMany(),
      prisma.interest.deleteMany(),
      prisma.userSettings.deleteMany(),
      prisma.profilePhoto.deleteMany(),
      prisma.referral.deleteMany(),
      prisma.streak.deleteMany(),
      prisma.boost.deleteMany(),
      prisma.profileView.deleteMany(),
      prisma.report.deleteMany(),
      prisma.block.deleteMany(),
      prisma.like.deleteMany(),
      prisma.notification.deleteMany(),
      prisma.paymentRequest.deleteMany(),
      prisma.coinTransfer.deleteMany(),
      prisma.message.deleteMany(),
      prisma.conversation.deleteMany(),
      prisma.withdrawRequest.deleteMany(),
      prisma.subscription.deleteMany(),
      prisma.transaction.deleteMany(),
      prisma.setting.deleteMany(),
      prisma.user.deleteMany(),
    ]);

    // بازیابی داده ها
    if (d.users?.length) await prisma.user.createMany({ data: d.users });
    if (d.settings?.length) await prisma.setting.createMany({ data: d.settings });
    if (d.transactions?.length) await prisma.transaction.createMany({ data: d.transactions });
    if (d.subscriptions?.length) await prisma.subscription.createMany({ data: d.subscriptions });
    if (d.withdrawRequests?.length) await prisma.withdrawRequest.createMany({ data: d.withdrawRequests });
    if (d.conversations?.length) await prisma.conversation.createMany({ data: d.conversations });
    if (d.messages?.length) await prisma.message.createMany({ data: d.messages });
    if (d.coinTransfers?.length) await prisma.coinTransfer.createMany({ data: d.coinTransfers });
    if (d.paymentRequests?.length) await prisma.paymentRequest.createMany({ data: d.paymentRequests });
    if (d.notifications?.length) await prisma.notification.createMany({ data: d.notifications });
    if (d.likes?.length) await prisma.like.createMany({ data: d.likes });
    if (d.blocks?.length) await prisma.block.createMany({ data: d.blocks });
    if (d.reports?.length) await prisma.report.createMany({ data: d.reports });
    if (d.profileViews?.length) await prisma.profileView.createMany({ data: d.profileViews });
    if (d.boosts?.length) await prisma.boost.createMany({ data: d.boosts });
    if (d.streaks?.length) await prisma.streak.createMany({ data: d.streaks });
    if (d.referrals?.length) await prisma.referral.createMany({ data: d.referrals });
    if (d.profilePhotos?.length) await prisma.profilePhoto.createMany({ data: d.profilePhotos });
    if (d.userSettings?.length) await prisma.userSettings.createMany({ data: d.userSettings });
    if (d.interests?.length) await prisma.interest.createMany({ data: d.interests });
    if (d.userInterests?.length) await prisma.userInterest.createMany({ data: d.userInterests });
    if (d.missions?.length) await prisma.mission.createMany({ data: d.missions });
    if (d.userMissions?.length) await prisma.userMission.createMany({ data: d.userMissions });
    if (d.auditLogs?.length) await prisma.auditLog.createMany({ data: d.auditLogs });
    if (d.stories?.length) await prisma.story.createMany({ data: d.stories });
    if (d.storyViews?.length) await prisma.storyView.createMany({ data: d.storyViews });
    if (d.storyLikes?.length) await prisma.storyLike.createMany({ data: d.storyLikes });
    if (d.storyReplies?.length) await prisma.storyReply.createMany({ data: d.storyReplies });
    if (d.tickets?.length) await prisma.ticket.createMany({ data: d.tickets });
    if (d.ticketMessages?.length) await prisma.ticketMessage.createMany({ data: d.ticketMessages });
    if (d.matches?.length) await prisma.match.createMany({ data: d.matches });
    if (d.gifts?.length) await prisma.gift.createMany({ data: d.gifts });
    if (d.giftPurchases?.length) await prisma.giftPurchase.createMany({ data: d.giftPurchases });

    await logAction(admin.id, "BACKUP_RESTORE", "SYSTEM", undefined, `restored from ${body.meta.createdAt}`);
    console.log(`[admin backup] ${admin.id} restored backup from ${body.meta.createdAt}`);

    return NextResponse.json({ ok: true, message: "بازیابی با موفقیت انجام شد" });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      console.error("[admin backup POST] prisma error:", err.code, err.message);
      return NextResponse.json({ error: `خطای دیتابیس: ${err.code}` }, { status: 400 });
    }
    console.error("[admin backup POST] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
