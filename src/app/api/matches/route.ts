// API جستجوی پروفایل ها با فیلتر، مرتب سازی و صفحه بندی شماره ای
import { NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { rateLimitUser } from "@/lib/rate-limit";
import { getDiscoveryPage } from "@/lib/discovery";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    // سقف جستجو با فیلتر: ۳۰ در دقیقه
    const limited = await rateLimitUser(
      user.id,
      "search",
      { windowMs: 60 * 1000, maxRequests: 30 },
      "تعداد جستجوهای شما بیش از حد مجاز است؛ کمی صبر کنید"
    );
    if (limited) return limited;
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);

    const result = await getDiscoveryPage(user, searchParams, page);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[matches API] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
