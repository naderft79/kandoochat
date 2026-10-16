// ساخت فیلتر مشترک صفحات اکتشاف و جستجوی کاربران
// جلوگیری از تکرار منطق where/orderBy بین api/feed و api/matches
import { prisma } from "@/lib/prisma";

type Viewer = { id: string; gender: string; city: string };

function toInt(v: string | null): number | null {
  if (!v) return null;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
}

// ساخت شرط where بر اساس پارامترهای جستجو
export function buildDiscoveryWhere(user: Viewer, sp: URLSearchParams): Record<string, unknown> {
  const q = (sp.get("q") || "").trim().slice(0, 60);
  const cityParam = sp.get("city");
  const provinceParam = sp.get("province");
  // "ALL" یعنی جستجو در همه شهرها / استان ها
  const city = cityParam === "ALL" ? null : cityParam || user.city;
  const province = provinceParam === "ALL" ? null : provinceParam;
  const ageMin = toInt(sp.get("ageMin"));
  const ageMax = toInt(sp.get("ageMax"));
  const heightMin = toInt(sp.get("heightMin"));
  const heightMax = toInt(sp.get("heightMax"));
  const hasPhoto = sp.get("hasPhoto") === "true";

  const where: Record<string, unknown> = {
    role: "USER",
    isActive: true,
    isAICompanion: { not: true },
    gender: user.gender === "MALE" ? "FEMALE" : "MALE",
    id: { not: user.id },
  };

  // شهر در اولویت است؛ اگر شهر مشخص نشده ولی استان مشخص شده، همه شهرهای استان جستجو می شوند
  if (city) where.city = city;
  else if (province) where.province = province;

  if (ageMin !== null || ageMax !== null) {
    const age: Record<string, number> = {};
    if (ageMin !== null) age.gte = ageMin;
    if (ageMax !== null) age.lte = ageMax;
    where.age = age;
  }

  if (heightMin !== null || heightMax !== null) {
    const height: Record<string, number> = {};
    if (heightMin !== null) height.gte = heightMin;
    if (heightMax !== null) height.lte = heightMax;
    where.height = height;
  }

  if (hasPhoto) where.photos = { some: { isVerified: true } };

  if (q) {
    where.OR = [
      { username: { contains: q, mode: "insensitive" } },
      { firstName: { contains: q, mode: "insensitive" } },
      { lastName: { contains: q, mode: "insensitive" } },
      { job: { contains: q, mode: "insensitive" } },
      { bio: { contains: q, mode: "insensitive" } },
    ];
  }

  // حذف بلاک شده ها در هر دو جهت
  where.NOT = {
    OR: [
      { receivedBlocks: { some: { blockerId: user.id } } },
      { sentBlocks: { some: { blockedId: user.id } } },
    ],
  };

  return where;
}

// ساخت orderBy بر اساس نوع مرتب سازی
export function buildDiscoveryOrderBy(sort: string | null): Record<string, string>[] {
  switch (sort) {
    case "ACTIVE":
      return [{ isOnline: "desc" }, { lastSeen: "desc" }];
    case "VERIFIED":
      return [{ isVerified: "desc" }, { createdAt: "desc" }];
    default:
      return [{ createdAt: "desc" }];
  }
}

// تعداد کاربر در هر صفحه جستجو
export const DISCOVERY_PAGE_SIZE = 15;
const MAX_BOOSTED = 10;

// دریافت یک صفحه از نتایج جستجو — کاربران بوست شده فقط در صفحه اول می آیند
export async function getDiscoveryPage(
  user: Viewer,
  sp: URLSearchParams,
  pageInput: number
): Promise<{ matches: unknown[]; page: number; totalPages: number; total: number }> {
  const where = buildDiscoveryWhere(user, sp);
  const orderBy = buildDiscoveryOrderBy(sp.get("sort"));

  // شناسه کاربران با بوست فعال (در همه صفحات لازم است تا offset درست محاسبه شود)
  const boosted = await prisma.user.findMany({
    where: { ...where, boosts: { some: { endsAt: { gt: new Date() } } } },
    select: { id: true },
    take: MAX_BOOSTED,
  });
  const boostedIds = boosted.map((u) => u.id);

  const regularWhere = { ...where, id: { notIn: boostedIds } };
  const totalRegular = await prisma.user.count({ where: regularWhere });
  const total = boostedIds.length + totalRegular;
  const totalPages = Math.max(1, Math.ceil(total / DISCOVERY_PAGE_SIZE));
  const page = Math.min(Math.max(1, pageInput), totalPages);

  // در صفحه اول، بوست شد ها ابتدای لیست می آیند و بقیه ظرفیت با کاربران عادی پر می شود
  const regularSkip = page === 1 ? 0 : (page - 1) * DISCOVERY_PAGE_SIZE - boostedIds.length;
  const regularTake = page === 1 ? DISCOVERY_PAGE_SIZE - boostedIds.length : DISCOVERY_PAGE_SIZE;

  const [boostedUsers, regularUsers] = await Promise.all([
    page === 1 && boostedIds.length > 0
      ? prisma.user.findMany({ where: { ...where, id: { in: boostedIds } }, select: discoverySelect })
      : Promise.resolve([]),
    prisma.user.findMany({
      where: regularWhere,
      select: discoverySelect,
      orderBy,
      skip: Math.max(0, regularSkip),
      take: regularTake,
    }),
  ]);

  return { matches: [...boostedUsers, ...regularUsers], page, totalPages, total };
}

// فیلدهای select مشترک کارت های کاربر
export const discoverySelect = {
  id: true,
  firstName: true,
  username: true,
  gender: true,
  age: true,
  height: true,
  weight: true,
  province: true,
  city: true,
  job: true,
  income: true,
  isVerified: true,
  phoneVerified: true,
  isOnline: true,
  lastSeen: true,
  bio: true,
  createdAt: true,
  photos: { select: { url: true, order: true, isProfile: true }, where: { isVerified: true, isRejected: false, isDeletedByUser: false }, orderBy: { order: "asc" } },
} as const;
