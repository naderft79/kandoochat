// API درصد تکمیل پروفایل و نشان ها
import { NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { getUserBadges, calculateProfileCompletion } from "@/lib/badges";

export async function GET() {
  try {
    const user = await requireUser();
    const completion = calculateProfileCompletion(user);
    const badges = await getUserBadges(user.id);
    return NextResponse.json({ completion, badges });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[profile-completion] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
