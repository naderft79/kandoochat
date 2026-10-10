// Health check — برای مانیتورینگ uptime و load balancer
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, string> = {};

  // بررسی اتصال دیتابیس
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = "ok";
  } catch {
    checks.database = "error";
  }

  // بررسی Redis (اختیاری)
  if (process.env.REDIS_URL) {
    try {
      const { getRedis } = await import("@/lib/redis");
      const redis = getRedis();
      if (redis) {
        await redis.ping();
        checks.redis = "ok";
      }
    } catch {
      checks.redis = "error";
    }
  }

  const healthy = checks.database === "ok" && checks.redis !== "error";

  return NextResponse.json(
    { status: healthy ? "ok" : "degraded", checks, uptime: process.uptime() },
    { status: healthy ? 200 : 503 }
  );
}
