// بررسی حداقل تکمیل پروفایل برای استفاده از قابلیت ها
// حداقل: ۱ عکس تایید شده + bio + job
import { prisma } from "@/lib/prisma";

export type ProfileCheckResult = {
  isComplete: boolean;
  missing: string[];
};

/**
 * بررسی اینکه آیا کاربر حداقل پروفایل را تکمیل کرده است
 * حداقل: ۱ عکس تایید شده + bio + job
 */
export async function checkProfileCompletion(userId: string, opts: { requirePhoto?: boolean } = {}): Promise<ProfileCheckResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      bio: true,
      job: true,
      photos: {
        where: { isVerified: true, isRejected: false, isDeletedByUser: false },
        select: { id: true },
        take: 1,
      },
    },
  });

  if (!user) {
    return { isComplete: false, missing: ["حساب کاربری"] };
  }

  const missing: string[] = [];

  if ((opts.requirePhoto ?? true) && user.photos.length === 0) {
    missing.push("حداقل یک عکس تایید شده");
  }
  if (!user.bio || user.bio.trim().length === 0) {
    missing.push("بیوگرافی");
  }
  if (!user.job || user.job.trim().length === 0) {
    missing.push("شغل");
  }

  return {
    isComplete: missing.length === 0,
    missing,
  };
}
