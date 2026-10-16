// منطق مشترک سیستم دعوت دوستان — تولید کد، جستجو، آزادسازی پاداش و مایلستون
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { getAllSettings } from "@/lib/settings";
import { ensureWallet } from "@/lib/finance";
import { calculateProfileCompletion } from "@/lib/badges";

// الفبای کد دعوت — بدون کاراکترهای مشابه بصری: 0 O 1 I L 5 S
const REFERRAL_ALPHABET = "ABCDEFGHJKMNPQRTUVWXYZ2346789";
const REFERRAL_CODE_LENGTH = 7;

// حداقل درصد تکمیل پروفایل برای فعال شدن پاداش — همان آستانه بج پروفایل کامل
const PROFILE_COMPLETION_THRESHOLD = 90;

// نرمال سازی ورودی کاربر — بدون حساسیت به بزرگی و کوچکی حروف
export function normalizeReferralCode(input: string | null | undefined): string {
  return (input ?? "").trim().toUpperCase();
}

// تولید کد دعوت یکتای ۷ کاراکتری
export async function generateReferralCode(): Promise<string | null> {
  for (let i = 0; i < 10; i++) {
    const bytes = randomBytes(REFERRAL_CODE_LENGTH);
    let code = "";
    for (let j = 0; j < REFERRAL_CODE_LENGTH; j++) {
      code += REFERRAL_ALPHABET[bytes[j] % REFERRAL_ALPHABET.length];
    }
    const taken = await prisma.user.findFirst({
      where: { OR: [{ referralCode: code }, { legacyReferralCode: code }] },
      select: { id: true },
    });
    if (!taken) return code;
  }
  return null;
}

// اطمینان از داشتن کد جدید ۷ کاراکتری — backfill تنبل برای کاربران قدیمی
export async function ensureReferralCode(user: { id: string; referralCode: string | null; legacyReferralCode: string | null }): Promise<string | null> {
  if (user.referralCode && user.referralCode.length === REFERRAL_CODE_LENGTH) return user.referralCode;
  const code = await generateReferralCode();
  if (!code) return user.referralCode;
  await prisma.user.update({
    where: { id: user.id },
    data: {
      referralCode: code,
      // کد قدیمی را برای زنده ماندن لینک های قبلی نگه می داریم
      legacyReferralCode: user.legacyReferralCode ?? user.referralCode ?? undefined,
    },
  });
  return code;
}

// پیدا کردن دعوت کننده بر اساس کد — کد جدید، کد قدیمی یا id بسیار قدیمی
export async function findUserByReferralCode(rawCode: string | null | undefined) {
  const code = normalizeReferralCode(rawCode);
  if (!code) return null;
  return prisma.user.findFirst({
    where: {
      OR: [{ referralCode: code }, { legacyReferralCode: code }, { id: rawCode ?? "" }],
    },
  });
}

// بررسی سقف های ضد تقلب — آیا دعوت کننده می تواند دعوت جدید بگیرد؟
export async function referrerCanAcceptReferral(referrerId: string): Promise<boolean> {
  const settings = await getAllSettings();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [todayCount, totalCount] = await Promise.all([
    prisma.referral.count({ where: { referrerId, createdAt: { gte: today } } }),
    prisma.referral.count({ where: { referrerId } }),
  ]);
  if (settings.referralDailyLimit > 0 && todayCount >= settings.referralDailyLimit) return false;
  if (settings.referralMaxRewarded > 0 && totalCount >= settings.referralMaxRewarded) return false;
  return true;
}

// ایجاد رکورد دعوت در وضعیت انتظار — پاداش بعد از فعالیت دعوت شده آزاد می شود
export async function createPendingReferral(referrerId: string, referredId: string): Promise<boolean> {
  try {
    const existing = await prisma.referral.findUnique({ where: { referredId } });
    if (existing) return false;
    if (!(await referrerCanAcceptReferral(referrerId))) return false;
    const settings = await getAllSettings();
    await prisma.referral.create({
      data: {
        referrerId,
        referredId,
        rewardCoins: settings.referralRewardCoins,
        status: "PENDING",
      },
    });
    return true;
  } catch (err) {
    console.error("[referral] createPendingReferral failed:", err);
    return false;
  }
}

// آیا شرایط فعال سازی برای دعوت شده برقرار است؟ — یک ماموریت روزانه دریافت شده + پروفایل کامل
async function checkReferralConditions(referredId: string): Promise<boolean> {
  const claimedMission = await prisma.userMission.findFirst({
    where: { userId: referredId, claimed: true },
    select: { id: true },
  });
  if (!claimedMission) return false;
  const user = await prisma.user.findUnique({
    where: { id: referredId },
    select: { bio: true, job: true, phoneVerified: true },
  });
  if (!user) return false;
  return calculateProfileCompletion(user) >= PROFILE_COMPLETION_THRESHOLD;
}

