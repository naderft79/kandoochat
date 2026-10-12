// خلاصه کاربر برای مودال پروفایل پنل ادمین (مشخصات، آمار، وضعیت و دسترسی های بیننده)
import { NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth";
import { logAction } from "@/lib/audit";
import { getUserSummary } from "@/lib/admin-user-data";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const summary = await getUserSummary(id, admin.role);
    if (!summary) return NextResponse.json({ error: "کاربر یافت نشد" }, { status: 404 });
    // مشاهده IP کاربر در لاگ ثبت می شود
    if (summary.permissions.ip) await logAction(admin.id, "VIEW_USER_LOGINS", "USER", id, "summary");
    return NextResponse.json({ summary });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: err.message === "FORBIDDEN" ? 403 : 401 });
    console.error("[admin/users/summary] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
