// API هشدارهای الزامی برای داشبورد ادمین — ۴۸ بنر
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, AuthError } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 86400000);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // فیلتر کاربر واقعی: نه فیک، نه همراه AI، نه حذف شده
    const realUser = { isFake: false, isAICompanion: false, deletedAt: null } as const;
    // فیلتر کاربر واقعی با نقش USER — برای شمارش مستقیم جدول کاربر
    const realUserOnly = { role: "USER", ...realUser } as const;
    // انواع تراکنشی که درآمد ریالی محسوب می شوند
    const revenueTypes = ["SUBSCRIPTION", "COIN_PURCHASE"] as const;

    const [
      pendingVerifications,
      pendingProfilePhotos,
      pendingGalleryPhotos,
      unverifiedUsers,
      pendingStories,
      pendingWithdrawals,
      pendingReports,
      pendingCoinRequests,
      pendingPayments,
      failedPayments,
      rejectedPhotos,
      inactiveUsers,
      rejectedVerifications,
      reviewedReports,
      actionedReports,
      approvedWithdrawals,
      rejectedWithdrawals,
      expiredSubs,
      activeBoosts,
      specialUsers,
      onlineUsers,
      activeStories,
      activeSubs,
      pendingCoinTransferCount,
      totalUsers,
      verifiedUsers,
      todayMessages,
      todayLikes,
      totalTransactions,
      totalCoinsInCirculation,
      totalReferrals,
      activeMissions,
      activeStreaks,
      totalInterests,
      todayProfileViews,
      todayAuditLogs,
      todayRevenue,
      weekRevenue,
      todaySubscriptions,
      totalWithdrawals,
      avgCoinsPerUser,
      todayTransactions,
      openTickets,
      answeredTickets,
      highPriorityTickets,
      closedTickets,
      todayTickets,
      unansweredTickets,
    ] = await Promise.all([
      prisma.verificationRequest.count({ where: { status: "PENDING", user: realUserOnly } }),
      prisma.profilePhoto.count({ where: { isVerified: false, isRejected: false, isDeletedByUser: false, isProfile: true, user: realUser } }),
      prisma.profilePhoto.count({ where: { isVerified: false, isRejected: false, isDeletedByUser: false, isProfile: false, user: realUser } }),
      prisma.user.count({ where: { ...realUserOnly, isVerified: false, isActive: true } }),
      prisma.story.count({ where: { isApproved: false, isRejected: false, isDeletedByUser: false, expiresAt: { gt: now }, user: realUser } }),
      prisma.withdrawRequest.count({ where: { user: realUser, status: "PENDING" } }),
      prisma.report.count({ where: { reporter: realUser, status: "PENDING" } }),
      prisma.coinTransfer.count({ where: { type: "REQUEST", status: "PENDING", sender: realUser } }),
      prisma.paymentRequest.count({ where: { user: realUser, status: "PENDING" } }),
      prisma.paymentRequest.count({ where: { user: realUser, status: "FAILED" } }),
      prisma.profilePhoto.count({ where: { isRejected: true, isDeletedByUser: false, user: realUser } }),
      prisma.user.count({ where: { ...realUserOnly, isActive: false } }),
      prisma.verificationRequest.count({ where: { status: "REJECTED", user: realUserOnly } }),
      prisma.report.count({ where: { reporter: realUser, status: "REVIEWED" } }),
      prisma.report.count({ where: { reporter: realUser, status: "ACTIONED" } }),
      prisma.withdrawRequest.count({ where: { user: realUser, status: "APPROVED" } }),
      prisma.withdrawRequest.count({ where: { user: realUser, status: "REJECTED" } }),
      prisma.subscription.count({ where: { endsAt: { lt: now, gt: weekAgo }, user: realUser } }),
      prisma.boost.count({ where: { endsAt: { gt: now }, user: realUser } }),
      prisma.user.count({ where: { ...realUserOnly, isSpecial: true } }),
      // آنلاین واقعی: پرچم isOnline + قلب تپنده در ۳ دقیقه اخیر (کاربرانی که با قطع ناگهانی اینترنت رفته اند گیر نمی کنند)
      prisma.user.count({ where: { ...realUserOnly, isOnline: true, lastSeen: { gte: new Date(now.getTime() - 3 * 60 * 1000) } } }),
      prisma.story.count({ where: { isApproved: true, isRejected: false, isDeletedByUser: false, expiresAt: { gt: now }, user: realUser } }),
      prisma.subscription.count({ where: { endsAt: { gt: now }, user: realUser } }),
      // انتقال های موفق امروز — GIFT ها همیشه COMPLETED ثبت می شوند و PENDING واقعی ندارند
      prisma.coinTransfer.count({ where: { status: "COMPLETED", createdAt: { gte: todayStart }, sender: realUser } }),
      prisma.user.count({ where: realUserOnly }),
      prisma.user.count({ where: { ...realUserOnly, isVerified: true } }),
      prisma.message.count({ where: { createdAt: { gte: todayStart }, sender: realUser } }),
      prisma.like.count({ where: { createdAt: { gte: todayStart }, sender: realUser } }),
      prisma.transaction.count({ where: { user: realUser } }),
      prisma.wallet.aggregate({ where: { user: realUserOnly }, _sum: { balance: true } }),
      prisma.referral.count({ where: { referrer: realUser, referred: realUser } }),
      prisma.mission.count({ where: { isActive: true } }),
      prisma.streak.count({ where: { count: { gte: 3 }, user: realUser } }),
      prisma.interest.count(),
      prisma.profileView.count({ where: { createdAt: { gte: todayStart }, viewer: realUser, viewed: realUser } }),
      prisma.auditLog.count({ where: { createdAt: { gte: todayStart } } }),
      // مالی
      prisma.transaction.aggregate({ where: { type: { in: [...revenueTypes] }, status: "COMPLETED", createdAt: { gte: todayStart }, user: realUser }, _sum: { amountToman: true } }),
      prisma.transaction.aggregate({ where: { type: { in: [...revenueTypes] }, status: "COMPLETED", createdAt: { gte: weekAgo }, user: realUser }, _sum: { amountToman: true } }),
      prisma.subscription.count({ where: { createdAt: { gte: todayStart }, user: realUser } }),
      prisma.withdrawRequest.count({ where: { user: realUser } }),
      prisma.wallet.aggregate({ where: { user: realUserOnly }, _avg: { balance: true } }),
      prisma.transaction.count({ where: { createdAt: { gte: todayStart }, user: realUser } }),
      // تیکت — مهمان ها (user=null) حفظ می شوند؛ فقط فیک/AI/حذف شده حذف می شوند
      prisma.ticket.count({ where: { status: "OPEN", OR: [{ user: null }, { user: realUser }] } }),
      prisma.ticket.count({ where: { status: "ANSWERED", OR: [{ user: null }, { user: realUser }] } }),
      prisma.ticket.count({ where: { priority: "HIGH", status: { not: "CLOSED" }, OR: [{ user: null }, { user: realUser }] } }),
      prisma.ticket.count({ where: { status: "CLOSED", OR: [{ user: null }, { user: realUser }] } }),
      prisma.ticket.count({ where: { createdAt: { gte: todayStart }, OR: [{ user: null }, { user: realUser }] } }),
      prisma.ticket.count({ where: { status: "OPEN", messages: { none: { isFromAdmin: true } }, OR: [{ user: null }, { user: realUser }] } }),
    ]);

    const alerts = [
      { label: "احراز هویت در انتظار", count: pendingVerifications, href: "/admin/verify", icon: "verify", color: "#6366f1" },
      { label: "عکس پروفایل در انتظار", count: pendingProfilePhotos, href: "/admin/photos", icon: "profile", color: "#ec4899" },
      { label: "عکس گالری در انتظار", count: pendingGalleryPhotos, href: "/admin/photos", icon: "gallery", color: "#f59e0b" },
      { label: "کاربران تایید نشده", count: unverifiedUsers, href: "/admin/users", icon: "users", color: "#10b981" },
      { label: "استوری در انتظار تایید", count: pendingStories, href: "/admin/stories", icon: "stories", color: "#a855f7" },
      { label: "درخواست برداشت", count: pendingWithdrawals, href: "/admin/finance", icon: "withdrawals", color: "#ef4444" },
      { label: "گزارش تخلف", count: pendingReports, href: "/admin/reports", icon: "reports", color: "#f43f5e" },
      { label: "درخواست سکه", count: pendingCoinRequests, href: "/admin/finance", icon: "coins", color: "#06b6d4" },
      { label: "پرداخت در انتظار", count: pendingPayments, href: "/admin/finance", icon: "payment", color: "#8b5cf6" },
      { label: "پرداخت ناموفق", count: failedPayments, href: "/admin/finance", icon: "failed", color: "#dc2626" },
      { label: "عکس رد شده", count: rejectedPhotos, href: "/admin/photos", icon: "rejected", color: "#b91c1c" },
      { label: "کاربران غیرفعال", count: inactiveUsers, href: "/admin/users", icon: "inactive", color: "#64748b" },
      { label: "احراز هویت رد شده", count: rejectedVerifications, href: "/admin/verify", icon: "rejectedVerify", color: "#be123c" },
      { label: "گزارش بررسی شده", count: reviewedReports, href: "/admin/reports", icon: "reviewed", color: "#0891b2" },
      { label: "گزارش اقدام شده", count: actionedReports, href: "/admin/reports", icon: "actioned", color: "#15803d" },
      { label: "برداشت تایید شده", count: approvedWithdrawals, href: "/admin/finance", icon: "approved", color: "#16a34a" },
      { label: "برداشت رد شده", count: rejectedWithdrawals, href: "/admin/finance", icon: "rejectedWithdraw", color: "#991b1b" },
      { label: "اشتراک منقضی (هفته اخیر)", count: expiredSubs, href: "/admin/finance", icon: "expiredSub", color: "#ca8a04" },
      { label: "بوست فعال", count: activeBoosts, href: "/admin/boosts", icon: "boost", color: "#ea580c" },
      { label: "کاربران ویژه", count: specialUsers, href: "/admin/users", icon: "special", color: "#7c3aed" },
      { label: "کاربران آنلاین", count: onlineUsers, href: "/admin/users", icon: "online", color: "#0ea5e9" },
      { label: "استوری فعال", count: activeStories, href: "/admin/stories", icon: "activeStory", color: "#c026d3" },
      { label: "اشتراک فعال", count: activeSubs, href: "/admin/finance", icon: "activeSub", color: "#4f46e5" },
      { label: "انتقال سکه امروز", count: pendingCoinTransferCount, href: "/admin/finance", icon: "pendingTransfer", color: "#0d9488" },
      { label: "کل کاربران", count: totalUsers, href: "/admin/users", icon: "totalUsers", color: "#2563eb" },
      { label: "کاربران تایید شده", count: verifiedUsers, href: "/admin/users", icon: "verifiedUsers", color: "#059669" },
      { label: "پیام های امروز", count: todayMessages, href: "/admin/analytics", icon: "todayMsg", color: "#db2777" },
      { label: "لایک های امروز", count: todayLikes, href: "/admin/analytics", icon: "todayLike", color: "#e11d48" },
      { label: "کل تراکنش ها", count: totalTransactions, href: "/admin/finance", icon: "totalTx", color: "#713f12" },
      { label: "سکه در گردش", count: totalCoinsInCirculation._sum.balance ?? 0, href: "/admin/finance", icon: "circulating", color: "#0f766e" },
      { label: "دعوت دوستان", count: totalReferrals, href: "/admin/users", icon: "referral", color: "#9333ea" },
      { label: "ماموریت های فعال", count: activeMissions, href: "/admin/missions", icon: "mission", color: "#f97316" },
      { label: "استریک فعال (۳+)", count: activeStreaks, href: "/admin/analytics", icon: "streak", color: "#facc15" },
      { label: "علاقه مندی ها", count: totalInterests, href: "/admin/interests", icon: "interest", color: "#c026d3" },
      { label: "بازدید پروفایل امروز", count: todayProfileViews, href: "/admin/analytics", icon: "profileView", color: "#0369a1" },
      { label: "لاگ اقدامات امروز", count: todayAuditLogs, href: "/admin/audit", icon: "audit", color: "#44403c" },
      // بنرهای مالی
      { label: "درآمد امروز", count: todayRevenue._sum.amountToman ?? 0, href: "/admin/finance", icon: "todayRevenue", color: "#059669" },
      { label: "درآمد هفته", count: weekRevenue._sum.amountToman ?? 0, href: "/admin/finance", icon: "weekRevenue", color: "#047857" },
      { label: "اشتراک های امروز", count: todaySubscriptions, href: "/admin/finance", icon: "todaySub", color: "#7c3aed" },
      { label: "کل برداشت ها", count: totalWithdrawals, href: "/admin/finance", icon: "totalWithdraw", color: "#b91c1c" },
      { label: "میانگین سکه کاربر", count: Math.round(avgCoinsPerUser._avg.balance ?? 0), href: "/admin/finance", icon: "avgCoins", color: "#0891b2" },
      { label: "تراکنش های امروز", count: todayTransactions, href: "/admin/finance", icon: "todayTx", color: "#4338ca" },
      // بنرهای تیکت
      { label: "تیکت باز", count: openTickets, href: "/admin/tickets", icon: "openTicket", color: "#3b82f6" },
      { label: "تیکت پاسخ داده شده", count: answeredTickets, href: "/admin/tickets", icon: "answeredTicket", color: "#10b981" },
      { label: "تیکت اولویت بالا", count: highPriorityTickets, href: "/admin/tickets", icon: "highPriority", color: "#ef4444" },
      { label: "تیکت بسته شده", count: closedTickets, href: "/admin/tickets", icon: "closedTicket", color: "#64748b" },
      { label: "تیکت های امروز", count: todayTickets, href: "/admin/tickets", icon: "todayTicket", color: "#8b5cf6" },
      { label: "تیکت بدون پاسخ", count: unansweredTickets, href: "/admin/tickets", icon: "unansweredTicket", color: "#f59e0b" },
    ];

    return NextResponse.json({ alerts });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[admin alerts] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
