// API آپلود پیام صوتی — فعلا غیرفعال؛ آیکن در کلاینت فقط اطلاع رسانی می کند
import { NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";

export async function POST() {
  try {
    await requireUser();
    return NextResponse.json({ error: "پیام صوتی به زودی فعال می شود" }, { status: 403 });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[voice] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
