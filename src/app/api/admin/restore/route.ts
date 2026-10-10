// API بازگشت از حساب کاربر به پنل ادمین
import { NextResponse } from "next/server";
import { restoreAdminSession, AuthError } from "@/lib/auth";

export async function POST() {
  try {
    const restored = await restoreAdminSession();
    if (!restored) {
      return NextResponse.json({ error: "سشن ادمین یافت نشد" }, { status: 400 });
    }
    console.log("[restore] admin session restored");
    return NextResponse.json({ ok: true, redirect: "/admin/users" });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    }
    console.error("[restore] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
