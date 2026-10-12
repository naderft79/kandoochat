// API آنالیز لحظه ای — خروجی نرمال شده برای کانال های زنده پنل ادمین (فقط خواندن)
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, AuthError } from "@/lib/auth";

const LIMIT = 40;
const ONLINE_WINDOW_MS = 5 * 60 * 1000;

type FeedItem = {
  id: string;
  title: string;
  subtitle: string;
  value: string;
  tone: "gold" | "green" | "red" | "muted";
  createdAt: string;
};

const name = (u: { firstName: string; lastName: string } | null | undefined) =>
  u ? `${u.firstName} ${u.lastName}`.trim() : "—";

export async function GET(_request: Request, { params }: { params: Promise<{ channel: string }> }) {
  try {
    await requireAdmin();
    const { channel } = await params;
    const items = await loadChannel(channel);
    if (items === null) return NextResponse.json({ error: "کانال نامعتبر است" }, { status: 404 });
    return NextResponse.json({ items, fetchedAt: new Date().toISOString() });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[admin/live] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

async function loadChannel(channel: string): Promise<FeedItem[] | null> {
  switch (channel) {
    case "newUsers": {
      const rows = await prisma.user.findMany({
        where: { role: "USER" },
        orderBy: { createdAt: "desc" },
        take: LIMIT,
        select: { id: true, firstName: true, lastName: true, username: true, city: true, province: true, phoneVerified: true, createdAt: true },
      });
      return rows.map((u) => ({
        id: u.id,
        title: name(u),
        subtitle: `@${u.username} · ${u.city}، ${u.province}`,
        value: u.phoneVerified ? "موبایل تایید شده" : "موبایل تایید نشده",
        tone: u.phoneVerified ? "green" : "muted",
        createdAt: u.createdAt.toISOString(),
      }));
    }
    case "onlineUsers": {
      const since = new Date(Date.now() - ONLINE_WINDOW_MS);
      const rows = await prisma.user.findMany({
        where: { role: "USER", OR: [{ isOnline: true }, { lastSeen: { gte: since } }] },
        orderBy: { lastSeen: "desc" },
        take: LIMIT,
        select: { id: true, firstName: true, lastName: true, username: true, city: true, isOnline: true, lastSeen: true },
      });
      return rows.map((u) => ({
        id: u.id,
        title: name(u),
        subtitle: `@${u.username} · ${u.city}`,
        value: u.isOnline ? "آنلاین" : "اخیراً فعال",
        tone: u.isOnline ? "green" : "muted",
        createdAt: u.lastSeen.toISOString(),
      }));
    }
    case "coinPurchases": {
      const rows = await prisma.transaction.findMany({
        where: { type: "COIN_PURCHASE" },
        orderBy: { createdAt: "desc" },
        take: LIMIT,
        select: { id: true, coins: true, amountToman: true, status: true, createdAt: true, user: { select: { firstName: true, lastName: true, username: true } } },
      });
      return rows.map((t) => ({
        id: t.id,
        title: name(t.user),
        subtitle: `@${t.user?.username ?? "—"}`,
        value: `${t.coins.toLocaleString("fa-IR")} سکه · ${t.amountToman.toLocaleString("fa-IR")} تومان`,
        tone: t.status === "COMPLETED" ? "gold" : "muted",
        createdAt: t.createdAt.toISOString(),
      }));
    }
    case "coinTransfers": {
      const rows = await prisma.coinTransfer.findMany({
        orderBy: { createdAt: "desc" },
        take: LIMIT,
        select: { id: true, coins: true, fee: true, type: true, createdAt: true, sender: { select: { id: true, firstName: true, lastName: true } }, receiver: { select: { id: true, firstName: true, lastName: true } } },
      });
      return rows.map((t) => ({
        id: t.id,
        title: `${name(t.sender)} ← ${name(t.receiver)}`,
        actors: [{ id: t.sender.id, name: name(t.sender) }, { id: t.receiver.id, name: name(t.receiver) }],
        subtitle: t.type === "GIFT" ? "هدیه سکه" : "درخواست سکه",
        value: `${t.coins.toLocaleString("fa-IR")} سکه · کارمزد ${t.fee.toLocaleString("fa-IR")}`,
        tone: "gold",
        createdAt: t.createdAt.toISOString(),
      }));
    }
    case "coinWithdrawals": {
      const rows = await prisma.withdrawRequest.findMany({
        orderBy: { createdAt: "desc" },
        take: LIMIT,
        select: { id: true, coins: true, amountToman: true, status: true, createdAt: true, user: { select: { firstName: true, lastName: true, username: true } } },
      });
      return rows.map((w) => ({
        id: w.id,
        title: name(w.user),
        subtitle: `@${w.user?.username ?? "—"}`,
        value: `${w.coins.toLocaleString("fa-IR")} سکه · ${w.amountToman.toLocaleString("fa-IR")} تومان`,
        tone: w.status === "PENDING" ? "gold" : w.status === "APPROVED" ? "green" : "red",
        createdAt: w.createdAt.toISOString(),
      }));
    }
    case "newSubscriptions": {
      const rows = await prisma.subscription.findMany({
        orderBy: { createdAt: "desc" },
        take: LIMIT,
        select: { id: true, coinsPaid: true, startsAt: true, endsAt: true, createdAt: true, user: { select: { firstName: true, lastName: true, username: true } } },
      });
      return rows.map((s) => ({
        id: s.id,
        title: name(s.user),
        subtitle: `@${s.user?.username ?? "—"}`,
        value: `${s.coinsPaid.toLocaleString("fa-IR")} سکه · تا ${s.endsAt.toLocaleDateString("fa-IR")}`,
        tone: "gold",
        createdAt: s.createdAt.toISOString(),
      }));
    }
    case "liveVoice":
    case "liveVideos": {
      const type = channel === "liveVoice" ? "VOICE" : "VIDEO";
      const rows = await prisma.message.findMany({
        where: { type },
        orderBy: { createdAt: "desc" },
        take: LIMIT,
        select: { id: true, duration: true, createdAt: true, sender: { select: { id: true, firstName: true, lastName: true, username: true } } },
      });
      return rows.map((m) => ({
        id: m.id,
        title: name(m.sender),
        actors: [{ id: m.sender?.id ?? null, name: name(m.sender) }],
        subtitle: `@${m.sender?.username ?? "—"}`,
        value: m.duration ? `${m.duration.toLocaleString("fa-IR")} ثانیه` : "بدون مدت",
        tone: "muted",
        createdAt: m.createdAt.toISOString(),
      }));
    }
    default:
      return null;
  }
}
