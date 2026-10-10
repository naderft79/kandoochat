// API فید خانه: صفحه بندی با offset در ترتیب seed دار پایدار
import { NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { getHomeFeed, FEED_PAGE_SIZE } from "@/lib/homeFeed";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const sp = new URL(request.url).searchParams;
    const seed = (sp.get("seed") || "").replace(/[^a-z0-9]/gi, "").slice(0, 16);
    if (!seed) return NextResponse.json({ error: "seed لازم است" }, { status: 400 });
    const offset = Math.max(0, parseInt(sp.get("offset") || "0", 10) || 0);
    const limit = Math.min(20, Math.max(1, parseInt(sp.get("limit") || String(FEED_PAGE_SIZE), 10) || FEED_PAGE_SIZE));
    const data = await getHomeFeed(user, seed, offset, limit);
    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[feed/home] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
