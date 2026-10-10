// API دریافت اطلاعات کاربر فعلی
import { NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { ensureReferralCode } from "@/lib/referral";

export async function GET() {
  try {
    const user = await requireUser();
    const referralCode = await ensureReferralCode(user);
    return NextResponse.json({
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        phoneVerified: user.phoneVerified,
        isVerified: user.isVerified,
        referralCode,
      },
    });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
