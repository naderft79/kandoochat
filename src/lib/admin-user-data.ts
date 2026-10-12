// لایه داده مودال پروفایل کاربر در پنل ادمین: خلاصه، تب ها و پیام های یک گفتگو
// همه فیلدهای حساس (شماره کامل، IP، متن پیام) قبل از خروج از سرور طبق نقش بیننده ماسک یا حذف می شوند.
import { prisma } from "@/lib/prisma";
import { canAccessUserTab, canViewFullPhone, canViewIp, canViewPrivateMessages, USER_TABS, type UserTab } from "@/lib/permissions";
import { getUserDetailStats, type UserDetailStats } from "@/lib/user-stats";
import { toPersianDigits } from "@/lib/format";

const DAY = 24 * 60 * 60 * 1000;
export const PAGE_SIZE_DEFAULT = 25;
export const PAGE_SIZE_MAX = 50;
// سقف ردیف های یک فایل خروجی XLSX
export const EXPORT_MAX_ROWS = 1000;

export type RangeKey = "all" | "7" | "30";
export type TabQuery = { kind: string; page: number; pageSize: number; range: RangeKey; q: string };

export type OtherUser = { id: string; name: string; username: string };
export type UserRow = {
  id: string;
  at: string;
  title: string;
  subtitle: string | null;
  value: string | null;
  status: string | null;
  tone: "gold" | "green" | "red" | "muted";
  other: OtherUser | null;
  images: string[];
  video: string | null;
  deleted: boolean;
};
export type TabPage = { rows: UserRow[]; total: number; page: number; pageSize: number; hasMore: boolean };

export function maskPhone(phone: string): string {
  return phone.length >= 7 ? `${phone.slice(0, 4)}***${phone.slice(-3)}` : "***";
}

// عدد فارسی با جداکننده هزارگان (برای نمایش مقادیر پولی و سکه)
const fa = (n: number) => toPersianDigits(Math.round(n).toLocaleString("en-US").replace(/,/g, "،"));
const fullName = (u: { firstName: string; lastName: string } | null | undefined) =>
  u ? `${u.firstName} ${u.lastName}`.trim() || "کاربر ناشناس" : "کاربر حذف شده";
const otherOf = (u: { id: string; firstName: string; lastName: string; username: string } | null | undefined): OtherUser | null =>
  u ? { id: u.id, name: fullName(u), username: u.username } : null;

export function parseTabQuery(sp: URLSearchParams): TabQuery {
  const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10) || 1);
  const pageSize = Math.min(PAGE_SIZE_MAX, Math.max(1, parseInt(sp.get("pageSize") ?? `${PAGE_SIZE_DEFAULT}`, 10) || PAGE_SIZE_DEFAULT));
  const range = sp.get("range") === "7" || sp.get("range") === "30" ? (sp.get("range") as RangeKey) : "all";
  return {
    kind: (sp.get("kind") ?? "").slice(0, 40),
    page,
    pageSize,
    range,
    q: (sp.get("q") ?? "").trim().slice(0, 80),
  };
}

function sinceOf(range: RangeKey): Date | undefined {
  if (range === "7") return new Date(Date.now() - 7 * DAY);
  if (range === "30") return new Date(Date.now() - 30 * DAY);
  return undefined;
}

const toneOf = (status: string | null | undefined): UserRow["tone"] => {
  if (!status) return "muted";
  if (["COMPLETED", "APPROVED", "PAID", "ACTIVE", "ACCEPTED"].includes(status)) return "green";
  if (["REJECTED", "FAILED", "CANCELLED", "EXPIRED"].includes(status)) return "red";
  if (["PENDING", "OPEN", "ANSWERED"].includes(status)) return "gold";
  return "muted";
};

// ───────── خلاصه کاربر ─────────

export type UserSummary = {
  id: string;
  role: string;
  firstName: string;
  lastName: string;
  username: string;
  phone: string;
  gender: string;
  age: number;
  height: number;
  weight: number;
  income: number;
  province: string;
  city: string;
  neighborhood: string | null;
  job: string | null;
  carModel: string | null;
  bio: string | null;
  isActive: boolean;
  isOnline: boolean;
  isVerified: boolean;
  isIdentityVerified: boolean;
  phoneVerified: boolean;
  isSpecial: boolean;
  isFake: boolean;
  isAICompanion: boolean;
  messageLockUntil: string | null;
  messageLockReason: string | null;
  messageLocked: boolean;
  referralCode: string | null;
  createdAt: string;
  lastSeen: string;
  lastIp: string | null;
  lastIpAt: string | null;
  balance: number;
  subscription: { startsAt: string; endsAt: string; coinsPaid: number } | null;
  photos: { id: string; url: string; isProfile: boolean }[];
  allowedTabs: UserTab[];
  stats: UserDetailStats;
  permissions: { phoneFull: boolean; ip: boolean; privateMessages: boolean; setRole: boolean };
};

