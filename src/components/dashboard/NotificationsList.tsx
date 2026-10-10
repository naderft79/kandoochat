"use client";

// مرکز اعلان ها — کارت های گروه بندی شده بر اساس زمان با اکشن هر اعلان
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  MessageCircle, CheckCheck, BellOff, ChevronLeft,
} from "lucide-react";
import { formatLastSeen } from "@/lib/format";
import { cn } from "@/components/ui/cn";
import { useLiveData } from "@/components/dashboard/LiveDataProvider";
import { useToast } from "@/components/ToastProvider";
import PageHeader from "@/components/dashboard/PageHeader";
import { NOTIF_ICONS, DEFAULT_NOTIF_ICON, getNotifAction, type NotifAction } from "@/components/dashboard/notifConfig";

type Item = {
  id: string;
  type: string;
  title: string;
  body: string;
  data: string | null;
  isRead: boolean;
  createdAt: string;
};

// مقصد ردیف برای اعلان های بدون اکشن
const LINKS: Record<string, string> = {
  MATCH: "/dashboard/chat",
  GIFT_RECEIVED: "/dashboard/coins",
  SUBSCRIPTION_ENDING: "/dashboard/subscription",
  SUBSCRIPTION_PURCHASED: "/dashboard/subscription",
  COIN_PURCHASE: "/dashboard/coins",
  BOOST_ACTIVATED: "/dashboard",
};

function linkFor(n: Item): string | null {
  if (n.data) {
    try {
      const d = JSON.parse(n.data);
      if (d.link) return d.link;
      if (d.conversationId) return `/dashboard/chat/${d.conversationId}`;
    } catch {}
  }
  return LINKS[n.type] ?? null;
}

// گروه بندی زمانی اعلان ها
type Group = "today" | "week" | "older";
const GROUP_LABELS: Record<Group, string> = {
  today: "امروز",
  week: "این هفته",
  older: "قدیمی تر",
};

function groupOf(date: Date): Group {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (date >= startOfToday) return "today";
  const weekAgo = new Date(startOfToday.getTime() - 6 * 24 * 60 * 60 * 1000);
  return date >= weekAgo ? "week" : "older";
}

