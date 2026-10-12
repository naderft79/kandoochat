// دریافت بازدید صفحه از مرورگر؛ همیشه ۲۰۴ برمی گرداند تا خطا یا سهمیه هرگز روی صفحه کاربر اثر نگذارد
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession, ADMIN_ROLES } from "@/lib/auth";
import { getAllSettings } from "@/lib/settings";
import { rateLimit } from "@/lib/rate-limit";
import { getRequestIp } from "@/lib/client-ip";
import { recordPageView, isBotUserAgent } from "@/lib/visits";

const bodySchema = z.object({
  path: z.string().min(1).max(200).startsWith("/"),
  entry: z.boolean(),
  referrer: z.string().max(500).nullable().optional(),
  utmSource: z.string().max(60).nullable().optional(),
  utmMedium: z.string().max(60).nullable().optional(),
});

const noContent = () => new NextResponse(null, { status: 204 });

export async function POST(request: Request) {
  try {
    const settings = await getAllSettings();
    if (!settings.analyticsPageViews) return noContent();

    const body = bodySchema.safeParse(await request.json().catch(() => null));
    if (!body.success) return noContent();

    const ip = getRequestIp(request);
    const limit = await rateLimit(`pageview:${ip ?? "unknown"}`, { windowMs: 60 * 1000, maxRequests: 120 });
    if (!limit.allowed) return noContent();

    const ua = request.headers.get("user-agent") ?? "";
    if (isBotUserAgent(ua)) return noContent();

    // مدیران بازدیدشان را در آمار نمی شمارند
    const session = await getSession();
    if (session && ADMIN_ROLES.includes(session.role as (typeof ADMIN_ROLES)[number])) return noContent();

    await recordPageView({
      pathname: body.data.path,
      entry: body.data.entry,
      referrer: body.data.referrer ?? null,
      utmSource: body.data.utmSource ?? null,
      utmMedium: body.data.utmMedium ?? null,
      ip,
      ua,
      ownHost: request.headers.get("host") ?? "",
      isLoggedIn: !!session,
    });
  } catch (err) {
    console.error("[analytics] failed to record page view:", err);
  }
  return noContent();
}