export async function getUserSummary(userId: string, viewerRole: string): Promise<UserSummary | null> {
  const now = new Date();
  const [user, subscription, stats, photos] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, include: { wallet: true } }),
    prisma.subscription.findFirst({
      where: { userId, endsAt: { gt: now } },
      orderBy: { endsAt: "desc" },
      select: { startsAt: true, endsAt: true, coinsPaid: true },
    }),
    getUserDetailStats(userId),
    prisma.profilePhoto.findMany({ where: { userId, isRejected: false, isDeletedByUser: false }, orderBy: { order: "asc" }, select: { id: true, url: true, isProfile: true } }),
  ]);
  if (!user) return null;
  const showIp = canViewIp(viewerRole);
  return {
    id: user.id,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
    phone: canViewFullPhone(viewerRole) ? user.phone : maskPhone(user.phone),
    gender: user.gender,
    age: user.age,
    height: user.height,
    weight: user.weight,
    income: user.income,
    province: user.province,
    city: user.city,
    neighborhood: user.neighborhood,
    job: user.job,
    carModel: user.carModel,
    bio: user.bio,
    isActive: user.isActive,
    isOnline: user.isOnline,
    isVerified: user.isVerified,
    isIdentityVerified: user.isIdentityVerified,
    phoneVerified: user.phoneVerified,
    isSpecial: user.isSpecial,
    isFake: user.isFake,
    isAICompanion: user.isAICompanion,
    messageLockUntil: user.messageLockUntil?.toISOString() ?? null,
    messageLockReason: user.messageLockReason,
    messageLocked: !!user.messageLockUntil && user.messageLockUntil.getTime() > now.getTime(),
    referralCode: user.referralCode,
    createdAt: user.createdAt.toISOString(),
    lastSeen: user.lastSeen.toISOString(),
    lastIp: showIp ? user.lastIp : null,
    lastIpAt: showIp && user.lastIpAt ? user.lastIpAt.toISOString() : null,
    balance: user.wallet?.balance ?? 0,
    subscription: subscription
      ? { startsAt: subscription.startsAt.toISOString(), endsAt: subscription.endsAt.toISOString(), coinsPaid: subscription.coinsPaid }
      : null,
    photos,
    allowedTabs: USER_TABS.filter((t) => canAccessUserTab(viewerRole, t)),
    stats,
    permissions: { phoneFull: canViewFullPhone(viewerRole), ip: showIp, privateMessages: canViewPrivateMessages(viewerRole), setRole: viewerRole === "SUPER_ADMIN" },
  };
}

// ───────── تب ها ─────────

export async function getUserTab(userId: string, tab: UserTab, viewerRole: string, q: TabQuery): Promise<TabPage> {
  if (!canAccessUserTab(viewerRole, tab)) throw new Error("FORBIDDEN_TAB");
  const skip = (q.page - 1) * q.pageSize;
  const since = sinceOf(q.range);
  const at = since ? { gte: since } : undefined;

  const finish = (rows: UserRow[], total: number): TabPage => ({
    rows,
    total,
    page: q.page,
    pageSize: q.pageSize,
    hasMore: skip + rows.length < total,
  });

  switch (tab) {
    case "finance":
      return financeTab(userId, q, at, skip, finish);
    case "media":
      return mediaTab(userId, q, at, skip, finish, viewerRole);
    case "messages":
      return messagesTab(userId, q, skip, finish, viewerRole);
    case "activity":
      return activityTab(userId, q, at, skip, finish, viewerRole);
    case "verification":
      return verificationTab(userId, q, skip, finish);
    case "bot":
      return botTab(userId, q, at, skip, finish);
    default:
      return finish([], 0);
  }
}

type Finish = (rows: UserRow[], total: number) => TabPage;

const TX_LABEL: Record<string, string> = {
  COIN_PURCHASE: "خرید سکه",
  SUBSCRIPTION: "خرید اشتراک",
  WITHDRAW: "برداشت",
  ADMIN_ADJUST: "تنظیم دستی ادمین",
  COIN_TRANSFER_OUT: "انتقال سکه (ارسال)",
  COIN_TRANSFER_IN: "انتقال سکه (دریافت)",
  COIN_TRANSFER_FEE: "کارمزد انتقال",
  BOOST_PURCHASE: "خرید بوست",
  REFERRAL_REWARD: "پاداش دعوت",
  STREAK_REWARD: "پاداش استریک",
};

