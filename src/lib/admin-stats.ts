// شاخص های آماری پنل ادمین — همه محاسبات در سرور و با کوئری های تجمیعی (count/aggregate)
// خروجی: گروه های شاخص + سری روزانه برای نمودار (۱۴ روز اخیر)
import { prisma } from "@/lib/prisma";

export type KpiFormat = "number" | "toman" | "coins" | "percent";
export type Kpi = { key: string; label: string; value: number; format: KpiFormat };
export type KpiGroup = { title: string; kpis: Kpi[] };
export type DailyPoint = { day: string; users: number; revenueToman: number };
export type AdminStats = { generatedAt: string; groups: KpiGroup[]; daily: DailyPoint[] };

const DAY = 24 * 60 * 60 * 1000;

function startOfToday(now: Date) {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function getAdminStats(): Promise<AdminStats> {
  const now = new Date();
  const today = startOfToday(now);
  const day1 = new Date(now.getTime() - DAY);
  const day7 = new Date(now.getTime() - 7 * DAY);
  const day30 = new Date(now.getTime() - 30 * DAY);
  const day14 = new Date(now.getTime() - 14 * DAY);
  const in7 = new Date(now.getTime() + 7 * DAY);
  // فیلتر کاربر واقعی — حساب های فیک (ربات) در هیچ آماری محاسبه نمی شوند
  const real = { isFake: false } as const;
  const user = { role: "USER", isFake: false } as const;
  const purchase = { type: "COIN_PURCHASE", status: "COMPLETED", user: real } as const;

  const [
    totalUsers, newToday, new7, new30, active24, online, phoneVerified, blueTick, identityVerified,
    special, inactive, fake,
    likesToday, likesTotal, superLikes, matchesTotal, matchesToday, conversations, messagesTotal, messagesToday,
    conversationsToday, profileViewsToday, profileViewsTotal, storiesActive, storyViews24, giftsTotal, gifts7, openReports, blocks,
    purchasesCount, purchaseSum, purchaseToday, purchase30, coinsSold, withdrawPending, withdrawPendingSum, withdrawApprovedSum30,
    transfers, transferFees, walletAgg, paymentsPending, transactionsToday,
    subsActive, subsToday, subs30, subsExpiring, boostsActive, boosts30, featuredPending, featuredActive,
    verifyPending, verifyBlue, verifyKyc, verifyApproved7, verifyRejected7,
    photosPending, storiesPending, ticketsOpen, ticketsAnswered,
    auditDay, botLogsDay, botSentToday, notifDay,
    newUsersDaily, purchasesDaily,
  ] = await Promise.all([
    prisma.user.count({ where: user }),
    prisma.user.count({ where: { ...user, createdAt: { gte: today } } }),
    prisma.user.count({ where: { ...user, createdAt: { gte: day7 } } }),
    prisma.user.count({ where: { ...user, createdAt: { gte: day30 } } }),
    prisma.user.count({ where: { ...user, lastSeen: { gte: day1 } } }),
    prisma.user.count({ where: { ...user, isOnline: true } }),
    prisma.user.count({ where: { ...user, phoneVerified: true } }),
    prisma.user.count({ where: { ...user, isVerified: true } }),
    prisma.user.count({ where: { ...user, isIdentityVerified: true } }),
    prisma.user.count({ where: { ...user, isSpecial: true } }),
    prisma.user.count({ where: { ...user, isActive: false } }),
    prisma.user.count({ where: { isFake: true } }),

    prisma.like.count({ where: { type: "LIKE", createdAt: { gte: today }, sender: real } }),
    prisma.like.count({ where: { type: "LIKE", sender: real } }),
    prisma.like.count({ where: { type: "SUPER_LIKE", sender: real } }),
    prisma.match.count({ where: { userA: real, userB: real } }),
    prisma.match.count({ where: { createdAt: { gte: today }, userA: real, userB: real } }),
    prisma.conversation.count({ where: { userA: real, userB: real } }),
    prisma.message.count({ where: { sender: real } }),
    prisma.message.count({ where: { createdAt: { gte: today }, sender: real } }),
    prisma.conversation.count({ where: { updatedAt: { gte: today }, userA: real, userB: real } }),
    prisma.profileView.count({ where: { createdAt: { gte: today }, viewer: real, viewed: real } }),
    prisma.profileView.count({ where: { viewer: real, viewed: real } }),
    prisma.story.count({ where: { isApproved: true, isRejected: false, expiresAt: { gt: now }, user: real } }),
    prisma.storyView.count({ where: { createdAt: { gte: day1 }, viewer: real, story: { user: real } } }),
    prisma.giftPurchase.count({ where: { sender: real } }),
    prisma.giftPurchase.count({ where: { createdAt: { gte: day7 }, sender: real } }),
    prisma.report.count({ where: { status: "PENDING", reporter: real } }),
    prisma.block.count({ where: { blocker: real } }),

    prisma.transaction.count({ where: purchase }),
    prisma.transaction.aggregate({ where: purchase, _sum: { amountToman: true } }),
    prisma.transaction.aggregate({ where: { ...purchase, createdAt: { gte: today } }, _sum: { amountToman: true } }),
    prisma.transaction.aggregate({ where: { ...purchase, createdAt: { gte: day30 } }, _sum: { amountToman: true } }),
    prisma.transaction.aggregate({ where: purchase, _sum: { coins: true } }),
    prisma.withdrawRequest.count({ where: { status: "PENDING", user: real } }),
    prisma.withdrawRequest.aggregate({ where: { status: "PENDING", user: real }, _sum: { amountToman: true } }),
    prisma.withdrawRequest.aggregate({ where: { status: "APPROVED", processedAt: { gte: day30 }, user: real }, _sum: { amountToman: true } }),
    prisma.coinTransfer.count({ where: { sender: real } }),
    prisma.coinTransfer.aggregate({ where: { sender: real }, _sum: { fee: true } }),
    prisma.wallet.aggregate({ where: { user: real }, _sum: { balance: true } }),
    prisma.paymentRequest.count({ where: { status: "PENDING", user: real } }),
    prisma.transaction.count({ where: { createdAt: { gte: today }, user: real } }),

    prisma.subscription.count({ where: { endsAt: { gt: now }, user: real } }),
    prisma.subscription.count({ where: { createdAt: { gte: today }, user: real } }),
    prisma.subscription.count({ where: { createdAt: { gte: day30 }, user: real } }),
    prisma.subscription.count({ where: { endsAt: { gt: now, lte: in7 }, user: real } }),
    prisma.boost.count({ where: { endsAt: { gt: now }, user: real } }),
    prisma.boost.count({ where: { startsAt: { gte: day30 }, user: real } }),
    prisma.featuredListing.count({ where: { status: "PENDING", user: real } }),
    prisma.featuredListing.count({ where: { status: "APPROVED", user: real } }),

    prisma.verificationRequest.count({ where: { status: "PENDING", user: real } }),
    prisma.verificationRequest.count({ where: { status: "PENDING", kind: "BLUE_TICK", user: real } }),
    prisma.verificationRequest.count({ where: { status: "PENDING", kind: "KYC", user: real } }),
    prisma.verificationRequest.count({ where: { status: "APPROVED", reviewedAt: { gte: day7 }, user: real } }),
    prisma.verificationRequest.count({ where: { status: "REJECTED", reviewedAt: { gte: day7 }, user: real } }),
    prisma.profilePhoto.count({ where: { isVerified: false, isRejected: false, isDeletedByUser: false, user: real } }),
    prisma.story.count({ where: { isApproved: false, isRejected: false, isDeletedByUser: false, user: real } }),
    // تیکت های مهمان (user null) حفظ می شوند — فقط تیکت کاربران فیک حذف می شود
    prisma.ticket.count({ where: { status: "OPEN", NOT: { user: { isFake: true } } } }),
    prisma.ticket.count({ where: { status: "ANSWERED", NOT: { user: { isFake: true } } } }),

    prisma.auditLog.count({ where: { createdAt: { gte: day1 } } }),
    prisma.botLog.count({ where: { createdAt: { gte: day1 } } }),
    prisma.botLog.count({ where: { createdAt: { gte: today }, status: "SENT" } }),
    prisma.notification.count({ where: { createdAt: { gte: day1 }, user: real } }),

    prisma.user.findMany({ where: { ...user, createdAt: { gte: day14 } }, select: { createdAt: true } }),
    prisma.transaction.findMany({ where: { ...purchase, createdAt: { gte: day14 } }, select: { createdAt: true, amountToman: true } }),
  ]);

  const toman = (v: { _sum: { amountToman: number | null } }) => v._sum.amountToman ?? 0;
  const coins = (v: { _sum: { coins: number | null } }) => v._sum.coins ?? 0;

  const groups: KpiGroup[] = [
    {
      title: "کاربران",
      kpis: [
        { key: "total", label: "کل کاربران", value: totalUsers, format: "number" },
        { key: "newToday", label: "ثبت نام امروز", value: newToday, format: "number" },
        { key: "new7", label: "ثبت نام ۷ روز", value: new7, format: "number" },
        { key: "new30", label: "ثبت نام ۳۰ روز", value: new30, format: "number" },
        { key: "active24", label: "فعال ۲۴ ساعت", value: active24, format: "number" },
        { key: "online", label: "آنلاین الان", value: online, format: "number" },
        { key: "phoneVerified", label: "موبایل تایید شده", value: phoneVerified, format: "number" },
        { key: "blueTick", label: "تیک آبی", value: blueTick, format: "number" },
        { key: "identity", label: "احراز کامل", value: identityVerified, format: "number" },
        { key: "special", label: "کاربر ویژه", value: special, format: "number" },
        { key: "inactive", label: "مسدود", value: inactive, format: "number" },
        { key: "fake", label: "حساب ربات (فیک)", value: fake, format: "number" },
      ],
    },
    {
      title: "تعامل",
      kpis: [
        { key: "likesToday", label: "لایک امروز", value: likesToday, format: "number" },
        { key: "likesTotal", label: "کل لایک‌ها", value: likesTotal, format: "number" },
        { key: "superLikes", label: "سوپرلایک", value: superLikes, format: "number" },
        { key: "matches", label: "کل مچ", value: matchesTotal, format: "number" },
        { key: "matchesToday", label: "مچ امروز", value: matchesToday, format: "number" },
        { key: "conversations", label: "کل گفتگوها", value: conversations, format: "number" },
        { key: "convToday", label: "گفتگوی فعال امروز", value: conversationsToday, format: "number" },
        { key: "messages", label: "کل پیام‌ها", value: messagesTotal, format: "number" },
        { key: "messagesToday", label: "پیام امروز", value: messagesToday, format: "number" },
        { key: "viewsToday", label: "بازدید پروفایل امروز", value: profileViewsToday, format: "number" },
        { key: "viewsTotal", label: "کل بازدید پروفایل", value: profileViewsTotal, format: "number" },
        { key: "storiesActive", label: "استوری فعال", value: storiesActive, format: "number" },
        { key: "storyViews24", label: "بازدید استوری ۲۴ ساعت", value: storyViews24, format: "number" },
        { key: "gifts", label: "کل هدیه‌ها", value: giftsTotal, format: "number" },
        { key: "gifts7", label: "هدیه ۷ روز", value: gifts7, format: "number" },
        { key: "blocks", label: "کل بلاک‌ها", value: blocks, format: "number" },
      ],
    },
    {
      title: "مالی",
      kpis: [
        { key: "purchases", label: "خرید سکه (تعداد)", value: purchasesCount, format: "number" },
        { key: "revenueTotal", label: "درآمد کل خرید", value: toman(purchaseSum), format: "toman" },
        { key: "revenueToday", label: "درآمد امروز", value: toman(purchaseToday), format: "toman" },
        { key: "revenue30", label: "درآمد ۳۰ روز", value: toman(purchase30), format: "toman" },
        { key: "coinsSold", label: "سکه فروخته شده", value: coins(coinsSold), format: "coins" },
        { key: "withdrawPending", label: "برداشت در انتظار", value: withdrawPending, format: "number" },
        { key: "withdrawPendingSum", label: "مبلغ برداشت در انتظار", value: toman(withdrawPendingSum), format: "toman" },
        { key: "withdrawPaid30", label: "برداشت پرداخت شده ۳۰ روز", value: toman(withdrawApprovedSum30), format: "toman" },
        { key: "transfers", label: "انتقال سکه (کل)", value: transfers, format: "number" },
        { key: "transferFees", label: "کارمزد انتقال", value: transferFees._sum.fee ?? 0, format: "coins" },
        { key: "walletCoins", label: "مانده کل کیف پول‌ها", value: walletAgg._sum.balance ?? 0, format: "coins" },
        { key: "paymentsPending", label: "پرداخت باز", value: paymentsPending, format: "number" },
        { key: "transactionsToday", label: "تراکنش امروز", value: transactionsToday, format: "number" },
      ],
    },
    {
      title: "اشتراک و رشد",
      kpis: [
        { key: "subsActive", label: "اشتراک فعال", value: subsActive, format: "number" },
        { key: "subsToday", label: "اشتراک جدید امروز", value: subsToday, format: "number" },
        { key: "subs30", label: "اشتراک جدید ۳۰ روز", value: subs30, format: "number" },
        { key: "subsExpiring", label: "انقضا در ۷ روز", value: subsExpiring, format: "number" },
        { key: "boostsActive", label: "بوست فعال", value: boostsActive, format: "number" },
        { key: "boosts30", label: "بوست خریداری شده ۳۰ روز", value: boosts30, format: "number" },
        { key: "featuredPending", label: "بخش ویژه در انتظار", value: featuredPending, format: "number" },
        { key: "featuredActive", label: "بخش ویژه فعال", value: featuredActive, format: "number" },
      ],
    },
    {
      title: "نظارت و پشتیبانی",
      kpis: [
        { key: "verifyPending", label: "احراز در انتظار", value: verifyPending, format: "number" },
        { key: "verifyBlue", label: "تیک آبی در انتظار", value: verifyBlue, format: "number" },
        { key: "verifyKyc", label: "احراز کامل در انتظار", value: verifyKyc, format: "number" },
        { key: "verifyApproved7", label: "تایید احراز ۷ روز", value: verifyApproved7, format: "number" },
        { key: "verifyRejected7", label: "رد احراز ۷ روز", value: verifyRejected7, format: "number" },
        { key: "photosPending", label: "عکس در انتظار تایید", value: photosPending, format: "number" },
        { key: "storiesPending", label: "استوری در انتظار تایید", value: storiesPending, format: "number" },
        { key: "reportsOpen", label: "گزارش باز", value: openReports, format: "number" },
        { key: "ticketsOpen", label: "تیکت باز", value: ticketsOpen, format: "number" },
        { key: "ticketsAnswered", label: "تیکت پاسخ داده شده", value: ticketsAnswered, format: "number" },
      ],
    },
    {
      title: "سیستم و ربات",
      kpis: [
        { key: "audit24", label: "اقدام ادمین ۲۴ ساعت", value: auditDay, format: "number" },
        { key: "botLogs24", label: "رویداد ربات ۲۴ ساعت", value: botLogsDay, format: "number" },
        { key: "botSentToday", label: "پیام ربات امروز", value: botSentToday, format: "number" },
        { key: "notifications24", label: "اعلان ۲۴ ساعت", value: notifDay, format: "number" },
        { key: "conversionPaid", label: "کاربران خریدار (نسبت)", value: totalUsers ? Math.round((purchasesCount / totalUsers) * 1000) / 10 : 0, format: "percent" },
        { key: "activeRate", label: "نرخ فعالیت ۲۴ ساعت", value: totalUsers ? Math.round((active24 / totalUsers) * 1000) / 10 : 0, format: "percent" },
      ],
    },
  ];

  // سری ۱۴ روزه: ثبت نام و درآمد در هر روز (سمت سرور گروه بندی می شود)
  const dayKey = (d: Date) => d.toISOString().slice(0, 10);
  const daily: DailyPoint[] = [];
  for (let i = 13; i >= 0; i--) {
    daily.push({ day: dayKey(new Date(now.getTime() - i * DAY)), users: 0, revenueToman: 0 });
  }
  const index = new Map(daily.map((p, i) => [p.day, i]));
  for (const u of newUsersDaily) {
    const i = index.get(dayKey(u.createdAt));
    if (i !== undefined) daily[i].users += 1;
  }
  for (const t of purchasesDaily) {
    const i = index.get(dayKey(t.createdAt));
    if (i !== undefined) daily[i].revenueToman += t.amountToman;
  }

  return { generatedAt: now.toISOString(), groups, daily };
}
