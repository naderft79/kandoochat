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
  const [
    likesSent, superLikesSent, likesReceived, superLikesReceived, matches, conversations,
    messagesSent, messagesReceived, imagesSent, voiceSent, videoSent,
    profileViewsGiven, profileViewsReceived, storiesPosted, storyViewsReceived,
    giftsSent, giftsReceived, giftCoinsSpent,
    referralsInvited, referralsPaid,
    reportsSent, reportsReceived, blocksGiven, blocksReceived, ticketsOpened, adminActionsOnUser,
    coinsPurchasedAgg, coinsOutAgg, coinsInAgg, feesAgg, withdrawnAgg, withdrawalsPending,
    subscriptionCount, boostsBought, featuredCount, notifications, logins,
  ] = await Promise.all([
    prisma.like.count({ where: { senderId: userId, type: "LIKE" } }),
    prisma.like.count({ where: { senderId: userId, type: "SUPER_LIKE" } }),
    prisma.like.count({ where: { receiverId: userId, type: "LIKE" } }),
    prisma.like.count({ where: { receiverId: userId, type: "SUPER_LIKE" } }),
    prisma.match.count({ where: { OR: pair } }),
    prisma.conversation.count({ where: { OR: pair } }),
    prisma.message.count({ where: { senderId: userId } }),
    prisma.message.count({ where: { senderId: { not: userId }, conversation: { OR: pair } } }),
    prisma.message.count({ where: { senderId: userId, type: "IMAGE" } }),
    prisma.message.count({ where: { senderId: userId, type: "VOICE" } }),
    prisma.message.count({ where: { senderId: userId, type: "VIDEO" } }),
    prisma.profileView.count({ where: { viewerId: userId } }),
    prisma.profileView.count({ where: { viewedId: userId } }),
    prisma.story.count({ where: { userId } }),
    prisma.storyView.count({ where: { story: { userId } } }),
    prisma.giftPurchase.count({ where: { senderId: userId } }),
    prisma.giftPurchase.count({ where: { receiverId: userId } }),
    prisma.giftPurchase.aggregate({ where: { senderId: userId }, _sum: { coinsPaid: true } }),
    prisma.referral.count({ where: { referrerId: userId } }),
    prisma.referral.count({ where: { referrerId: userId, paidAt: { not: null } } }),
    prisma.report.count({ where: { reporterId: userId } }),
    prisma.report.count({ where: { reportedId: userId } }),
    prisma.block.count({ where: { blockerId: userId } }),
    prisma.block.count({ where: { blockedId: userId } }),
    prisma.ticket.count({ where: { userId } }),
    prisma.auditLog.count({ where: { targetType: "USER", targetId: userId } }),
    prisma.transaction.aggregate({ where: { userId, type: "COIN_PURCHASE", status: "COMPLETED" }, _sum: { coins: true } }),
    prisma.coinTransfer.aggregate({ where: { senderId: userId, status: "COMPLETED" }, _sum: { coins: true } }),
    prisma.coinTransfer.aggregate({ where: { receiverId: userId, status: "COMPLETED" }, _sum: { coins: true } }),
    prisma.coinTransfer.aggregate({ where: { senderId: userId, status: "COMPLETED" }, _sum: { fee: true } }),
    prisma.withdrawRequest.aggregate({ where: { userId, status: "APPROVED" }, _sum: { coins: true, amountToman: true } }),
    prisma.withdrawRequest.count({ where: { userId, status: "PENDING" } }),
    prisma.subscription.count({ where: { userId } }),
    prisma.boost.count({ where: { userId } }),
    prisma.featuredListing.count({ where: { userId } }),
    prisma.notification.count({ where: { userId } }),
    prisma.loginEvent.count({ where: { userId, kind: "LOGIN" } }),
  ]);

  return {
    likesSent, superLikesSent, likesReceived, superLikesReceived, matches, conversations,
    messagesSent, messagesReceived, imagesSent, voiceSent, videoSent,
    profileViewsGiven, profileViewsReceived, storiesPosted, storyViewsReceived,
    giftsSent, giftsReceived, giftCoinsSpent: giftCoinsSpent._sum.coinsPaid ?? 0,
    referralsInvited, referralsPaid,
    reportsSent, reportsReceived, blocksGiven, blocksReceived, ticketsOpened, adminActionsOnUser,
    coinsPurchased: coinsPurchasedAgg._sum.coins ?? 0,
    coinsTransferredOut: coinsOutAgg._sum.coins ?? 0,
    coinsTransferredIn: coinsInAgg._sum.coins ?? 0,
    transferFeesPaid: feesAgg._sum.fee ?? 0,
    coinsWithdrawn: withdrawnAgg._sum.coins ?? 0,
    withdrawnToman: withdrawnAgg._sum.amountToman ?? 0,
    withdrawalsPending,
    subscriptionCount, boostsBought, featuredCount, notifications, logins,
  };
}