async function financeTab(userId: string, q: TabQuery, at: { gte: Date } | undefined, skip: number, finish: Finish): Promise<TabPage> {
  const take = q.pageSize;
  const search = q.q ? { contains: q.q } : undefined;

  switch (q.kind) {
    case "coins": {
      const where = { OR: [{ senderId: userId }, { receiverId: userId }], ...(at ? { createdAt: at } : {}) };
      const [items, total] = await Promise.all([
        prisma.coinTransfer.findMany({
          where, orderBy: { createdAt: "desc" }, skip, take,
          select: { id: true, coins: true, fee: true, type: true, status: true, message: true, createdAt: true, senderId: true,
            sender: { select: { id: true, firstName: true, lastName: true, username: true } },
            receiver: { select: { id: true, firstName: true, lastName: true, username: true } } },
        }),
        prisma.coinTransfer.count({ where }),
      ]);
      return finish(items.map((t) => {
        const outgoing = t.senderId === userId;
        return {
          id: t.id, at: t.createdAt.toISOString(),
          title: outgoing ? "انتقال سکه به دیگری" : "دریافت سکه",
          subtitle: t.message ?? null,
          value: `${outgoing ? "−" : "+"}${fa(t.coins)} سکه · کارمزد ${fa(t.fee)}`,
          status: t.status, tone: toneOf(t.status),
          other: otherOf(outgoing ? t.receiver : t.sender),
          images: [], video: null, deleted: false,
        };
      }), total);
    }
    case "withdrawals": {
      const where = { userId, ...(at ? { createdAt: at } : {}) };
      const [items, total] = await Promise.all([
        prisma.withdrawRequest.findMany({ where, orderBy: { createdAt: "desc" }, skip, take, select: { id: true, coins: true, amountToman: true, status: true, adminNote: true, createdAt: true, processedAt: true } }),
        prisma.withdrawRequest.count({ where }),
      ]);
      return finish(items.map((w) => ({
        id: w.id, at: w.createdAt.toISOString(), title: "درخواست برداشت",
        subtitle: w.adminNote ?? (w.processedAt ? `پردازش: ${w.processedAt.toLocaleDateString("fa-IR")}` : null),
        value: `${fa(w.coins)} سکه · ${fa(w.amountToman)} تومان`,
        status: w.status, tone: toneOf(w.status), other: null, images: [], video: null, deleted: false,
      })), total);
    }
    case "subscriptions": {
      const where = { userId, ...(at ? { createdAt: at } : {}) };
      const [items, total] = await Promise.all([
        prisma.subscription.findMany({ where, orderBy: { createdAt: "desc" }, skip, take, select: { id: true, startsAt: true, endsAt: true, coinsPaid: true, createdAt: true } }),
        prisma.subscription.count({ where }),
      ]);
      return finish(items.map((s) => ({
        id: s.id, at: s.createdAt.toISOString(), title: "اشتراک",
        subtitle: `شروع ${s.startsAt.toLocaleDateString("fa-IR")} · پایان ${s.endsAt.toLocaleDateString("fa-IR")}`,
        value: `${fa(s.coinsPaid)} سکه`,
        status: s.endsAt.getTime() > Date.now() ? "ACTIVE" : "EXPIRED",
        tone: s.endsAt.getTime() > Date.now() ? "green" : "muted",
        other: null, images: [], video: null, deleted: false,
      })), total);
    }
    case "gifts": {
      const where = { OR: [{ senderId: userId }, { receiverId: userId }], ...(at ? { createdAt: at } : {}) };
      const [items, total] = await Promise.all([
        prisma.giftPurchase.findMany({
          where, orderBy: { createdAt: "desc" }, skip, take,
          select: { id: true, coinsPaid: true, message: true, createdAt: true, senderId: true, gift: { select: { name: true, emoji: true } },
            sender: { select: { id: true, firstName: true, lastName: true, username: true } },
            receiver: { select: { id: true, firstName: true, lastName: true, username: true } } },
        }),
        prisma.giftPurchase.count({ where }),
      ]);
      return finish(items.map((g) => {
        const sent = g.senderId === userId;
        return {
          id: g.id, at: g.createdAt.toISOString(),
          title: `${g.gift.emoji} ${g.gift.name} (${sent ? "ارسالی" : "دریافتی"})`,
          subtitle: g.message ?? null,
          value: `${fa(g.coinsPaid)} سکه`, status: null, tone: "gold",
          other: otherOf(sent ? g.receiver : g.sender), images: [], video: null, deleted: false,
        };
      }), total);
    }
    case "boosts": {
      const where = { userId, ...(at ? { startsAt: at } : {}) };
      const [items, total] = await Promise.all([
        prisma.boost.findMany({ where, orderBy: { startsAt: "desc" }, skip, take, select: { id: true, startsAt: true, endsAt: true } }),
        prisma.boost.count({ where }),
      ]);
      const now = Date.now();
      return finish(items.map((b) => ({
        id: b.id, at: b.startsAt.toISOString(), title: "بوست",
        subtitle: `${b.startsAt.toLocaleDateString("fa-IR")} تا ${b.endsAt.toLocaleDateString("fa-IR")}`,
        value: null, status: b.endsAt.getTime() > now ? "ACTIVE" : "EXPIRED",
        tone: b.endsAt.getTime() > now ? "green" : "muted", other: null, images: [], video: null, deleted: false,
      })), total);
    }
    case "featured": {
      const where = { userId, ...(at ? { createdAt: at } : {}) };
      const [items, total] = await Promise.all([
        prisma.featuredListing.findMany({ where, orderBy: { createdAt: "desc" }, skip, take, select: { id: true, status: true, costCoins: true, createdAt: true, approvedAt: true } }),
        prisma.featuredListing.count({ where }),
      ]);
      return finish(items.map((f) => ({
        id: f.id, at: f.createdAt.toISOString(), title: "بخش ویژه",
        subtitle: f.approvedAt ? `تایید: ${f.approvedAt.toLocaleDateString("fa-IR")}` : null,
        value: `${fa(f.costCoins)} سکه`, status: f.status, tone: toneOf(f.status),
        other: null, images: [], video: null, deleted: false,
      })), total);
    }
    case "payments": {
      const where = { userId, ...(at ? { createdAt: at } : {}) };
      const [items, total] = await Promise.all([
        prisma.paymentRequest.findMany({ where, orderBy: { createdAt: "desc" }, skip, take, select: { id: true, type: true, coins: true, plan: true, amountToman: true, status: true, createdAt: true } }),
        prisma.paymentRequest.count({ where }),
      ]);
      return finish(items.map((p) => ({
        id: p.id, at: p.createdAt.toISOString(),
        title: p.type === "SUBSCRIPTION" ? "درخواست پرداخت اشتراک" : "درخواست پرداخت سکه",
        subtitle: p.plan ? `پلن ${p.plan}` : null,
        value: `${fa(p.amountToman)} تومان`, status: p.status, tone: toneOf(p.status),
        other: null, images: [], video: null, deleted: false,
      })), total);
    }
    default: {
      // تراکنش های کیف پول (پیش فرض)
      const where = {
        userId,
        ...(at ? { createdAt: at } : {}),
        ...(search ? { description: search } : {}),
      };
      const [items, total] = await Promise.all([
        prisma.transaction.findMany({ where, orderBy: { createdAt: "desc" }, skip, take, select: { id: true, type: true, coins: true, amountToman: true, status: true, description: true, createdAt: true } }),
        prisma.transaction.count({ where }),
      ]);
      return finish(items.map((t) => ({
        id: t.id, at: t.createdAt.toISOString(),
        title: TX_LABEL[t.type] ?? t.type,
        subtitle: t.description ?? null,
        value: `${t.coins >= 0 ? "+" : "−"}${fa(Math.abs(t.coins))} سکه${t.amountToman ? ` · ${fa(t.amountToman)} تومان` : ""}`,
        status: t.status, tone: toneOf(t.status), other: null, images: [], video: null, deleted: false,
      })), total);
    }
  }
}

