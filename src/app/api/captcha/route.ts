// API تولید کپچا — SVG خودمیزبان، بدون وابستگی خارجی
import { NextResponse } from "next/server";
import { createCaptcha } from "@/lib/captcha";
import { rateLimit, getClientIdentifier, rateLimitError } from "@/lib/rate-limit";

export async function GET(request: Request) {
  // سقف تولید کپچا بر اساس IP: ۳۰ در دقیقه
  const rl = await rateLimit(`captcha:${getClientIdentifier(request)}`, { windowMs: 60 * 1000, maxRequests: 30 });
  if (!rl.allowed) {
    return rateLimitError("تعداد درخواست ها بیش از حد مجاز است؛ کمی صبر کنید", rl.retryAfterMs);
  }
  const { id, png } = await createCaptcha();
  return NextResponse.json(
    { id, png },
    { headers: { "Cache-Control": "no-store" } }
  );
}
