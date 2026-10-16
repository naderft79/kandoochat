"use client";

// در یک نگاه — بالای داشبورد ادمین (۴۸ بنر، ۶ در هر ردیف)
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BadgeCheck, Image, Images, Users, CircleDot,
  Banknote, Flag, Gift, CreditCard, XCircle,
  Ban, UserX, ShieldX, Eye, CheckCircle, CheckCircle2,
  ThumbsDown, CalendarX, Rocket, Star, Wifi, Sparkles,
  Crown, Clock,
  UserCheck, MessageSquare, Heart, Receipt, Coins,
  UserPlus, Target, Flame, Heart as InterestIcon, BarChart3, ScrollText,
  TrendingUp, CalendarDays, Landmark, Wallet as WalletIcon, Activity as ActivityIcon,
  Ticket as TicketIcon, CheckCheck, AlertTriangle, Archive, Inbox, MessageCircleQuestion,
} from "lucide-react";
import { toPersianDigits } from "@/lib/format";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number; style?: React.CSSProperties }>> = {
  verify: BadgeCheck,
  profile: Image,
  gallery: Images,
  users: Users,
  stories: CircleDot,
  withdrawals: Banknote,
  reports: Flag,
  coins: Gift,
  payment: CreditCard,
  failed: XCircle,
  rejected: Ban,
  inactive: UserX,
  rejectedVerify: ShieldX,
  reviewed: Eye,
  actioned: CheckCircle,
  approved: CheckCircle2,
  rejectedWithdraw: ThumbsDown,
  expiredSub: CalendarX,
  boost: Rocket,
  special: Star,
  online: Wifi,
  activeStory: Sparkles,
  activeSub: Crown,
  pendingTransfer: Clock,
  totalUsers: Users,
  verifiedUsers: UserCheck,
  todayMsg: MessageSquare,
  todayLike: Heart,
  totalTx: Receipt,
  circulating: Coins,
  referral: UserPlus,
  mission: Target,
  streak: Flame,
  interest: InterestIcon,
  profileView: BarChart3,
  audit: ScrollText,
  // آیکون های مالی
  todayRevenue: TrendingUp,
  weekRevenue: CalendarDays,
  todaySub: Crown,
  totalWithdraw: Landmark,
  avgCoins: WalletIcon,
  todayTx: ActivityIcon,
  // آیکون های تیکت
  openTicket: TicketIcon,
  answeredTicket: CheckCheck,
  highPriority: AlertTriangle,
  closedTicket: Archive,
  todayTicket: Inbox,
  unansweredTicket: MessageCircleQuestion,
};

type AlertItem = {
  label: string;
  count: number;
  href: string;
  icon: string;
  color: string;
};

export default function AdminAlertsBanner() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchAlerts() {
      try {
        const res = await fetch("/api/admin/alerts?_t=" + Date.now(), {
          cache: "no-store",
        });
        if (res.ok && !cancelled) {
          const data = await res.json();
          setAlerts(data.alerts ?? []);
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAlerts();
    // ریل تایم: هر ۳۰ ثانیه به روز می شود و با برگشتن به تب فوراً تازه می شود
    const interval = setInterval(fetchAlerts, 30_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") fetchAlerts();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {Array.from({ length: 48 }).map((_, i) => (
          <div key={i} className="lux-card p-3 h-[72px] lux-shimmer" />
        ))}
      </div>
    );
  }

  if (alerts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold text-[#e8e8e8]">در یک نگاه</span>
        <span className="text-[10px] text-[#888]">({toPersianDigits(alerts.length)} مورد)</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {alerts.map((alert) => {
          const Icon = ICON_MAP[alert.icon] ?? Users;
          const hasAlert = alert.count > 0;
          return (
            <Link
              key={alert.label}
              href={alert.href}
              className={`group relative lux-card p-3 overflow-hidden ${
                hasAlert ? "border-[rgba(212,175,55,0.25)]" : ""
              }`}
            >
              <div
                className={`absolute top-0 right-0 w-1 h-full transition-all group-hover:w-1.5 ${hasAlert ? "" : "opacity-30"}`}
                style={{ background: alert.color }}
              />
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
                  style={{ background: `${alert.color}15`, border: `1px solid ${alert.color}30` }}
                >
                  <Icon className="w-3.5 h-3.5" strokeWidth={2.5} style={{ color: alert.color }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] text-[#888] font-bold truncate leading-tight">{alert.label}</p>
                  <p className={`text-base font-extrabold leading-tight ${hasAlert ? "text-[#e8e8e8]" : "text-[#666]"}`}>
                    {toPersianDigits(alert.count)}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