async function mediaTab(userId: string, q: TabQuery, at: { gte: Date } | undefined, skip: number, finish: Finish, viewerRole: string): Promise<TabPage> {
  const take = q.pageSize;
  const now = new Date();

  if (q.kind === "chatMedia") {
    // رسانه های گفتگو محتوای خصوصی است؛ فقط برای نقش های دارای دسترسی پیام
    if (!canViewPrivateMessages(viewerRole)) throw new Error("FORBIDDEN_TAB");
    const where = { senderId: userId, type: { in: ["IMAGE", "VIDEO", "VOICE"] }, ...(at ? { createdAt: at } : {}) };
    const [items, total] = await Promise.all([
      prisma.message.findMany({ where, orderBy: { createdAt: "desc" }, skip, take, select: { id: true, type: true, mediaUrl: true, duration: true, createdAt: true } }),
      prisma.message.count({ where }),
    ]);
    return finish(items.map((m) => ({
      id: m.id, at: m.createdAt.toISOString(),
      title: m.type === "IMAGE" ? "عکس در گفتگو" : m.type === "VIDEO" ? "ویدیو در گفتگو" : "پیام صوتی",
      subtitle: m.duration ? `${toPersianDigits(String(m.duration))} ثانیه` : null,
      value: null, status: null, tone: "muted", other: null,
      images: m.type === "IMAGE" && m.mediaUrl ? [m.mediaUrl] : [],
      video: m.type !== "IMAGE" && m.mediaUrl ? m.mediaUrl : null,
      deleted: false,
    })), total);
  }

  if (q.kind === "stories") {
    const where = { userId, ...(at ? { createdAt: at } : {}) };
    const [items, total] = await Promise.all([
      prisma.story.findMany({
        where, orderBy: { createdAt: "desc" }, skip, take,
        select: { id: true, url: true, type: true, caption: true, isApproved: true, isRejected: true, isDeletedByUser: true, createdAt: true, expiresAt: true,
          _count: { select: { views: true, likes: true, replies: true } } },
      }),
      prisma.story.count({ where }),
    ]);
    return finish(items.map((s) => {
      const expired = s.expiresAt.getTime() < now.getTime();
      const status = s.isRejected ? "REJECTED" : !s.isApproved ? "PENDING" : expired ? "EXPIRED" : "ACTIVE";
      return {
        id: s.id, at: s.createdAt.toISOString(),
        title: s.type === "VIDEO" ? "استوری ویدیویی" : "استوری",
        subtitle: `${fa(s._count.views)} بازدید · ${fa(s._count.likes)} لایک · ${fa(s._count.replies)} پاسخ${s.caption ? ` · ${s.caption}` : ""}`,
        value: null, status, tone: toneOf(status),
        other: null,
        images: s.type === "VIDEO" ? [] : [s.url],
        video: s.type === "VIDEO" ? s.url : null,
        deleted: s.isDeletedByUser,
      };
    }), total);
  }

  // عکس های پروفایل و گالری (شامل حذف شده ها با نشان)
  const where = { userId, ...(at ? { createdAt: at } : {}) };
  const [items, total] = await Promise.all([
    prisma.profilePhoto.findMany({ where, orderBy: { createdAt: "desc" }, skip, take, select: { id: true, url: true, isProfile: true, isVerified: true, isRejected: true, isDeletedByUser: true, createdAt: true } }),
    prisma.profilePhoto.count({ where }),
  ]);
  return finish(items.map((p) => {
    const status = p.isRejected ? "REJECTED" : p.isVerified ? "APPROVED" : "PENDING";
    return {
      id: p.id, at: p.createdAt.toISOString(),
      title: p.isProfile ? "عکس پروفایل" : "عکس گالری",
      subtitle: null, value: null, status, tone: toneOf(status),
      other: null, images: [p.url], video: null, deleted: p.isDeletedByUser,
    };
  }), total);
}