// پرداخت جایزه مایلستون به دعوت کننده — فقط یک بار
async function maybePayReferralMilestone(referrerId: string) {
  const referrer = await prisma.user.findUnique({
    where: { id: referrerId },
    select: { referralMilestonePaidAt: true },
  });
  if (!referrer || referrer.referralMilestonePaidAt) return;
  const settings = await getAllSettings();
  const paidCount = await prisma.referral.count({
    where: { referrerId, status: "PAID" },
  });
  if (paidCount < settings.referralMilestoneCount) return;
  await ensureWallet(referrerId);
  // علامت پرداخت و واریز جایزه در یک تراکنش اتمیک — شرط null جلوی پرداخت دوباره را می گیرد
  const paid = await prisma.$transaction(async (tx) => {
    const claimed = await tx.user.updateMany({
      where: { id: referrerId, referralMilestonePaidAt: null },
      data: { referralMilestonePaidAt: new Date() },
    });
    if (claimed.count === 0) return false;
    await tx.wallet.update({
      where: { userId: referrerId },
      data: { balance: { increment: settings.referralMilestoneCoins } },
    });
    await tx.transaction.create({
      data: {
        userId: referrerId,
        type: "REFERRAL_REWARD",
        coins: settings.referralMilestoneCoins,
        amountToman: settings.referralMilestoneCoins * settings.coinValue,
        status: "COMPLETED",
        description: `جایزه مایلستون ${settings.referralMilestoneCount} دعوت فعال`,
      },
    });
    await tx.notification.create({
      data: {
        userId: referrerId,
        type: "REFERRAL_REWARD",
        title: "جایزه مایلستون دعوت",
        body: `تبریک! به ${settings.referralMilestoneCount} دعوت فعال رسیدید و ${settings.referralMilestoneCoins} سکه جایزه گرفتید`,
      },
    });
    return true;
  });
  if (paid) console.log(`[referral] milestone paid to ${referrerId}: ${settings.referralMilestoneCoins} coins`);
}

// آزادسازی پاداش دعوت — بعد از هر رویداد مرتبط (تکمیل پروفایل، دریافت ماموریت) صدا زده می شود
export async function maybeActivateReferral(referredId: string) {
  try {
    const referral = await prisma.referral.findUnique({ where: { referredId } });
    if (!referral || referral.status !== "PENDING") return;
    if (!(await checkReferralConditions(referredId))) return;

    const settings = await getAllSettings();
    const reward = referral.rewardCoins || settings.referralRewardCoins;
    const referred = await prisma.user.findUnique({
      where: { id: referredId },
      select: { firstName: true },
    });
    const referrer = await prisma.user.findUnique({
      where: { id: referral.referrerId },
      select: { firstName: true },
    });

    await ensureWallet(referredId);
    await ensureWallet(referral.referrerId);

    // تغییر وضعیت و پرداخت هر دو پاداش در یک تراکنش اتمیک
    const activated = await prisma.$transaction(async (tx) => {
      const updated = await tx.referral.updateMany({
        where: { referredId, status: "PENDING" },
        data: { status: "PAID", paidAt: new Date() },
      });
      if (updated.count === 0) return false; // یک تراکنش همزمان قبلاً انجام شده

      await tx.wallet.update({
        where: { userId: referredId },
        data: { balance: { increment: reward } },
      });
      await tx.transaction.create({
        data: {
          userId: referredId,
          type: "REFERRAL_REWARD",
          coins: reward,
          amountToman: reward * settings.coinValue,
          status: "COMPLETED",
          description: `پاداش دعوت از طرف ${referrer?.firstName ?? "دوست"}`,
        },
      });
      await tx.notification.create({
        data: {
          userId: referredId,
          type: "REFERRAL_REWARD",
          title: "پاداش دعوت دوستان",
          body: `حساب شما با دعوت فعال شد. ${reward} سکه پاداش دریافت کردید`,
        },
      });
      await tx.wallet.update({
        where: { userId: referral.referrerId },
        data: { balance: { increment: reward } },
      });
      await tx.transaction.create({
        data: {
          userId: referral.referrerId,
          type: "REFERRAL_REWARD",
          coins: reward,
          amountToman: reward * settings.coinValue,
          status: "COMPLETED",
          description: `پاداش دعوت کاربر ${referred?.firstName ?? ""}`,
        },
      });
      await tx.notification.create({
        data: {
          userId: referral.referrerId,
          type: "REFERRAL_REWARD",
          title: "پاداش دعوت دوستان",
          body: `${referred?.firstName ?? "دوست شما"} فعال شد و ${reward} سکه پاداش دریافت کردید`,
        },
      });
      return true;
    });
    if (!activated) return;
    console.log(`[referral] activated: ${referral.referrerId} -> ${referredId}, reward: ${reward}`);

    await maybePayReferralMilestone(referral.referrerId);
  } catch (err) {
    console.error("[referral] maybeActivateReferral failed:", err);
  }
}
