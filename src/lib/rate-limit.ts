// محدودسازی نرخ درخواست — Redis در production، حافظه محلی در توسعه
import { getRedis } from "@/lib/redis";

const redis = getRedis();
// هشدار: بدون Redis در production هر نمونه سرور شمارنده جدا دارد و محدودیت دور زده می شود
if (!redis && process.env.NODE_ENV === "production") {
  console.warn("[rate-limit] Redis is not configured; using per-instance memory store");
}

type LimitRule = { windowMs: number; maxRequests: number };

const memoryStore = new Map<string, { count: number; resetAt: number }>();

function getWindowKey(identifier: string, rule: LimitRule, now: number): string {
  const windowStart = Math.floor(now / rule.windowMs) * rule.windowMs;
  return `${identifier}:${windowStart}`;
}

async function checkMemoryLimit(identifier: string, rule: LimitRule): Promise<boolean> {
  const now = Date.now();
  const key = getWindowKey(identifier, rule, now);
  const record = memoryStore.get(key);
  if (!record) {
    memoryStore.set(key, { count: 1, resetAt: now + rule.windowMs });
    return true;
  }
  if (record.count < rule.maxRequests) {
    record.count += 1;
    return true;
  }
  return false;
}

async function checkRedisLimit(identifier: string, rule: LimitRule): Promise<boolean> {
  if (!redis) return checkMemoryLimit(identifier, rule);
  const now = Date.now();
  const key = `rate:${identifier}:${Math.floor(now / rule.windowMs) * rule.windowMs}`;
  try {
    const pipeline = redis.pipeline();
    pipeline.incr(key);
    pipeline.pexpire(key, rule.windowMs);
    const results = await pipeline.exec();
    const count = (results?.[0]?.[1] as number) ?? 1;
    return count <= rule.maxRequests;
  } catch {
    return checkMemoryLimit(identifier, rule);
  }
}

// در محیط توسعه/تست درخواست های لوکال محدود نمی شوند تا تست های E2E پایدار بمانند
const LOCAL_IDENTIFIERS = ["unknown", "127.0.0.1", "::1", "::ffff:127.0.0.1", "localhost"];

export async function rateLimit(
  identifier: string,
  rules: LimitRule | LimitRule[]
): Promise<{ allowed: boolean; retryAfterMs?: number }> {
  if (process.env.NODE_ENV !== "production" && LOCAL_IDENTIFIERS.some((l) => identifier.includes(l))) {
    return { allowed: true };
  }
  const list = Array.isArray(rules) ? rules : [rules];
  for (const rule of list) {
    const allowed = redis ? await checkRedisLimit(identifier, rule) : await checkMemoryLimit(identifier, rule);
    if (!allowed) {
      return { allowed: false, retryAfterMs: rule.windowMs };
    }
  }
  return { allowed: true };
}

export function getClientIdentifier(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";
  return ip;
}

// پیش‌تنظیم‌های پرکاربرد
export const loginRateLimit = { windowMs: 15 * 60 * 1000, maxRequests: 10 };
export const otpRateLimit = { windowMs: 15 * 60 * 1000, maxRequests: 5 };
export const registerRateLimit = { windowMs: 60 * 60 * 1000, maxRequests: 5 };
export const apiRateLimit = { windowMs: 60 * 1000, maxRequests: 120 };