async function messagesTab(userId: string, q: TabQuery, skip: number, finish: Finish, viewerRole: string): Promise<TabPage> {
  if (!canViewPrivateMessages(viewerRole)) throw new Error("FORBIDDEN_TAB");
  const pair = [{ userAId: userId }, { userBId: userId }];
  const where = { OR: pair };
  const [items, total] = await Promise.all([
    prisma.conversation.findMany({
      where, orderBy: { updatedAt: "desc" }, skip, take: q.pageSize,
      select: {
        id: true, updatedAt: true, userAId: true, deletedByA: true, deletedByB: true, pinnedByA: true, pinnedByB: true,
        userA: { select: { id: true, firstName: true, lastName: true, username: true } },
        userB: { select: { id: true, firstName: true, lastName: true, username: true } },
        _count: { select: { messages: true } },
        messages: { orderBy: { createdAt: "desc" }, take: 1, select: { content: true, type: true, senderId: true, createdAt: true } },
      },
    }),
    prisma.conversation.count({ where }),
  ]);
  return finish(items.map((c) => {
    const iAmA = c.userAId === userId;
    const other = iAmA ? c.userB : c.userA;
    const deletedByMe = iAmA ? c.deletedByA : c.deletedByB;
    const last = c.messages[0];
    const preview = last ? (last.type === "TEXT" ? last.content : `[${last.type}]`) : "بدون پیام";
    return {
      id: c.id, at: (last?.createdAt ?? c.updatedAt).toISOString(),
      title: fullName(other),
      subtitle: `${last && last.senderId === userId ? "شما: " : ""}${preview}`,
      value: `${fa(c._count.messages)} پیام`,
      status: deletedByMe ? "DELETED" : null,
      tone: deletedByMe ? "red" : "muted",
      other: otherOf(other),
      images: [], video: null, deleted: deletedByMe,
    };
  }), total);
}

