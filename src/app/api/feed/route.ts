// API فید پروفایل ها با صفحه بندی — load more
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth";
import { rateLimitUser } from "@/lib/rate-limit";
import { buildDiscoveryWhere, buildDiscoveryOrderBy, discoverySelect } from "@/lib/discovery";

const PAGE_SIZE = 10;

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    // سقف دریافت فید: ۶۰ در دقیقه
    const limited = await rateLimitUser(
      user.id,
      "feed",
      { windowMs: 60 * 1000, maxRequests: 60 },
      "درخواست های شما بیش از حد مجاز است؛ کمی صبر کنید"
    );
    if (limited) return limited;
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const where = buildDiscoveryWhere(user, searchParams);
    const orderBy = buildDiscoveryOrderBy(searchParams.get("sort"));

    // کاربران با بوست فعال (فقط در صفحه اول)
    let boostedIds: string[] = [];
    if (page === 1) {
      const boosted = await prisma.user.findMany({
        where: {
          ...where,
          boosts: { some: { endsAt: { gt: new Date() } } },
        },
        select: { id: true },
        take: 10,
      });
      boostedIds = boosted.map((u) => u.id);
    }

    const skip = page === 1 ? 0 : (page - 1) * PAGE_SIZE;
    const take = page === 1 ? PAGE_SIZE - boostedIds.length : PAGE_SIZE;

    // کاربران بوست شده اول
    let boostedUsers: Array<Record<string, unknown>> = [];
    if (page === 1 && boostedIds.length > 0) {
      boostedUsers = await prisma.user.findMany({
        where: { ...where, id: { in: boostedIds } },
        select: discoverySelect,
      }) as unknown as Array<Record<string, unknown>>;
    }

    const regularUsers = await prisma.user.findMany({
      where: { ...where, id: { notIn: boostedIds } },
      select: discoverySelect,
      orderBy,
      skip: Math.max(0, skip),
      take,
    });

    const matches = [...boostedUsers, ...regularUsers];
    const hasMore = regularUsers.length === PAGE_SIZE;

    return NextResponse.json({
      matches,
      page,
      hasMore,
    });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[feed API] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
