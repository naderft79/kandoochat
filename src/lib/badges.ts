// محاسبه نشان های پروفایل (badges)
import { prisma } from "@/lib/prisma";

export type Badge = {
  key: string;
  label: string;
  icon: string;
  color: string;
};

export const BADGE_DEFINITIONS: Record<string, Badge> = {
  VERIFIED: { key: "VERIFIED", label: "تایید شده", icon: "badge-check", color: "text-blue-500" },
  PHONE_VERIFIED: { key: "PHONE_VERIFIED", label: "موبایل تایید شده", icon: "phone", color: "text-green-500" },
  PROFILE_COMPLETE: { key: "PROFILE_COMPLETE", label: "پروفایل کامل", icon: "check-circle", color: "text-purple-500" },
  FIRST_CHAT: { key: "FIRST_CHAT", label: "اولین چت", icon: "message-circle", color: "text-pink-500" },
  TEN_LIKES: { key: "TEN_LIKES", label: "محبوب (۱۰ لایک)", icon: "heart", color: "text-red-500" },
  THIRTY_DAYS: { key: "THIRTY_DAYS", label: "۳۰ روز فعال", icon: "calendar", color: "text-orange-500" },
  TOP_GIFTER: { key: "TOP_GIFTER", label: "هدیه دهنده برتر", icon: "gift", color: "text-yellow-500" },
  BOOST_USER: { key: "BOOST_USER", label: "بوست فعال", icon: "rocket", color: "text-indigo-500" },
};

// محاسبه نشان های کاربر
export async function getUserBadges(userId: string): Promise<Badge[]> {
  const badges: Badge[] = [];

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      sentMessages: { take: 1, select: { id: true } },
      receivedLikes: { where: { type: "LIKE" }, select: { id: true } },
      boosts: { where: { endsAt: { gt: new Date() } }, take: 1, select: { id: true } },
    },
  });

  if (!user) return badges;

  if (user.isVerified) badges.push(BADGE_DEFINITIONS.VERIFIED);
  if (user.phoneVerified) badges.push(BADGE_DEFINITIONS.PHONE_VERIFIED);

  // درصد تکمیل پروفایل
  const completion = calculateProfileCompletion(user);
  if (completion >= 90) badges.push(BADGE_DEFINITIONS.PROFILE_COMPLETE);

  // اولین چت
  if (user.sentMessages.length > 0) badges.push(BADGE_DEFINITIONS.FIRST_CHAT);

  // ۱۰ لایک دریافتی
  if (user.receivedLikes.length >= 10) badges.push(BADGE_DEFINITIONS.TEN_LIKES);

  // ۳۰ روز فعال
  const daysActive = Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24));
  if (daysActive >= 30) badges.push(BADGE_DEFINITIONS.THIRTY_DAYS);

  // بوست فعال
  if (user.boosts.length > 0) badges.push(BADGE_DEFINITIONS.BOOST_USER);

  // هدیه دهنده برتر (بیشترین انتقال در ماه جاری)
  const monthAgo = new Date();
  monthAgo.setMonth(monthAgo.getMonth() - 1);
  const topGifterCount = await prisma.coinTransfer.aggregate({
    where: { senderId: userId, type: "GIFT", createdAt: { gte: monthAgo } },
    _sum: { coins: true },
  });
  if ((topGifterCount._sum.coins ?? 0) >= 100) {
    badges.push(BADGE_DEFINITIONS.TOP_GIFTER);
  }

  return badges;
}

// محاسبه درصد تکمیل پروفایل
export function calculateProfileCompletion(user: {
  bio: string | null;
  job: string | null;
  phoneVerified: boolean;
}): number {
  const fields = [
    !!user.bio,
    !!user.job,
    user.phoneVerified,
  ];
  const filled = fields.filter(Boolean).length;
  return Math.round((filled / fields.length) * 100);
}

// برچسب فارسی بخش هایی که هنوز تکمیل نشده اند — زیر نوار تکمیل پروفایل نمایش داده می شود
export function missingProfileItems(user: {
  bio: string | null;
  job: string | null;
  phoneVerified: boolean;
}): string[] {
  const missing: string[] = [];
  if (!user.bio) missing.push("درباره من");
  if (!user.job) missing.push("شغل");
  if (!user.phoneVerified) missing.push("تایید شماره موبایل");
  return missing;
}
