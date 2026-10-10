// کوئری سمت سرور بخش ویژه
import { prisma } from "@/lib/prisma";
import { buildDiscoveryWhere, discoverySelect } from "@/lib/discovery";

// کاربران بخش ویژه برای نمایش به بیننده: جدیدترین تاییدشده بالاتر، با فیلتر جنسیت و بلاک
export async function getFeaturedUsers(viewer: { id: string; gender: string; city: string }, take = 12) {
  const where = buildDiscoveryWhere(viewer, new URLSearchParams({ city: "ALL" }));
  const rows = await prisma.featuredListing.findMany({
    where: { status: "APPROVED", user: where },
    orderBy: { approvedAt: "desc" },
    take,
    select: { user: { select: { ...discoverySelect, lastName: true } } },
  });
  return rows.map((r) => ({
    id: r.user.id,
    username: r.user.username,
    firstName: r.user.firstName,
    isVerified: r.user.isVerified,
    photo: r.user.photos.find((p) => p.isProfile)?.url ?? r.user.photos[0]?.url ?? null,
  }));
}
