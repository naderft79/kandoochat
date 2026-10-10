// الگوریتم پیشنهاد روزانه هوشمند
import { prisma } from "@/lib/prisma";

// پیشنهاد بهترین تطابق برای کاربر
export async function getDailySuggestion(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      interests: { select: { interestId: true } },
    },
  });
  if (!user) return null;

  const userInterestIds = new Set(user.interests.map((i) => i.interestId));

  // دریافت کاربران هم شهر، جنسیت مخالف، فعال
  const candidates = await prisma.user.findMany({
    where: {
      id: { not: userId },
      gender: { not: user.gender },
      city: user.city,
      isActive: true,
      // حذف بلاک شده ها
      NOT: {
        OR: [
          { receivedBlocks: { some: { blockerId: userId } } },
          { sentBlocks: { some: { blockedId: userId } } },
        ],
      },
    },
    take: 50,
    orderBy: { lastSeen: "desc" },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      age: true,
      city: true,
      province: true,
      height: true,
      job: true,
      bio: true,
      isVerified: true,
      phoneVerified: true,
      isOnline: true,
      lastSeen: true,
      createdAt: true,
      interests: { select: { interestId: true } },
    },
  });

  if (candidates.length === 0) return null;

  // امتیاز دهی به هر کاندید
  const scored = candidates.map((c) => {
    let score = 0;

    // علایق مشترک (حداکثر ۳۰ امتیاز — هر علاقه مشترک ۱۰ امتیاز)
    const sharedInterests = c.interests.filter((i) => userInterestIds.has(i.interestId)).length;
    score += Math.min(30, sharedInterests * 10);

    // نزدیکی سن (حداکثر ۲۰ امتیاز)
    const ageDiff = Math.abs(c.age - user.age);
    score += Math.max(0, 20 - ageDiff * 2);

    // تایید شده (۱۵ امتیاز)
    if (c.isVerified) score += 15;
    if (c.phoneVerified) score += 10;

    // فعال اخیر (حداکثر ۲۰ امتیاز)
    const hoursSinceActive = (Date.now() - new Date(c.lastSeen).getTime()) / (1000 * 60 * 60);
    if (hoursSinceActive < 1) score += 20;
    else if (hoursSinceActive < 24) score += 15;
    else if (hoursSinceActive < 72) score += 10;
    else score += 5;

    // آنلاین (۱۰ امتیاز)
    if (c.isOnline) score += 10;

    // قد مشابه (حداکثر ۱۰ امتیاز)
    const heightDiff = Math.abs(c.height - user.height);
    score += Math.max(0, 10 - heightDiff);

    // bio پر (۵ امتیاز)
    if (c.bio) score += 5;

    // شغل پر (۵ امتیاز)
    if (c.job) score += 5;

    // کاربر جدید (۵ امتیاز)
    const daysSinceJoin = (Date.now() - new Date(c.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceJoin < 7) score += 5;

    // حذف interests از خروجی نهایی
    const { interests, ...rest } = c;
    void interests;
    return { ...rest, score, sharedInterests };
  });

  // مرتب سازی و انتخاب بهترین
  scored.sort((a, b) => b.score - a.score);
  return scored[0];
}

// سوالات یخ شکن پیشنهادی
export const ICEBREAKER_QUESTIONS = [
  "سلام! چه چیزی امروز لبخند روی لبت آورد؟",
  "اگر می توانستی به هر کجای دنیا سفر کنی، کجا می رفتی؟",
  "آخرین فیلمی که دیدی و خیلی دوستش داشتی چی بود؟",
  "چه سرگرمی داری که کمتر کسی می داند؟",
  "اگر یک روز آزاد کامل داشتی، چه می کردی؟",
  "بهترین خاطره کودکی ات چیست؟",
  "چه چیزی در یک رابطه برایت مهم تر از همه است؟",
  "اگر می توانستی یک مهارت جدید یاد بگیری، چه چیزی را انتخاب می کردی؟",
  "دوست داری آدم ها اولین چیزی که در تو توجه کنند چی باشد؟",
  "چه موسیقی ای وقتی خسته ای بهت انرژی می دهد؟",
  "اگر می توانستی با یک شخص تاریخ (زنده یا مرده) شام بخوری، آن شخص کی بود؟",
  "چه چیزی در زندگی ات بیشترین قدردانی را برایت دارد؟",
];
