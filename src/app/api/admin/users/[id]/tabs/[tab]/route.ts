// داده یک تب از مودال پروفایل کاربر (با صفحه بندی، بازه زمانی و جستجو)؛ مجوز تب در سرور بررسی می شود
import { NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth";
import { logAction } from "@/lib/audit";
import { canAccessUserTab, USER_TABS, type UserTab } from "@/lib/permissions";
import { getUserTab, parseTabQuery } from "@/lib/admin-user-data";

export async function GET(request: Request, { params }: { params: Promise<{ id: string; tab: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id, tab } = await params;
    if (!(USER_TABS as readonly string[]).includes(tab)) return NextResponse.json({ error: "تب نامعتبر است" }, { status: 404 });
    const userTab = tab as UserTab;
    if (!canAccessUserTab(admin.role, userTab)) return NextResponse.json({ error: "دسترسی به این بخش ندارید" }, { status: 403 });

    const query = parseTabQuery(new URL(request.url).searchParams);
    const page = await getUserTab(id, userTab, admin.role, query);

    // باز کردن پیام ها و IP ها در لاگ ثبت می شود
    if (userTab === "messages") await logAction(admin.id, "VIEW_USER_MESSAGES", "USER", id, `list:page=${query.page}`);
    if (userTab === "activity" && !query.kind) await logAction(admin.id, "VIEW_USER_LOGINS", "USER", id, `page=${query.page}`);
    if (userTab === "media" && query.kind === "chatMedia") await logAction(admin.id, "VIEW_USER_MESSAGES", "USER", id, "chatMedia");

    return NextResponse.json(page);
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: err.message === "FORBIDDEN" ? 403 : 401 });
    if (err instanceof Error && err.message === "FORBIDDEN_TAB") return NextResponse.json({ error: "دسترسی به این بخش ندارید" }, { status: 403 });
    console.error("[admin/users/tabs] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
