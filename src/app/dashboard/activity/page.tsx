// صفحه «فعالیت من» — تایم لاین همه فعالیت های کاربر + بازدیدکنندگان پروفایل برای کاربران ویژه
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { hasActiveSubscription } from "@/lib/finance";
import ActivityClient, { type ActivityItem } from "@/components/dashboard/ActivityClient";

const photoSelect = {
  where: { isRejected: false, isDeletedByUser: false },
  orderBy: [{ isProfile: "desc" as const }, { order: "asc" as const }],
  take: 1,
  select: { url: true },
};

const personSelect = {
  id: true,
  firstName: true,
  username: true,
  isVerified: true,
  photos: photoSelect,
};

// زمان فعلی — جدا از بدنه کامپوننت برای قانون خلوص رندر
function nowMillis(): number {
  return Date.now();
}

export default async function ActivityPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const premium = await hasActiveSubscription(user.id);

  const [sentLikes, matches, views, transfersOut, transfersIn, referrals, boosts, viewCount, viewerCount] =
    await Promise.all([
      prisma.like.findMany({
        where: { senderId: user.id },
        orderBy: { createdAt: "desc" },
        take: 40,
        select: {
          id: true, type: true, createdAt: true,
          receiver: { select: { ...personSelect } },
        },
      }),
      prisma.match.findMany({
        where: { OR: [{ userAId: user.id }, { userBId: user.id }] },
        orderBy: { createdAt: "desc" },
        take: 30,
        select: {
          id: true, createdAt: true, userAId: true,
          userA: { select: { ...personSelect, id: true } },
          userB: { select: { ...personSelect, id: true } },
        },
      }),
      prisma.profileView.findMany({
        where: { viewedId: user.id, viewerId: { not: user.id } },
        orderBy: { createdAt: "desc" },
        take: 30,
        select: { id: true, createdAt: true, viewer: { select: { ...personSelect } } },
      }),
      prisma.coinTransfer.findMany({
        where: { senderId: user.id, status: "COMPLETED" },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: { id: true, coins: true, createdAt: true, receiver: { select: { ...personSelect } } },
      }),
      prisma.coinTransfer.findMany({
        where: { receiverId: user.id, status: "COMPLETED" },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: { id: true, coins: true, createdAt: true, sender: { select: { ...personSelect } } },
      }),
      prisma.referral.findMany({
        where: { referrerId: user.id },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true, status: true, rewardCoins: true, createdAt: true,
          referred: { select: { ...personSelect } },
        },
      }),
      prisma.boost.findMany({
        where: { userId: user.id },
        orderBy: { startsAt: "desc" },
        take: 10,
        select: { id: true, startsAt: true, endsAt: true },
      }),
      prisma.profileView.count({ where: { viewedId: user.id, viewerId: { not: user.id } } }),
      prisma.profileView.groupBy({
        by: ["viewerId"],
        where: { viewedId: user.id, viewerId: { not: user.id } },
      }).then((g) => g.length),
    ]);

  const items: ActivityItem[] = [];

  for (const l of sentLikes) {
    items.push({
      id: `like-${l.id}`,
      kind: l.type === "SUPER_LIKE" ? "superlike" : "like",
      title: l.type === "SUPER_LIKE" ? `تو ${l.receiver.firstName} را سوپر لایک کردی` : `تو ${l.receiver.firstName} را لایک کردی`,
      photoUrl: l.receiver.photos[0]?.url ?? null,
      userId: l.receiver.id,
      verified: l.receiver.isVerified,
      time: l.createdAt.toISOString(),
    });
  }

  for (const m of matches) {
    const other = m.userAId === user.id ? m.userB : m.userA;
    items.push({
      id: `match-${m.id}`,
      kind: "match",
      title: `با ${other.firstName} مچ شدی`,
      photoUrl: other.photos[0]?.url ?? null,
      userId: other.id,
      verified: other.isVerified,
      time: m.createdAt.toISOString(),
    });
  }

  for (const v of views) {
    // برای کاربر رایگان هویت بازدیدکننده ارسال نمی شود
    items.push({
      id: `view-${v.id}`,
      kind: "view",
      title: premium ? `${v.viewer.firstName} پروفایل تو را دید` : "یک نفر پروفایل تو را دید",
      photoUrl: premium ? v.viewer.photos[0]?.url ?? null : null,
      userId: premium ? v.viewer.id : undefined,
      verified: premium ? v.viewer.isVerified : false,
      blurred: !premium,
      time: v.createdAt.toISOString(),
    });
  }

  for (const t of transfersOut) {
    items.push({
      id: `tout-${t.id}`,
      kind: "coin_out",
      title: `${t.coins} سکه به ${t.receiver.firstName} هدیه دادی`,
      photoUrl: t.receiver.photos[0]?.url ?? null,
      userId: t.receiver.id,
      verified: t.receiver.isVerified,
      time: t.createdAt.toISOString(),
    });
  }

  for (const t of transfersIn) {
    items.push({
      id: `tin-${t.id}`,
      kind: "coin_in",
      title: `${t.coins} سکه از ${t.sender.firstName} هدیه گرفتی`,
      photoUrl: t.sender.photos[0]?.url ?? null,
      userId: t.sender.id,
      verified: t.sender.isVerified,
      time: t.createdAt.toISOString(),
    });
  }

  for (const r of referrals) {
    items.push({
      id: `ref-${r.id}`,
      kind: "referral",
      title: `${r.referred.firstName} با دعوت تو عضو شد`,
      subtitle: r.status === "PAID" ? `+${r.rewardCoins} سکه پاداش` : "در انتظار پاداش",
      photoUrl: r.referred.photos[0]?.url ?? null,
      userId: r.referred.id,
      verified: r.referred.isVerified,
      time: r.createdAt.toISOString(),
    });
  }

  const nowMs = nowMillis();
  for (const b of boosts) {
    items.push({
      id: `boost-${b.id}`,
      kind: "boost",
      title: "پروفایل تو بوست شد",
      subtitle: b.endsAt.getTime() > nowMs ? "هنوز فعال است" : undefined,
      time: b.startsAt.toISOString(),
    });
  }

  items.sort((a, b) => b.time.localeCompare(a.time));

  return (
    <ActivityClient
      items={items.slice(0, 80)}
      premium={premium}
      viewCount={viewCount}
      viewerCount={viewerCount}
    />
  );
}
