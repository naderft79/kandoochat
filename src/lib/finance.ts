// منطق مالی: کیف پول، اشتراک و تراکنش ها
import { prisma } from "@/lib/prisma";

// بررسی فعال بودن اشتراک کاربر (کاربران ویژه اشتراک نامحدود دارند)
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      isSpecial: true,
      subscriptions: { where: { endsAt: { gt: new Date() } }, select: { id: true }, take: 1 },
    },
  });
  if (!user) return false;
  return user.isSpecial || user.subscriptions.length > 0;
}

// آخرین اشتراک فعال کاربر
export async function getActiveSubscription(userId: string) {
  return prisma.subscription.findFirst({
    where: { userId, endsAt: { gt: new Date() } },
    orderBy: { endsAt: "desc" },
  });
}

// اطمینان از وجود کیف پول برای کاربر
export async function ensureWallet(userId: string) {
  return prisma.wallet.upsert({
    where: { userId },
    update: {},
    create: { userId, balance: 0 },
  });
}
