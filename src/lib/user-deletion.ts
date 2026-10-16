// حذف نرم کاربر: حساب بلافاصله غیرفعال و هویت ناشناس می شود، اما تا ۳۰ روز بازیابی ممکن است
// عکس ها، تراکنش ها، کیف پول، برداشت ها و گفتگوها حفظ می شوند؛ طرف مقابل گفتگو نام «کاربر حذف شده» را می بیند
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { ADMIN_ROLES } from "@/lib/auth";

export const RESTORE_WINDOW_DAYS = 30;
export const DELETED_NAME = "کاربر";
export const DELETED_FAMILY = "حذف شده";

type Snapshot = {
  firstName: string;
  lastName: string;
  username: string;
  phone: string;
  bio: string | null;
  job: string | null;
};

export class DeleteUserError extends Error {
  constructor(public code: "NOT_FOUND" | "ALREADY_DELETED" | "IS_ADMIN" | "NOT_DELETED" | "RESTORE_EXPIRED" | "IDENTITY_CONFLICT") {
    super(code);
  }
}

// حذف نرم: اسنپ شات هویت برای بازیابی نگه داشته و فیلدهای شناسایی ناشناس می شوند
export async function softDeleteUser(adminId: string, userId: string, reason: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, role: true, deletedAt: true,
      firstName: true, lastName: true, username: true, phone: true,
      bio: true, job: true,
    },
  });
  if (!user) throw new DeleteUserError("NOT_FOUND");
  if (user.deletedAt) throw new DeleteUserError("ALREADY_DELETED");
  // حساب های مدیر هرگز با این مسیر حذف نمی شوند
  if ((ADMIN_ROLES as readonly string[]).includes(user.role)) throw new DeleteUserError("IS_ADMIN");

  const now = new Date();
  const snapshot: Snapshot = {
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
    phone: user.phone,
    bio: user.bio,
    job: user.job,
  };

  await prisma.user.update({
    where: { id: userId },
    data: {
      isActive: false,
      isOnline: false,
      isTyping: false,
      typingConversationId: null,
      passwordChangedAt: now, // همه سشن ها باطل می شوند
      deletedAt: now,
      deletedById: adminId,
      deleteReason: reason.trim().slice(0, 300),
      deletePurgeAfter: new Date(now.getTime() + RESTORE_WINDOW_DAYS * 86400000),
      deletedSnapshot: snapshot,
      // ناشناس سازی هویت؛ نام «کاربر حذف شده» در گفتگوها و جاهای دیگر دیده می شود
      firstName: DELETED_NAME,
      lastName: DELETED_FAMILY,
      username: `del_${userId}`,
      phone: `del_${userId}`,
      bio: null,
      job: null,
      lastIp: null,
      lastIpAt: null,
    },
  });
}

// بازیابی در مهلت ۳۰ روزه: هویت از اسنپ شات برمی گردد؛ اگر موبایل یا نام کاربری اشغال شده باشد خطا می دهد
export async function restoreUser(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, deletedAt: true, deletePurgeAfter: true, deletedSnapshot: true },
  });
  if (!user?.deletedAt || !user.deletedSnapshot) throw new DeleteUserError("NOT_DELETED");
  if (user.deletePurgeAfter && user.deletePurgeAfter.getTime() <= Date.now()) throw new DeleteUserError("RESTORE_EXPIRED");

  const snap = user.deletedSnapshot as unknown as Snapshot;
  const conflict = await prisma.user.findFirst({
    where: { id: { not: userId }, OR: [{ phone: snap.phone }, { username: snap.username }] },
    select: { id: true },
  });
  if (conflict) throw new DeleteUserError("IDENTITY_CONFLICT");

  await prisma.user.update({
    where: { id: userId },
    data: {
      isActive: true,
      deletedAt: null,
      deletedById: null,
      deleteReason: null,
      deletePurgeAfter: null,
      deletedSnapshot: Prisma.JsonNull,
      firstName: snap.firstName,
      lastName: snap.lastName,
      username: snap.username,
      phone: snap.phone,
      bio: snap.bio,
      job: snap.job,
    },
  });
}

// پاکسازی نهایی پس از پایان مهلت: اسنپ شات هویتی و تاریخچه ورود حذف می شوند؛ ردیف کاربر (سنگ قبر) برای صحت داده مالی باقی می ماند
export async function purgeExpiredDeletedUsers(): Promise<number> {
  const expired = await prisma.user.findMany({
    where: { deletedAt: { not: null }, deletePurgeAfter: { lte: new Date() } },
    select: { id: true },
    take: 100,
  });
  for (const u of expired) {
    await prisma.$transaction([
      prisma.loginEvent.deleteMany({ where: { userId: u.id } }),
      prisma.user.update({ where: { id: u.id }, data: { deletedSnapshot: Prisma.JsonNull } }),
    ]);
  }
  return expired.length;
}
