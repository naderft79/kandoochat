// دریافت یا ایجاد شناسه گفتگو با همراه هوش مصنوعی
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";

export async function POST() {
  try {
    await requireUser();
    // هانی و آقای زنبور فعلا غیرفعال هستند
    return NextResponse.json(
      { error: "این قابلیت بزودی فعال می شود" },
      { status: 403 }
    );
  } catch {
    return NextResponse.json({ error: "خطا" }, { status: 500 });
  }
}