export default function NotificationsList({ items }: { items: Item[] }) {
  const router = useRouter();
  const { refresh } = useLiveData();
  const { toast } = useToast();
  const [list, setList] = useState(items);
  const [busy, setBusy] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  async function markRead(id?: string) {
    if (busy) return;
    setBusy(true);
    try {
      if (id) {
        await fetch("/api/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });
        setList((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      } else {
        await fetch("/api/notifications?all=true", { method: "PATCH" });
        setList((prev) => prev.map((n) => ({ ...n, isRead: true })));
      }
      refresh();
    } finally {
      setBusy(false);
    }
  }

  // شروع گفتگو با طرف مقابل اعلان — مستقیم وارد چت می شود
  async function startChat(n: Item, targetUserId: string) {
    if (actionLoadingId) return;
    setActionLoadingId(n.id);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId }),
      });
      if (res.status === 402) {
        router.push("/dashboard/subscription");
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast(data.error ?? "شروع گفتگو ناموفق بود", "error");
        return;
      }
      const data = await res.json();
      router.push(`/dashboard/chat/${data.conversationId}`);
    } catch {
      toast("خطا در ارتباط با سرور", "error");
    } finally {
      setActionLoadingId(null);
    }
  }

  // اجرای اکشن اعلان — گفتگو یا ناوبری به صفحه مرتبط
  function runAction(n: Item, action: NotifAction) {
    if (!n.isRead) void markRead(n.id);
    if (action.kind === "chat") void startChat(n, action.userId);
    else router.push(action.href);
  }

  function open(n: Item) {
    const action = getNotifAction(n.type, n.data);
    if (action) {
      runAction(n, action);
      return;
    }
    if (!n.isRead) void markRead(n.id);
    const link = linkFor(n);
    if (link) router.push(link);
  }

  const hasUnread = list.some((n) => !n.isRead);

  // گروه بندی آیتم ها با حفظ ترتیب زمانی
  const groups: { key: Group; label: string; items: Item[] }[] = [];
  for (const n of list) {
    const g = groupOf(new Date(n.createdAt));
    let bucket = groups.find((b) => b.key === g);
    if (!bucket) {
      bucket = { key: g, label: GROUP_LABELS[g], items: [] };
      groups.push(bucket);
    }
    bucket.items.push(n);
  }

  return (
    <div>
      <PageHeader
        title="اعلان ها"
        left={
          hasUnread ? (
            <button
              onClick={() => markRead()}
              disabled={busy}
              className="flex items-center gap-1.5 h-9 px-3 rounded-full bg-ig-btn2 text-xs font-bold text-foreground hover:bg-ig-btn2-hover transition-colors active:scale-95 disabled:opacity-50"
            >
              <CheckCheck className="w-4 h-4" />
              خواندن همه
            </button>
          ) : undefined
        }
      />

      <div className="max-w-md mx-auto lg:max-w-2xl px-4 py-4 pb-8">
        {list.length === 0 ? (
          <div className="py-24 flex flex-col items-center text-center px-6">
            <div className="w-24 h-24 rounded-full border-2 border-foreground flex items-center justify-center mb-5">
              <BellOff className="w-10 h-10 text-foreground" strokeWidth={1.5} />
            </div>
            <p className="text-lg font-bold text-foreground">اعلانی ندارید</p>
            <p className="text-sm text-ig-gray mt-1.5 leading-6">
              لایک ها، هدیه ها و رویدادهای مهم اینجا می آیند
            </p>
          </div>
        ) : (
          groups.map((group) => (
            <section key={group.key} className="mb-5 last:mb-0">
              <h2 className="text-xs font-bold text-ig-gray px-1 mb-2">{group.label}</h2>
              <ul className="space-y-2">
                {group.items.map((n, i) => {
                  const style = NOTIF_ICONS[n.type] ?? DEFAULT_NOTIF_ICON;
                  const Icon = style.icon;
                  const action = getNotifAction(n.type, n.data);
                  const clickable = !!action || !!linkFor(n);
                  const loading = actionLoadingId === n.id;
                  return (
                    <li key={n.id} className="ig-rise" style={{ animationDelay: `${Math.min(i * 50, 300)}ms` }}>
                      {/* کارت اعلان — div به جای button چون دکمه اکشن داخلش است */}
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => open(n)}
                        onKeyDown={(e) => e.key === "Enter" && open(n)}
                        className={cn(
                          "flex items-center gap-3 rounded-2xl border p-3.5 transition-colors",
                          clickable
                            ? "hover:border-ig-border hover:bg-ig-gray-bg/60 active:bg-ig-gray-bg cursor-pointer"
                            : "cursor-default",
                          n.isRead
                            ? "bg-white border-ig-divider"
                            : "bg-ig-blue/[0.04] border-ig-blue/20"
                        )}
                      >
                        {/* آیکون نوع اعلان + نقطه خوانده نشده */}
                        <div className={cn("relative w-11 h-11 rounded-full flex items-center justify-center shrink-0", style.bgCls)}>
                          <Icon
                            className={cn("w-5 h-5", style.iconCls)}
                            strokeWidth={1.8}
                            fill={n.type === "LIKE" || n.type === "MATCH" ? "currentColor" : "none"}
                          />
                          {!n.isRead && (
                            <span className="absolute -top-0.5 -end-0.5 w-3 h-3 rounded-full bg-ig-blue ring-2 ring-white" aria-label="خوانده نشده" />
                          )}
                        </div>

                        {/* متن اعلان */}
                        <div className="flex-1 min-w-0">
                          <p className={cn("text-sm leading-5", n.isRead ? "text-foreground" : "font-bold text-foreground")}>
                            {n.title}
                          </p>
                          <p className="text-xs text-ig-gray mt-0.5 leading-5">{n.body}</p>
                          <p className="text-[11px] text-ig-gray/80 mt-1">{formatLastSeen(new Date(n.createdAt))}</p>
                        </div>

                        {/* دکمه اکشن — سمت چپ، روبروی متن */}
                        {action && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              runAction(n, action);
                            }}
                            disabled={loading}
                            className={cn(
                              "shrink-0 inline-flex items-center gap-1 h-9 px-3.5 rounded-full text-xs font-bold active:scale-95 transition-all disabled:opacity-60",
                              action.kind === "chat"
                                ? "bg-ig-blue text-white hover:bg-ig-blue-hover"
                                : "bg-ig-btn2 text-foreground hover:bg-ig-btn2-hover"
                            )}
                          >
                            {action.kind === "chat" ? (
                              <MessageCircle className="w-4 h-4" />
                            ) : (
                              <ChevronLeft className="w-4 h-4" />
                            )}
                            {loading ? "..." : action.label}
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))
        )}
      </div>
    </div>
  );
}
