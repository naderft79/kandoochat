// پیکربندی نمایش اعلان ها — آیکون، رنگ و اکشن هر نوع (مشترک بین لیست اعلان ها و بنر زنده)
import {
  Heart, Star, Eye, Gift, Coins, Crown, Zap, Megaphone, MessageCircle,
  BadgeCheck, ShieldCheck, Sparkles, type LucideIcon,
} from "lucide-react";

export type NotifIconStyle = { icon: LucideIcon; iconCls: string; bgCls: string };

export const NOTIF_ICONS: Record<string, NotifIconStyle> = {
  LIKE: { icon: Heart, iconCls: "text-ig-like", bgCls: "bg-ig-like/10" },
  SUPER_LIKE: { icon: Star, iconCls: "text-ig-blue", bgCls: "bg-ig-blue/10" },
  MATCH: { icon: Heart, iconCls: "text-white", bgCls: "bg-gradient-to-br from-ig-like to-ig-purple" },
  PROFILE_VIEW: { icon: Eye, iconCls: "text-ig-gray", bgCls: "bg-ig-gray-bg" },
  GIFT_RECEIVED: { icon: Gift, iconCls: "text-ig-gold", bgCls: "bg-ig-gold/15" },
  REQUEST_RECEIVED: { icon: Coins, iconCls: "text-ig-gold", bgCls: "bg-ig-gold/15" },
  REQUEST_APPROVED: { icon: Coins, iconCls: "text-ig-blue", bgCls: "bg-ig-blue/10" },
  REQUEST_REJECTED: { icon: Coins, iconCls: "text-ig-gray", bgCls: "bg-ig-gray-bg" },
  COIN_PURCHASE: { icon: Coins, iconCls: "text-ig-gold", bgCls: "bg-ig-gold/15" },
  SUBSCRIPTION_PURCHASED: { icon: Crown, iconCls: "text-ig-blue", bgCls: "bg-ig-blue/10" },
  SUBSCRIPTION_ENDING: { icon: Crown, iconCls: "text-ig-gold", bgCls: "bg-ig-gold/15" },
  BOOST_ACTIVATED: { icon: Zap, iconCls: "text-ig-blue", bgCls: "bg-ig-blue/10" },
  GOLDEN_STORY: { icon: Sparkles, iconCls: "text-ig-gold", bgCls: "bg-ig-gold/15" },
  FEATURED_PENDING: { icon: Sparkles, iconCls: "text-ig-gray", bgCls: "bg-ig-gray-bg" },
  FEATURED_APPROVED: { icon: Sparkles, iconCls: "text-ig-gold", bgCls: "bg-ig-gold/15" },
  FEATURED_REJECTED: { icon: Sparkles, iconCls: "text-ig-gray", bgCls: "bg-ig-gray-bg" },
  VERIFY_BADGE: { icon: BadgeCheck, iconCls: "text-ig-blue", bgCls: "bg-ig-blue/10" },
  VERIFY_IDENTITY: { icon: ShieldCheck, iconCls: "text-ig-online", bgCls: "bg-ig-online/10" },
  ADMIN_BROADCAST: { icon: Megaphone, iconCls: "text-foreground", bgCls: "bg-ig-gray-bg" },
  MESSAGE: { icon: MessageCircle, iconCls: "text-ig-blue-bright", bgCls: "bg-ig-blue/10" },
};

export const DEFAULT_NOTIF_ICON: NotifIconStyle = {
  icon: MessageCircle,
  iconCls: "text-foreground",
  bgCls: "bg-ig-gray-bg",
};

// اکشن دکمه اعلان — گفتگو با کاربر یا رفتن به صفحه
export type NotifAction =
  | { kind: "chat"; userId: string; label: string }
  | { kind: "link"; href: string; label: string };

function parseData(data: string | null): Record<string, unknown> {
  if (!data) return {};
  try {
    return JSON.parse(data) as Record<string, unknown>;
  } catch {
    return {};
  }
}

// تعیین اکشن هر اعلان بر اساس نوع و data — پیام های خبری اکشن ندارند
export function getNotifAction(type: string, data: string | null): NotifAction | null {
  const d = parseData(data);

  switch (type) {
    case "LIKE":
    case "SUPER_LIKE": {
      const userId = typeof d.senderId === "string" ? d.senderId : null;
      return userId ? { kind: "chat", userId, label: "شروع گفتگو" } : null;
    }
    case "MATCH": {
      const userId = typeof d.matchUserId === "string" ? d.matchUserId
        : typeof d.senderId === "string" ? d.senderId : null;
      return userId
        ? { kind: "chat", userId, label: "شروع گفتگو" }
        : { kind: "link", href: "/dashboard/chat", label: "گفتگوها" };
    }
    case "GIFT_RECEIVED": {
      const convId = typeof d.conversationId === "string" ? d.conversationId : null;
      if (convId) return { kind: "link", href: `/dashboard/chat/${convId}`, label: "گفتگو" };
      const userId = typeof d.senderId === "string" ? d.senderId : null;
      return userId ? { kind: "chat", userId, label: "گفتگو" } : null;
    }
    case "COIN_PURCHASE":
      return { kind: "link", href: "/dashboard/coins", label: "کیف پول" };
    case "SUBSCRIPTION_PURCHASED":
      return { kind: "link", href: "/dashboard/subscription", label: "اشتراک من" };
    case "SUBSCRIPTION_ENDING":
      return { kind: "link", href: "/dashboard/subscription", label: "تمدید اشتراک" };
    case "VERIFY_BADGE":
    case "VERIFY_IDENTITY":
      return d.status === "REJECTED"
        ? { kind: "link", href: "/dashboard/verify", label: "تلاش مجدد" }
        : { kind: "link", href: "/dashboard/profile", label: "پروفایل" };
    case "REQUEST_RECEIVED":
    case "REQUEST_APPROVED":
      return { kind: "link", href: "/dashboard/coins", label: "کیف پول" };
    default:
      // اعلان های دارای لینک سفارشی
      return typeof d.link === "string" ? { kind: "link", href: d.link, label: "مشاهده" } : null;
  }
}

// مقصد کلیک روی اعلان — برای توست زنده (بدون نیاز به اکشن گفتگو)
export function getNotifHref(type: string, data: string | null): string {
  const d = parseData(data);
  if (typeof d.link === "string") return d.link;
  if (typeof d.conversationId === "string") return `/dashboard/chat/${d.conversationId}`;
  // شناسایی کاربر بر اساس id ثابت — با تغییر آیدی هم لینک کار می کند
  const userId =
    typeof d.matchUserId === "string" && d.matchUserId ? d.matchUserId
    : typeof d.senderId === "string" && d.senderId ? d.senderId
    : null;

  switch (type) {
    // لایک و مچ → پروفایل کسی که لایک کرده
    case "LIKE":
    case "SUPER_LIKE":
    case "MATCH":
      return userId ? `/profile/${userId}` : "/dashboard/likes";
    // سکه و هدیه → اگر گفتگو دارد همان چت، وگرنه صفحه لایک ها
    case "GIFT_RECEIVED":
    case "REQUEST_RECEIVED":
    case "REQUEST_APPROVED":
    case "REQUEST_REJECTED":
    case "COIN_PURCHASE":
      return "/dashboard/likes";
    case "SUBSCRIPTION_PURCHASED":
    case "SUBSCRIPTION_ENDING":
      return "/dashboard/subscription";
    case "VERIFY_BADGE":
    case "VERIFY_IDENTITY":
      return "/dashboard/profile";
    case "PROFILE_VIEW":
      return "/dashboard/activity";
    default:
      return "/dashboard/notifications";
  }
}
