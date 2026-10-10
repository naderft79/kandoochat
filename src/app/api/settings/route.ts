// API دریافت تنظیمات عمومی (برای کلاینت)
import { NextResponse } from "next/server";
import { getAllSettings } from "@/lib/settings";

export async function GET() {
  const settings = await getAllSettings();
  return NextResponse.json({
    boostCostCoins: settings.boostCostCoins,
    boostDurationMinutes: settings.boostDurationMinutes,
    dailyLikeLimit: settings.dailyLikeLimit,
    superLikeDailyLimit: settings.superLikeDailyLimit,
    transferFeePercent: settings.transferFeePercent,
    referralRewardCoins: settings.referralRewardCoins,
    otpEnabled: settings.otpEnabled,
  });
}
