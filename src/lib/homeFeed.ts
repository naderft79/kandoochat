// فید خانه: ترتیب پایدار با seed، بوست و هم شهری اولویت دارند، بلاک شده ها و «نشان نده» حذف می شوند
import { prisma } from "@/lib/prisma";
import { buildDiscoveryWhere, discoverySelect } from "@/lib/discovery";

export const FEED_PAGE_SIZE = 10;
const CANDIDATE_CAP = 3000;
export const FEED_SEED_COOKIE = "kandoo_feed_seed";
export const FEED_SEED_TTL_SEC = 30 * 60;

type Viewer = { id: string; gender: string; city: string };

// هش سریع FNV-1a برای مرتب سازی شبه تصادفی ولی پایدار
function hash(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function newSeed() {
  return Math.random().toString(36).slice(2, 10);
}

export async function getHomeFeed(user: Viewer, seed: string, offset: number, limit = FEED_PAGE_SIZE) {
  const now = new Date();
  const where = buildDiscoveryWhere(user, new URLSearchParams({ city: "ALL" }));
  // حذف «نشان نده» ها (اضافه روی NOT بلاک)
  const hiddenFilter = { hiddenInFeeds: { none: { userId: user.id } } };

  const candidates = await prisma.user.findMany({
    where: { ...where, ...hiddenFilter },
    select: { id: true, city: true, boosts: { where: { endsAt: { gt: now } }, select: { id: true }, take: 1 } },
    orderBy: { createdAt: "desc" },
    take: CANDIDATE_CAP,
  });

  const ranked = candidates
    .map((c) => ({
      id: c.id,
      tier: c.boosts.length ? 0 : c.city === user.city ? 1 : 2,
      h: hash(c.id + seed),
    }))
    .sort((a, b) => a.tier - b.tier || a.h - b.h);

  const pageIds = ranked.slice(offset, offset + limit).map((r) => r.id);
  if (!pageIds.length) return { items: [], nextOffset: offset, hasMore: false, total: ranked.length };

  const [users, stories, likes] = await Promise.all([
    prisma.user.findMany({
      where: { id: { in: pageIds } },
      select: { ...discoverySelect, lastName: true, province: true },
    }),
    prisma.story.findMany({
      where: { userId: { in: pageIds }, expiresAt: { gt: now }, isApproved: true, isRejected: false, isDeletedByUser: false },
      select: { userId: true },
      distinct: ["userId"],
    }),
    prisma.like.findMany({
      where: { senderId: user.id, receiverId: { in: pageIds }, type: "LIKE" },
      select: { receiverId: true },
    }),
  ]);

  const byId = new Map(users.map((u) => [u.id, u]));
  const storySet = new Set(stories.map((s) => s.userId));
  const likedSet = new Set(likes.map((l) => l.receiverId));

  const items = pageIds
    .map((id) => byId.get(id))
    .filter((u): u is NonNullable<typeof u> => !!u)
    .map((u) => ({
      ...u,
      lastSeen: u.lastSeen.toISOString(),
      createdAt: u.createdAt.toISOString(),
      hasStory: storySet.has(u.id),
      liked: likedSet.has(u.id),
    }));

  const nextOffset = offset + pageIds.length;
  return { items, nextOffset, hasMore: nextOffset < ranked.length, total: ranked.length };
}
