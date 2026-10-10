// قوانین برداشت — به ترتیب بررسی می شوند و فقط اولین قانون رد شده برمی گردد
import { ensureWallet, hasActiveSubscription } from "@/lib/finance";

export const WITHDRAW_MIN_ACCOUNT_DAYS = 15;
export const WITHDRAW_MIN_BALANCE = 100;

export type WithdrawEligibility = {
  failedRule: 1 | 2 | 3 | 4 | null;
  unlockAt: string | null; // زمان باز شدن برداشت وقتی قانون ۱ رد شده است (ISO)
  balance: number;
  minBalance: number;
};

// بررسی شرایط برداشت کاربر — قوانین به همان ترتیب تعریف شده چک می شوند
export async function checkWithdrawEligibility(user: {
  id: string;
  createdAt: Date;
  isIdentityVerified: boolean;
}): Promise<WithdrawEligibility> {
  const wallet = await ensureWallet(user.id);
  const base = { balance: wallet.balance, minBalance: WITHDRAW_MIN_BALANCE };

  // قانون ۱: گذشت ۱۵ روز از ثبت نام
  const unlockDate = new Date(
    user.createdAt.getTime() + WITHDRAW_MIN_ACCOUNT_DAYS * 86_400_000
  );
  if (Date.now() < unlockDate.getTime()) {
    return { ...base, failedRule: 1, unlockAt: unlockDate.toISOString() };
  }

  // قانون ۲: حداقل موجودی سکه
  if (wallet.balance < WITHDRAW_MIN_BALANCE) {
    return { ...base, failedRule: 2, unlockAt: null };
  }

  // قانون ۳: اشتراک ویژه فعال
  if (!(await hasActiveSubscription(user.id))) {
    return { ...base, failedRule: 3, unlockAt: null };
  }

  // قانون ۴: احراز هویت کامل
  if (!user.isIdentityVerified) {
    return { ...base, failedRule: 4, unlockAt: null };
  }

  return { ...base, failedRule: null, unlockAt: null };
}
