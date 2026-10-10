// اتصال اشتراکی Redis — اگر REDIS_URL تنظیم نشده باشد null برمی گرداند
import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL;
let redis: Redis | null = null;

if (redisUrl) {
  try {
    redis = new Redis(redisUrl, {
      retryStrategy: (times) => (times > 3 ? null : Math.min(times * 100, 1000)),
      maxRetriesPerRequest: 1,
      lazyConnect: true,
    });
  } catch {
    redis = null;
  }
}

export function getRedis(): Redis | null {
  return redis;
}
