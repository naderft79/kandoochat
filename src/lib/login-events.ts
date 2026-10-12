// ثبت رویدادهای ورود، ثبت نام و فعالیت (heartbeat ساعتی) برای تاریخچه پنل ادمین
import { prisma } from "@/lib/prisma";

export const LOGIN_EVENT_KINDS = ["LOGIN", "REGISTER", "HEARTBEAT"] as const;
export type LoginEventKind = (typeof LOGIN_EVENT_KINDS)[number];

const HEARTBEAT_INTERVAL_MS = 60 * 60 * 1000;
const RETENTION_MS = 90 * 24 * 60 * 60 * 1000;
const MAX_UA_LENGTH = 300;

export async function recordLoginEvent(userId: string, kind: LoginEventKind, ip: string | null, userAgent: string | null) {
  await prisma.loginEvent.create({
    data: { userId, kind, ip, userAgent: userAgent ? userAgent.slice(0, MAX_UA_LENGTH) : null },
  });
}

// heartbeat فقط یک بار در ساعت ثبت می شود تا جدول بی دلیل بزرگ نشود
export async function recordHeartbeatIfDue(userId: string, ip: string | null, userAgent: string | null) {
  const last = await prisma.loginEvent.findFirst({
    where: { userId, kind: "HEARTBEAT" },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  if (last && Date.now() - last.createdAt.getTime() < HEARTBEAT_INTERVAL_MS) return;
  await recordLoginEvent(userId, "HEARTBEAT", ip, userAgent);
}

// حذف رویدادهای قدیمی تر از ۹۰ روز (توسط job نگهداشت)
export async function purgeOldLoginEvents(): Promise<number> {
  const cutoff = new Date(Date.now() - RETENTION_MS);
  const res = await prisma.loginEvent.deleteMany({ where: { createdAt: { lt: cutoff } } });
  return res.count;
}
