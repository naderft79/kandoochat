// قفل حساب بعد از تلاش های ورود ناموفق — Redis در production، حافظه محلی در توسعه
// هدف: جلوگیری از کرک رمز روی یک شماره خاص با IP های متفاوت (ریت لیمیت per-IP کافی نیست)
import { getRedis } from "@/lib/redis";

const MAX_FAILS = 10;
const FAIL_WINDOW_MS = 60 * 60 * 1000; // پنجره شمارش خطا: ۱ ساعت
const LOCK_MS = 15 * 60 * 1000; // مدت قفل: ۱۵ دقیقه

const redis = getRedis();

const memFails = new Map<string, { count: number; resetAt: number }>();
const memLocks = new Map<string, number>();

// شماره «1» (روت محافظت شده) هیچ وقت قفل نمی شود تا حساب ادمین DoS نشود
const isLockable = (phone: string) => /^09\d{9}$/.test(phone);

export async function getPhoneLockRemaining(phone: string): Promise<number> {
  if (!isLockable(phone)) return 0;
  const key = `loginlock:${phone}`;
  if (redis) {
    try {
      const until = await redis.get(key);
      const ms = until ? Number(until) - Date.now() : 0;
      return ms > 0 ? ms : 0;
    } catch {
      // ادامه با حافظه
    }
  }
  const until = memLocks.get(phone) ?? 0;
  return Math.max(0, until - Date.now());
}

export async function recordLoginFailure(phone: string): Promise<void> {
  if (!isLockable(phone)) return;
  const fkey = `loginfail:${phone}`;
  const lkey = `loginlock:${phone}`;
  if (redis) {
    try {
      const count = await redis.incr(fkey);
      if (count === 1) await redis.pexpire(fkey, FAIL_WINDOW_MS);
      if (count >= MAX_FAILS) {
        await redis.set(lkey, String(Date.now() + LOCK_MS), "PX", LOCK_MS);
        await redis.del(fkey);
      }
      return;
    } catch {
      // ادامه با حافظه
    }
  }
  const now = Date.now();
  const rec = memFails.get(phone);
  if (!rec || rec.resetAt < now) {
    memFails.set(phone, { count: 1, resetAt: now + FAIL_WINDOW_MS });
  } else {
    rec.count += 1;
    if (rec.count >= MAX_FAILS) {
      memLocks.set(phone, now + LOCK_MS);
      memFails.delete(phone);
    }
  }
}

export async function clearLoginFailures(phone: string): Promise<void> {
  if (!isLockable(phone)) return;
  if (redis) {
    try {
      await redis.del(`loginfail:${phone}`);
      return;
    } catch {
      // ادامه با حافظه
    }
  }
  memFails.delete(phone);
}
