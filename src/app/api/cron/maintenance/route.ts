// نگهداشت روزانه: پاکسازی تاریخچه ورود بیش از ۹۰ روز — توسط crontab با CRON_SECRET فراخوانی می شود
import { createHash, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { purgeOldLoginEvents } from "@/lib/login-events";

// مقایسه ثابت-زمان توکن (با هش کردن تا طول ورودی نشت نکند)
function tokenMatches(header: string | null, secret: string): boolean {
  const expected = createHash("sha256").update(`Bearer ${secret}`).digest();
  const received = createHash("sha256").update(header ?? "").digest();
  return timingSafeEqual(expected, received);
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("[maintenance] CRON_SECRET env variable is not set");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }
  if (!tokenMatches(request.headers.get("authorization"), secret)) {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  }
  const deleted = await purgeOldLoginEvents();
  console.log(`[maintenance] purged ${deleted} login events older than 90 days`);
  return NextResponse.json({ ok: true, deletedLoginEvents: deleted });
}
