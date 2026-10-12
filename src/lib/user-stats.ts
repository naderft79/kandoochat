// آمار حساب هر کاربر برای کارت پنل ادمین
// هر آمار با یک groupBy روی کل لیست کاربران انجام می شود (بدون کوئری جدا برای هر کاربر)
import { prisma } from "@/lib/prisma";

export type UserStats = {
  messagesSent: number; // تعداد کل پیام های ارسالی
  imagesSent: number; // تعداد پیام های تصویری ارسالی در گفتگو
  subscriptionCount: number; // تعداد خرید اشتراک (تراکنش های موفق)
  subscriptionToman: number; // جمع مبلغ خرید اشتراک (تومان)
  subscriptionCoins: number; // جمع سکه پرداختی برای اشتراک
  coinsPurchased: number; // جمع سکه خریداری شده
  coinsTransferred: number; // جمع سکه انتقال داده شده (ارسالی)
  coinsWithdrawn: number; // جمع سکه برداشت شده (درخواست های تایید شده)
  withdrawnToman: number; // جمع مبلغ برداشت شده (تومان، درخواست های تایید شده)
};

const emptyStats = (): UserStats => ({
  messagesSent: 0,
  imagesSent: 0,
  subscriptionCount: 0,
  subscriptionToman: 0,
  subscriptionCoins: 0,
  coinsPurchased: 0,
  coinsTransferred: 0,
  coinsWithdrawn: 0,
  withdrawnToman: 0,
});

// خروجی: نقشه شناسه کاربر به آمار؛ کاربری که رکوردی ندارد، صفر دریافت می کند
export async function getUserStatsMap(userIds: string[]): Promise<Record<string, UserStats>> {
  const result: Record<string, UserStats> = {};
  for (const id of userIds) result[id] = emptyStats();
  if (userIds.length === 0) return result;

  const slot = (id: string) => (result[id] ??= emptyStats());

  const [messages, images, subscriptions, purchases, transfers, withdrawals] = await Promise.all([
    prisma.message.groupBy({ by: ["senderId"], where: { senderId: { in: userIds } }, _count: { _all: true } }),
    prisma.message.groupBy({ by: ["senderId"], where: { senderId: { in: userIds }, type: "IMAGE" }, _count: { _all: true } }),
    prisma.transaction.groupBy({
      by: ["userId"],
      where: { userId: { in: userIds }, type: "SUBSCRIPTION", status: "COMPLETED" },
      _count: { _all: true },
      _sum: { amountToman: true, coins: true },
    }),
    prisma.transaction.groupBy({
      by: ["userId"],
      where: { userId: { in: userIds }, type: "COIN_PURCHASE", status: "COMPLETED" },
      _sum: { coins: true },
    }),
    prisma.coinTransfer.groupBy({
      by: ["senderId"],
      where: { senderId: { in: userIds }, status: "COMPLETED" },
      _sum: { coins: true },
    }),
    prisma.withdrawRequest.groupBy({
      by: ["userId"],
      where: { userId: { in: userIds }, status: "APPROVED" },
      _sum: { coins: true, amountToman: true },
    }),
  ]);

  for (const r of messages) slot(r.senderId).messagesSent = r._count._all;
  for (const r of images) slot(r.senderId).imagesSent = r._count._all;
  for (const r of subscriptions) {
    const s = slot(r.userId);
    s.subscriptionCount = r._count._all;
    s.subscriptionToman = r._sum.amountToman ?? 0;
    // پرداخت اشتراک با سکه به صورت مقدار منفی ثبت می شود
    s.subscriptionCoins = Math.abs(r._sum.coins ?? 0);
  }
  for (const r of purchases) slot(r.userId).coinsPurchased = r._sum.coins ?? 0;
  for (const r of transfers) slot(r.senderId).coinsTransferred = r._sum.coins ?? 0;
  for (const r of withdrawals) {
    const s = slot(r.userId);
    s.coinsWithdrawn = r._sum.coins ?? 0;
    s.withdrawnToman = r._sum.amountToman ?? 0;
  }

  return result;
}

// آمار کامل یک کاربر برای مودال پنل ادمین (همه شاخص های قابل اندازه گیری)
export type UserDetailStats = Record<string, number>;