async function activityTab(userId: string, q: TabQuery, at: { gte: Date } | undefined, skip: number, finish: Finish, viewerRole: string): Promise<TabPage> {
  const take = q.pageSize;
  const showIp = canViewIp(viewerRole);
  const pair = [{ senderId: userId }, { receiverId: userId }];
  const where = at ? { createdAt: at } : {};

  switch (q.kind) {
    case "reports": {
      const w = { OR: [{ reporterId: userId }, { reportedId: userId }], ...where };
      const [items, total] = await Promise.all([
        prisma.report.findMany({
          where: w, orderBy: { createdAt: "desc" }, skip, take,
          select: { id: true, reason: true, status: true, reporterId: true, createdAt: true,
            reporter: { select: { id: true, firstName: true, lastName: true, username: true } },
            reported: { select: { id: true, firstName: true, lastName: true, username: true } } },
        }),
        prisma.report.count({ where: w }),
      ]);
      return finish(items.map((r) => {
        const sent = r.reporterId === userId;
        return {
          id: r.id, at: r.createdAt.toISOString(), title: sent ? "گزارش داده" : "گزارش شده",
          subtitle: r.reason, value: null, status: r.status, tone: toneOf(r.status),
          other: otherOf(sent ? r.reported : r.reporter), images: [], video: null, deleted: false,
        };
      }), total);
    }
    case "blocks": {
      const w = { OR: [{ blockerId: userId }, { blockedId: userId }], ...where };
      const [items, total] = await Promise.all([
        prisma.block.findMany({
          where: w, orderBy: { createdAt: "desc" }, skip, take,
          select: { id: true, reason: true, blockerId: true, createdAt: true,
            blocker: { select: { id: true, firstName: true, lastName: true, username: true } },
            blocked: { select: { id: true, firstName: true, lastName: true, username: true } } },
        }),
        prisma.block.count({ where: w }),
      ]);
      return finish(items.map((b) => {
        const given = b.blockerId === userId;
        return {
          id: b.id, at: b.createdAt.toISOString(), title: given ? "بلاک کرده" : "بلاک شده",
          subtitle: b.reason ?? null, value: null, status: null, tone: "muted",
          other: otherOf(given ? b.blocked : b.blocker), images: [], video: null, deleted: false,
        };
      }), total);
    }
    case "tickets": {
      const w = { userId, ...where };
      const [items, total] = await Promise.all([
        prisma.ticket.findMany({ where: w, orderBy: { createdAt: "desc" }, skip, take, select: { id: true, subject: true, status: true, priority: true, createdAt: true } }),
        prisma.ticket.count({ where: w }),
      ]);
      return finish(items.map((t) => ({
        id: t.id, at: t.createdAt.toISOString(), title: t.subject,
        subtitle: `اولویت ${t.priority}`, value: null, status: t.status, tone: toneOf(t.status),
        other: null, images: [], video: null, deleted: false,
      })), total);
    }
    case "notifications": {
      const w = { userId, ...where };
      const [items, total] = await Promise.all([
        prisma.notification.findMany({ where: w, orderBy: { createdAt: "desc" }, skip, take, select: { id: true, type: true, title: true, body: true, isRead: true, createdAt: true } }),
        prisma.notification.count({ where: w }),
      ]);
      return finish(items.map((n) => ({
        id: n.id, at: n.createdAt.toISOString(), title: n.title,
        subtitle: n.body, value: n.type, status: n.isRead ? "READ" : "UNREAD", tone: n.isRead ? "muted" : "gold",
        other: null, images: [], video: null, deleted: false,
      })), total);
    }
    case "views": {
      const w = { OR: [{ viewerId: userId }, { viewedId: userId }], ...where };
      const [items, total] = await Promise.all([
        prisma.profileView.findMany({
          where: w, orderBy: { createdAt: "desc" }, skip, take,
          select: { id: true, viewerId: true, createdAt: true,
            viewer: { select: { id: true, firstName: true, lastName: true, username: true } },
            viewed: { select: { id: true, firstName: true, lastName: true, username: true } } },
        }),
        prisma.profileView.count({ where: w }),
      ]);
      return finish(items.map((v) => {
        const sent = v.viewerId === userId;
        return {
          id: v.id, at: v.createdAt.toISOString(), title: sent ? "بازدید از پروفایل دیگری" : "بازدید پروفایل",
          subtitle: null, value: null, status: null, tone: "muted",
          other: otherOf(sent ? v.viewed : v.viewer), images: [], video: null, deleted: false,
        };
      }), total);
    }
    case "likes": {
      const w = { OR: pair, ...where };
      const [items, total] = await Promise.all([
        prisma.like.findMany({
          where: w, orderBy: { createdAt: "desc" }, skip, take,
          select: { id: true, type: true, isMatched: true, senderId: true, createdAt: true,
            sender: { select: { id: true, firstName: true, lastName: true, username: true } },
            receiver: { select: { id: true, firstName: true, lastName: true, username: true } } },
        }),
        prisma.like.count({ where: w }),
      ]);
      return finish(items.map((l) => {
        const sent = l.senderId === userId;
        return {
          id: l.id, at: l.createdAt.toISOString(),
          title: `${l.type === "SUPER_LIKE" ? "سوپرلایک" : "لایک"} ${sent ? "داده" : "گرفته"}`,
          subtitle: l.isMatched ? "مچ شد" : null, value: null, status: null, tone: l.isMatched ? "green" : "muted",
          other: otherOf(sent ? l.receiver : l.sender), images: [], video: null, deleted: false,
        };
      }), total);
    }
    case "referrals": {
      const w = { OR: [{ referrerId: userId }, { referredId: userId }], ...where };
      const [items, total] = await Promise.all([
        prisma.referral.findMany({
          where: w, orderBy: { createdAt: "desc" }, skip, take,
          select: { id: true, status: true, rewardCoins: true, paidAt: true, referrerId: true, createdAt: true,
            referrer: { select: { id: true, firstName: true, lastName: true, username: true } },
            referred: { select: { id: true, firstName: true, lastName: true, username: true } } },
        }),
        prisma.referral.count({ where: w }),
      ]);
      return finish(items.map((r) => {
        const invited = r.referrerId === userId;
        return {
          id: r.id, at: r.createdAt.toISOString(),
          title: invited ? "دعوت شده" : "دعوت شده توسط",
          subtitle: r.paidAt ? `پرداخت: ${r.paidAt.toLocaleDateString("fa-IR")}` : null,
          value: `${fa(r.rewardCoins)} سکه`, status: r.status, tone: toneOf(r.status),
          other: otherOf(invited ? r.referred : r.referrer), images: [], video: null, deleted: false,
        };
      }), total);
    }
    case "adminActions": {
      const w = { OR: [{ targetType: "USER", targetId: userId }, { adminId: userId }], ...where };
      const [items, total] = await Promise.all([
        prisma.auditLog.findMany({
          where: w, orderBy: { createdAt: "desc" }, skip, take,
          select: { id: true, action: true, targetType: true, targetId: true, adminId: true, details: true, createdAt: true,
            admin: { select: { id: true, firstName: true, lastName: true, username: true } } },
        }),
        prisma.auditLog.count({ where: w }),
      ]);
      return finish(items.map((a) => ({
        id: a.id, at: a.createdAt.toISOString(), title: a.action,
        subtitle: a.details ?? null,
        value: a.adminId === userId ? "این کاربر اقدام کرده" : null,
        status: null, tone: "muted",
        other: otherOf(a.admin), images: [], video: null, deleted: false,
      })), total);
    }
    default: {
      // ورودها، ثبت نام و فعالیت (IP فقط برای نقش های مجاز)
      const w = { userId, ...where, ...(q.q && showIp ? { ip: { contains: q.q } } : {}) };
      const [items, total] = await Promise.all([
        prisma.loginEvent.findMany({ where: w, orderBy: { createdAt: "desc" }, skip, take, select: { id: true, kind: true, ip: true, userAgent: true, createdAt: true } }),
        prisma.loginEvent.count({ where: w }),
      ]);
      return finish(items.map((e) => ({
        id: e.id, at: e.createdAt.toISOString(),
        title: e.kind === "LOGIN" ? "ورود" : e.kind === "REGISTER" ? "ثبت نام" : "فعالیت در برنامه",
        subtitle: showIp ? e.ip : null,
        value: e.userAgent ? e.userAgent.slice(0, 120) : null,
        status: null, tone: "muted", other: null, images: [], video: null, deleted: false,
      })), total);
    }
  }
}

