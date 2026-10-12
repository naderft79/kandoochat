// API شاخص های آمار پنل ادمین — فقط خواندن؛ پاسخ برای به‌روزرسانی زنده داشبورد آمار
import { NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth";
import { getAdminStats } from "@/lib/admin-stats";

export async function GET() {
  try {
    await requireAdmin();
    return NextResponse.json(await getAdminStats());
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[admin/stats/kpis] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