export async function getUserDetailStats(userId: string): Promise<UserDetailStats> {
  const pair = [{ userAId: userId }, { userBId: userId }];
  // شمارش های هم خانواده با groupBy در یک کوئری ادغام شده اند — ۳۷ کوئری به ۲۱ کوئری
  const [
    likeGroups, matches, conversations,
    messageTypeGroups, messagesReceived,
    viewGroups, storiesPosted, storyViewsReceived,
    giftGroups, referralAgg,
    reportGroups, blockGroups, ticketsOpened, adminActionsOnUser,
    coinsPurchasedAgg, transferGroups, withdrawGroups,
    subscriptionCount, boostsBought, featuredCount, notifications, logins,
  ] = await Promise.all([
    prisma.like.groupBy({
      by: ["type", "senderId", "receiverId"],
      where: { OR: [{ senderId: userId }, { receiverId: userId }] },
      _count: { _all: true },
    }),
    prisma.match.count({ where: { OR: pair } }),
    prisma.conversation.count({ where: { OR: pair } }),
    prisma.message.groupBy({
      by: ["type"],
      where: { senderId: userId },
      _count: { _all: true },
    }),
    prisma.message.count({ where: { senderId: { not: userId }, conversation: { OR: pair } } }),
    prisma.profileView.groupBy({
      by: ["viewerId", "viewedId"],
      where: { OR: [{ viewerId: userId }, { viewedId: userId }] },
      _count: { _all: true },
    }),
    prisma.story.count({ where: { userId } }),
    prisma.storyView.count({ where: { story: { userId } } }),
    prisma.giftPurchase.groupBy({
      by: ["senderId", "receiverId"],
      where: { OR: [{ senderId: userId }, { receiverId: userId }] },
      _count: { _all: true },
      _sum: { coinsPaid: true },
    }),
    prisma.referral.aggregate({
      where: { referrerId: userId },
      _count: { _all: true, paidAt: true },
    }),
    prisma.report.groupBy({
      by: ["reporterId", "reportedId"],
      where: { OR: [{ reporterId: userId }, { reportedId: userId }] },
      _count: { _all: true },
    }),
    prisma.block.groupBy({
      by: ["blockerId", "blockedId"],
      where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
      _count: { _all: true },
    }),
    prisma.ticket.count({ where: { userId } }),
    prisma.auditLog.count({ where: { targetType: "USER", targetId: userId } }),
    prisma.transaction.aggregate({ where: { userId, type: "COIN_PURCHASE", status: "COMPLETED" }, _sum: { coins: true } }),
    prisma.coinTransfer.groupBy({
      by: ["senderId", "receiverId"],
      where: { OR: [{ senderId: userId }, { receiverId: userId }], status: "COMPLETED" },
      _sum: { coins: true, fee: true },
    }),
    prisma.withdrawRequest.groupBy({
      by: ["status"],
      where: { userId },
      _count: { _all: true },
      _sum: { coins: true, amountToman: true },
    }),
    prisma.subscription.count({ where: { userId } }),
    prisma.boost.count({ where: { userId } }),
    prisma.featuredListing.count({ where: { userId } }),
    prisma.notification.count({ where: { userId } }),
    prisma.loginEvent.count({ where: { userId, kind: "LOGIN" } }),
  ]);

  let likesSent = 0, superLikesSent = 0, likesReceived = 0, superLikesReceived = 0;
  for (const g of likeGroups) {
    const sent = g.senderId === userId;
    if (g.type === "SUPER_LIKE") { if (sent) superLikesSent += g._count._all; else superLikesReceived += g._count._all; }
    else { if (sent) likesSent += g._count._all; else likesReceived += g._count._all; }
  }

  let messagesSent = 0, imagesSent = 0, voiceSent = 0, videoSent = 0;
  for (const g of messageTypeGroups) {
    messagesSent += g._count._all;
    if (g.type === "IMAGE") imagesSent = g._count._all;
    else if (g.type === "VOICE") voiceSent = g._count._all;
    else if (g.type === "VIDEO") videoSent = g._count._all;
  }

  let profileViewsGiven = 0, profileViewsReceived = 0;
  for (const g of viewGroups) {
    if (g.viewerId === userId) profileViewsGiven += g._count._all;
    if (g.viewedId === userId) profileViewsReceived += g._count._all;
  }

  let giftsSent = 0, giftsReceived = 0, giftCoinsSpent = 0;
  for (const g of giftGroups) {
    if (g.senderId === userId) { giftsSent += g._count._all; giftCoinsSpent += g._sum.coinsPaid ?? 0; }
    else giftsReceived += g._count._all;
  }

  let reportsSent = 0, reportsReceived = 0;
  for (const g of reportGroups) {
    if (g.reporterId === userId) reportsSent += g._count._all;
    else reportsReceived += g._count._all;
  }

  let blocksGiven = 0, blocksReceived = 0;
  for (const g of blockGroups) {
    if (g.blockerId === userId) blocksGiven += g._count._all;
    else blocksReceived += g._count._all;
  }

  let coinsTransferredOut = 0, coinsTransferredIn = 0, transferFeesPaid = 0;
  for (const g of transferGroups) {
    if (g.senderId === userId) {
      coinsTransferredOut += g._sum.coins ?? 0;
      transferFeesPaid += g._sum.fee ?? 0;
    } else {
      coinsTransferredIn += g._sum.coins ?? 0;
    }
  }

  let coinsWithdrawn = 0, withdrawnToman = 0, withdrawalsPending = 0;
  for (const g of withdrawGroups) {
    if (g.status === "APPROVED") {
      coinsWithdrawn = g._sum.coins ?? 0;
      withdrawnToman = g._sum.amountToman ?? 0;
    } else if (g.status === "PENDING") {
      withdrawalsPending = g._count._all;
    }
  }

  return {
    likesSent, superLikesSent, likesReceived, superLikesReceived, matches, conversations,
    messagesSent, messagesReceived, imagesSent, voiceSent, videoSent,
    profileViewsGiven, profileViewsReceived, storiesPosted, storyViewsReceived,
    giftsSent, giftsReceived, giftCoinsSpent,
    referralsInvited: referralAgg._count._all, referralsPaid: referralAgg._count.paidAt,
    reportsSent, reportsReceived, blocksGiven, blocksReceived, ticketsOpened, adminActionsOnUser,
    coinsPurchased: coinsPurchasedAgg._sum.coins ?? 0,
    coinsTransferredOut,
    coinsTransferredIn,
    transferFeesPaid,
    coinsWithdrawn,
    withdrawnToman,
    withdrawalsPending,
    subscriptionCount, boostsBought, featuredCount, notifications, logins,
  };
}