async function verificationTab(userId: string, q: TabQuery, skip: number, finish: Finish): Promise<TabPage> {
  const where = { userId, ...(sinceOf(q.range) ? { createdAt: { gte: sinceOf(q.range)! } } : {}) };
  const [items, total] = await Promise.all([
    prisma.verificationRequest.findMany({
      where, orderBy: { createdAt: "desc" }, skip, take: q.pageSize,
      select: { id: true, kind: true, status: true, selfieUrls: true, idCardFrontUrl: true, idCardBackUrl: true, voiceUrl: true,
        faceScore: true, faceCount: true, autoResult: true, adminNote: true, reviewedById: true, reviewedAt: true, createdAt: true },
    }),
    prisma.verificationRequest.count({ where }),
  ]);
  const reviewerIds = Array.from(new Set(items.map((i) => i.reviewedById).filter((x): x is string => !!x)));
  const reviewers = reviewerIds.length
    ? await prisma.user.findMany({ where: { id: { in: reviewerIds } }, select: { id: true, firstName: true, lastName: true, username: true } })
    : [];
  const byId = new Map(reviewers.map((r) => [r.id, r]));

  const parseList = (raw: string | null) => {
    try {
      const v = JSON.parse(raw ?? "[]");
      return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
    } catch {
      return [];
    }
  };

  return finish(items.map((v) => {
    const images = [...parseList(v.selfieUrls), v.idCardFrontUrl, v.idCardBackUrl].filter((x): x is string => !!x);
    return {
      id: v.id, at: v.createdAt.toISOString(),
      title: v.kind === "BLUE_TICK" ? "تیک آبی" : "احراز هویت کامل",
      subtitle: [
        v.faceScore != null ? `امتیاز چهره ${toPersianDigits(Math.round(v.faceScore * 100).toString())}٪` : null,
        v.faceCount != null ? `${toPersianDigits(String(v.faceCount))} چهره` : null,
        v.adminNote ? `دلیل: ${v.adminNote}` : null,
      ].filter(Boolean).join(" · ") || null,
      value: v.reviewedAt ? `بررسی: ${v.reviewedAt.toLocaleDateString("fa-IR")}` : null,
      status: v.status, tone: toneOf(v.status),
      other: v.reviewedById ? otherOf(byId.get(v.reviewedById)) : null,
      images, video: v.voiceUrl, deleted: false,
    };
  }), total);
}

