// بررسی معتبر بودن کد دعوت هنگام ثبت نام (عمومی، با محدودیت نرخ)
import { NextResponse } from "next/server";
import { rateLimit, getClientIdentifier } from "@/lib/rate-limit";
import { findUserByReferralCode } from "@/lib/referral";

export async function GET(request: Request) {
  try {
    const rl = await rateLimit(`chkref:${getClientIdentifier(request)}`, { windowMs: 60 * 1000, maxRequests: 20 });
    if (!rl.allowed) return NextResponse.json({ error: "درخواست زیاد" }, { status: 429 });
    const code = (new URL(request.url).searchParams.get("code") ?? "").trim();
    if (!code) return NextResponse.json({ valid: false, error: "کد را وارد کنید" });
    const referrer = await findUserByReferralCode(code);
    if (!referrer) return NextResponse.json({ valid: false, error: "کد دعوت معتبر نیست" });
    return NextResponse.json({ valid: true, name: referrer.firstName });
  } catch (err) {
    console.error("[auth/check-referral] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
