// پیام های یک گفتگو برای مودال پروفایل کاربر؛ هر بار باز شدن در لاگ ثبت می شود
import { NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth";
import { logAction } from "@/lib/audit";
import { getConversationMessages } from "@/lib/admin-user-data";

export async function GET(request: Request, { params }: { params: Promise<{ id: string; convId: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id, convId } = await params;
    const cursor = new URL(request.url).searchParams.get("cursor");
    const result = await getConversationMessages(id, convId, admin.role, cursor && cursor.length < 64 ? cursor : null);
    if (!result) return NextResponse.json({ error: "گفتگو یافت نشد" }, { status: 404 });
    await logAction(admin.id, "VIEW_USER_MESSAGES", "USER", id, `conversation:${convId}`);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: err.message === "FORBIDDEN" ? 403 : 401 });
    if (err instanceof Error && err.message === "FORBIDDEN_TAB") return NextResponse.json({ error: "دسترسی به این بخش ندارید" }, { status: 403 });
    console.error("[admin/users/conversation] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