async function botTab(userId: string, q: TabQuery, at: { gte: Date } | undefined, skip: number, finish: Finish): Promise<TabPage> {
  const w = { OR: [{ senderId: userId }, { targetId: userId }], ...(at ? { createdAt: at } : {}), ...(q.q ? { detail: { contains: q.q } } : {}) };
  const [items, total] = await Promise.all([
    prisma.botLog.findMany({ where: w, orderBy: { createdAt: "desc" }, skip, take: q.pageSize, select: { id: true, botType: true, senderId: true, targetId: true, category: true, status: true, detail: true, createdAt: true } }),
    prisma.botLog.count({ where: w }),
  ]);
  const otherIds = Array.from(new Set(items.map((i) => (i.senderId === userId ? i.targetId : i.senderId)).filter((x): x is string => !!x)));
  const users = otherIds.length
    ? await prisma.user.findMany({ where: { id: { in: otherIds } }, select: { id: true, firstName: true, lastName: true, username: true } })
    : [];
  const byId = new Map(users.map((u) => [u.id, u]));
  return finish(items.map((b) => {
    const otherId = b.senderId === userId ? b.targetId : b.senderId;
    return {
      id: b.id, at: b.createdAt.toISOString(),
      title: `${b.botType}${b.category ? ` · ${b.category}` : ""}`,
      subtitle: b.detail ?? null, value: null, status: b.status, tone: toneOf(b.status),
      other: otherId ? otherOf(byId.get(otherId)) : null, images: [], video: null, deleted: false,
    };
  }), total);
}

// ───────── پیام های یک گفتگو (با صفحه بندی معکوس) ─────────

export type ChatMessage = {
  id: string;
  at: string;
  mine: boolean;
  type: string;
  content: string | null;
  mediaUrl: string | null;
  deleted: boolean;
};

export async function getConversationMessages(userId: string, convId: string, viewerRole: string, cursor: string | null) {
  if (!canViewPrivateMessages(viewerRole)) throw new Error("FORBIDDEN_TAB");
  const conv = await prisma.conversation.findUnique({
    where: { id: convId },
    select: { id: true, userAId: true, userBId: true },
  });
  if (!conv || (conv.userAId !== userId && conv.userBId !== userId)) return null;

  const items = await prisma.message.findMany({
    where: { conversationId: convId },
    orderBy: { createdAt: "desc" },
    take: PAGE_SIZE_MAX,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: { id: true, senderId: true, type: true, content: true, mediaUrl: true, createdAt: true },
  });
  return {
    messages: items.map((m) => ({
      id: m.id,
      at: m.createdAt.toISOString(),
      mine: m.senderId === userId,
      type: m.type,
      content: m.content,
      mediaUrl: m.mediaUrl,
      deleted: false,
    })) as ChatMessage[],
    nextCursor: items.length === PAGE_SIZE_MAX ? items[items.length - 1].id : null,
  };
}
