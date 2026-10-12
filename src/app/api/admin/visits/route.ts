// گزارش آمار بازدید صفحات برای پنل ادمین (بازه ۷، ۳۰ یا ۹۰ روز)
import { NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth";
import { getVisitsReport, type VisitsRange } from "@/lib/visits";

const RANGES: VisitsRange[] = [7, 30, 90];

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const raw = Number(new URL(request.url).searchParams.get("range") ?? "30");
    const range = RANGES.includes(raw as VisitsRange) ? (raw as VisitsRange) : 30;
    return NextResponse.json(await getVisitsReport(range));
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: err.message === "FORBIDDEN" ? 403 : 401 });
    console.error("[admin/visits] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
