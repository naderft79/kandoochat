// ثبت و تجمیع بازدید صفحات: هش روزانه بازدیدکننده (بدون ذخیره IP)، خلاصه روزانه به وقت تهران، و گزارش آمار
import { createHmac } from "crypto";
import { prisma } from "@/lib/prisma";
import { resolvePage, pageNameOf } from "@/lib/page-names";
import { classifyEntry, detectPlatform, sourceNameFa, type Channel } from "@/lib/traffic";

export const RAW_RETENTION_DAYS = 90;
// ایمن سازی: بدون نمک، هش ساخته و ذخیره نمی شود
const TOTAL_KEY = "*";
const TEHRAN_OFFSET = "+03:30"; // ایران از ۱۴۰۱ ساعت تغییر ندارد

export function tehranDay(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tehran", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

function addDays(day: string, n: number): string {
  const d = new Date(`${day}T12:00:00${TEHRAN_OFFSET}`);
  return tehranDay(new Date(d.getTime() + n * 86400000));
}

export function dayBounds(day: string): { start: Date; end: Date } {
  const start = new Date(`${day}T00:00:00${TEHRAN_OFFSET}`);
  return { start, end: new Date(start.getTime() + 86400000) };
}

// هش یکتای بازدیدکننده در یک روز: IP و User-Agent با نمک سرور؛ با تغییر روز هش عوض می شود
export function visitorHash(ip: string | null, ua: string, day: string): string | null {
  const salt = process.env.ANALYTICS_SALT || process.env.JWT_SECRET;
  if (!salt) return null;
  return createHmac("sha256", salt).update(`${day}|${ip ?? "unknown"}|${ua}`).digest("hex").slice(0, 32);
}

const BOT_PATTERN = /bot|crawl|spider|slurp|headless|lighthouse|preview|monitor|curl|wget|python-requests|httpclient|facebookexternalhit/i;
export function isBotUserAgent(ua: string): boolean {
  return !ua || BOT_PATTERN.test(ua);
}

export type RecordInput = {
  pathname: string;
  entry: boolean;
  referrer: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  ip: string | null;
  ua: string;
  ownHost: string;
  isLoggedIn: boolean;
};

// ثبت یک بازدید؛ صفحات ناشناخته (مثلاً مسیرهای داخلی) شمرده نمی شوند
export async function recordPageView(input: RecordInput): Promise<boolean> {
  const page = resolvePage(input.pathname);
  if (!page) return false;
  const day = tehranDay();
  const hash = visitorHash(input.ip, input.ua, day);
  if (!hash) return false;

  const classified = input.entry
    ? classifyEntry({ referrer: input.referrer, ownHost: input.ownHost, ua: input.ua, utmSource: input.utmSource, utmMedium: input.utmMedium })
    : { channel: "INTERNAL" as Channel, source: "internal", platform: detectPlatform(input.ua) };

  await prisma.pageView.create({
    data: {
      path: page.path,
      pageKey: page.key,
      isEntry: input.entry,
      channel: classified.channel,
      source: classified.source,
      platform: classified.platform,
      isLoggedIn: input.isLoggedIn,
      visitorHash: hash,
    },
  });
  return true;
}

type GroupRow = {
  pageKey: string;
  channel: string;
  source: string;
  platform: string;
  isEntry: boolean;
  isLoggedIn: boolean;
  views: number;
  visitors: number;
};

// تجمیع بازدیدهای یک بازه زمانی: ردیف های ترکیبی به علاوه یک ردیف کل (با کلید *) برای بازدیدکننده یکتای هر روز
async function groupRows(start: Date, end: Date): Promise<GroupRow[]> {
  const detail = await prisma.$queryRaw<GroupRow[]>`
    SELECT "pageKey", "channel", "source", "platform", "isEntry", "isLoggedIn",
           COUNT(*)::int AS views, COUNT(DISTINCT "visitorHash")::int AS visitors
    FROM "PageView"
    WHERE "createdAt" >= ${start} AND "createdAt" < ${end}
    GROUP BY 1, 2, 3, 4, 5, 6`;
  const [total] = await prisma.$queryRaw<{ views: number; visitors: number }[]>`
    SELECT COUNT(*)::int AS views, COUNT(DISTINCT "visitorHash")::int AS visitors
    FROM "PageView"
    WHERE "createdAt" >= ${start} AND "createdAt" < ${end}`;
  if (!total || total.views === 0) return [];
  return [
    ...detail,
    { pageKey: TOTAL_KEY, channel: TOTAL_KEY, source: TOTAL_KEY, platform: TOTAL_KEY, isEntry: false, isLoggedIn: false, views: total.views, visitors: total.visitors },
  ];
}

// خلاصه یک روز کامل را از روی بازدیدهای خام می سازد (جایگزین قبلی همان روز حذف می شود، پس تکرارپذیر است)
export async function aggregateDay(day: string): Promise<number> {
  const { start, end } = dayBounds(day);
  const rows = await groupRows(start, end);
  await prisma.$transaction([
    prisma.visitDailyStat.deleteMany({ where: { day } }),
    prisma.visitDailyStat.createMany({ data: rows.map((r) => ({ day, ...r })) }),
  ]);
  return rows.length;
}

// نگهداری: روزهای کامل قبل از امروز را تجمیع می کند، سپس بازدیدهای خام قدیمی تر از ۹۰ روز را حذف می کند
export async function aggregateAndPurge(): Promise<{ aggregatedDays: number; purgedRows: number }> {
  const today = tehranDay();
  const oldest = await prisma.pageView.findFirst({ orderBy: { createdAt: "asc" }, select: { createdAt: true } });
  let aggregatedDays = 0;
  if (oldest) {
    for (let day = tehranDay(oldest.createdAt); day < today; day = addDays(day, 1)) {
      const { start, end } = dayBounds(day);
      const count = await prisma.pageView.count({ where: { createdAt: { gte: start, lt: end } } });
      if (count > 0) {
        await aggregateDay(day);
        aggregatedDays++;
      }
    }
  }
  const cutoffDay = addDays(today, -RAW_RETENTION_DAYS);
  const purged = await prisma.pageView.deleteMany({ where: { createdAt: { lt: dayBounds(cutoffDay).start } } });
  return { aggregatedDays, purgedRows: purged.count };
}

export type VisitsRange = 7 | 30 | 90;
export const CHANNEL_LABEL: Record<string, string> = {
  SEARCH: "موتور جستجو",
  SOCIAL: "شبکه اجتماعی",
  PAID: "تبلیغات",
  REFERRAL: "ارجاع از سایت ها",
  DIRECT: "مستقیم",
};

type Detail = GroupRow & { day: string };

// گزارش آمار بازدید برای بازه: روزهای کامل از خلاصه، و امروز مستقیماً از بازدیدهای خام
export async function getVisitsReport(range: VisitsRange) {
  const today = tehranDay();
  const days = Array.from({ length: range }, (_, i) => addDays(today, -(range - 1 - i)));
  const past = days.slice(0, -1);

  const stored = past.length
    ? await prisma.visitDailyStat.findMany({ where: { day: { in: past } } })
    : [];
  const liveBounds = dayBounds(today);
  const live = await groupRows(liveBounds.start, liveBounds.end);

  const rows: Detail[] = [
    ...stored.map((s) => ({ day: s.day, pageKey: s.pageKey, channel: s.channel, source: s.source, platform: s.platform, isEntry: s.isEntry, isLoggedIn: s.isLoggedIn, views: s.views, visitors: s.visitors })),
    ...live.map((r) => ({ ...r, day: today })),
  ];
  const totals = rows.filter((r) => r.pageKey === TOTAL_KEY);
  const detail = rows.filter((r) => r.pageKey !== TOTAL_KEY);
  const entries = detail.filter((r) => r.isEntry);
  const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
  const visitsOf = (pred: (r: Detail) => boolean) => sum(entries.filter(pred).map((r) => r.views));

  const daily = days.map((day) => {
    const t = totals.filter((r) => r.day === day);
    return {
      day,
      label: new Date(`${day}T12:00:00${TEHRAN_OFFSET}`).toLocaleDateString("fa-IR", { month: "short", day: "numeric" }),
      views: sum(t.map((r) => r.views)),
      visitors: sum(t.map((r) => r.visitors)),
      visits: sum(entries.filter((r) => r.day === day).map((r) => r.views)),
    };
  });

  const pageMap = new Map<string, number>();
  for (const r of detail) pageMap.set(r.pageKey, (pageMap.get(r.pageKey) ?? 0) + r.views);
  const pages = Array.from(pageMap.entries())
    .map(([key, views]) => ({ key, name: pageNameOf(key), views }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 20);

  const bySource = (channel: Channel) => {
    const m = new Map<string, number>();
    for (const r of entries.filter((e) => e.channel === channel)) m.set(r.source, (m.get(r.source) ?? 0) + r.views);
    return Array.from(m.entries())
      .map(([key, visits]) => ({ key, name: sourceNameFa(key), visits }))
      .sort((a, b) => b.visits - a.visits);
  };

  const channelMap = new Map<string, number>();
  for (const r of entries) channelMap.set(r.channel, (channelMap.get(r.channel) ?? 0) + r.views);
  const channels = Object.keys(CHANNEL_LABEL).map((key) => ({ key, name: CHANNEL_LABEL[key], visits: channelMap.get(key) ?? 0 }));

  const platformViews = { WEB: 0, APP: 0 };
  for (const r of detail) {
    if (r.platform === "APP") platformViews.APP += r.views;
    else if (r.platform === "WEB") platformViews.WEB += r.views;
  }

  return {
    range,
    kpis: {
      views: sum(totals.map((r) => r.views)),
      visitors: sum(totals.map((r) => r.visitors)),
      visits: sum(entries.map((r) => r.views)),
      searchVisits: visitsOf((r) => r.channel === "SEARCH"),
      socialVisits: visitsOf((r) => r.channel === "SOCIAL"),
      paidVisits: visitsOf((r) => r.channel === "PAID"),
      directVisits: visitsOf((r) => r.channel === "DIRECT"),
      referralVisits: visitsOf((r) => r.channel === "REFERRAL"),
      appViews: platformViews.APP,
      webViews: platformViews.WEB,
      loggedInViews: sum(detail.filter((r) => r.isLoggedIn).map((r) => r.views)),
    },
    daily,
    pages,
    searchSources: bySource("SEARCH"),
    socialSources: bySource("SOCIAL"),
    channels,
    platforms: [
      { key: "WEB", name: "وب", views: platformViews.WEB },
      { key: "APP", name: "اپلیکیشن اندروید", views: platformViews.APP },
    ],
  };
}
