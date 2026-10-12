"use client";

// کلاینت صفحه فعالیت من — تایم لاین با آیکن رنگی برای هر نوع رویداد
import Link from "next/link";
import Image from "next/image";
import {
  Heart, Star, Users, Eye, Coins, Gift, Zap, Activity, Crown, Lock,
} from "lucide-react";
import VerifiedBadge from "@/components/dashboard/VerifiedBadge";
import DefaultAvatar from "@/components/dashboard/DefaultAvatar";
import { toPersianDigits, formatLastSeen } from "@/lib/format";

export type ActivityItem = {
  id: string;
  kind: "like" | "superlike" | "match" | "view" | "coin_out" | "coin_in" | "referral" | "boost";
  title: string;
  subtitle?: string;
  photoUrl?: string | null;
  username?: string;
  verified?: boolean;
  blurred?: boolean;
  time: string;
};

const kindStyle: Record<ActivityItem["kind"], { icon: typeof Heart; cls: string }> = {
  like: { icon: Heart, cls: "bg-ig-red/10 text-ig-red" },
  superlike: { icon: Star, cls: "bg-ig-blue/10 text-ig-blue" },
  match: { icon: Users, cls: "bg-ig-online/10 text-ig-online" },
  view: { icon: Eye, cls: "bg-ig-blue/10 text-ig-blue" },
  coin_out: { icon: Coins, cls: "bg-ig-gold/10 text-ig-gold" },
  coin_in: { icon: Coins, cls: "bg-ig-online/10 text-ig-online" },
  referral: { icon: Gift, cls: "bg-ig-red/10 text-ig-red" },
  boost: { icon: Zap, cls: "bg-ig-gold/10 text-ig-gold" },
};

export default function ActivityClient({
  items,
  premium,
  viewCount,
  viewerCount,
}: {
  items: ActivityItem[];
  premium: boolean;
  viewCount: number;
  viewerCount: number;
}) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 lg:pb-10">
      <h1 className="text-xl font-bold flex items-center gap-2 mb-1">
        <Activity className="w-6 h-6" />
        فعالیت من
      </h1>
      <p className="text-sm text-muted-foreground mb-5">
        لایک ها، مچ ها، بازدیدها و رویدادهای سکه ای تو
      </p>

      {/* کارت بازدیدکنندگان */}
      <div className="mb-6 p-4 rounded-2xl border border-ig-border bg-surface flex items-center gap-4">
        <div className="w-11 h-11 rounded-full bg-ig-blue/10 flex items-center justify-center shrink-0">
          <Eye className="w-5 h-5 text-ig-blue" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm">
            {toPersianDigits(viewCount)} بازدید از {toPersianDigits(viewerCount)} نفر
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {premium ? "هویت بازدیدکننده ها در لیست پایین مشخص است" : "با اشتراک ویژه هویت بازدیدکننده ها نمایان می شود"}
          </p>
        </div>
        {!premium && (
          <Link
            href="/dashboard/subscription"
            className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full bg-ig-gold/15 text-ig-gold text-xs font-bold"
          >
            <Crown className="w-4 h-4" />
            اشتراک
          </Link>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20">
          <Activity className="w-14 h-14 text-ig-border mx-auto mb-4" />
          <p className="font-medium">هنوز فعالیتی نداری</p>
          <p className="text-sm text-muted-foreground mt-1">از خانه شروع کن و بقیه را بشناس</p>
          <Link
            href="/dashboard"
            className="inline-block mt-4 px-6 py-2.5 rounded-full bg-ig-red text-white text-sm font-medium"
          >
            رفتن به خانه
          </Link>
        </div>
      ) : (
        <div className="space-y-1">
          {items.map((item) => {
            const style = kindStyle[item.kind];
            const Icon = style.icon;
            const inner = (
              <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-ig-gray-bg transition-colors">
                {/* عکس یا آیکن */}
                <div className="relative shrink-0">
                  {item.blurred ? (
                    <div className="w-12 h-12 rounded-full bg-ig-gray-bg flex items-center justify-center">
                      <Lock className="w-5 h-5 text-muted-foreground" />
                    </div>
                  ) : item.photoUrl ? (
                    <Image
                      src={item.photoUrl}
                      alt=""
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <DefaultAvatar size={48} />
                  )}
                  <span className={`absolute -bottom-0.5 -left-0.5 w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-background ${style.cls}`}>
                    <Icon className="w-3 h-3" />
                  </span>
                </div>
                {/* متن */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate flex items-center gap-1">
                    {item.title}
                    {item.verified && <VerifiedBadge className="w-3.5 h-3.5 shrink-0" />}
                  </p>
                  {item.subtitle && (
                    <p className="text-xs text-muted-foreground mt-0.5">{item.subtitle}</p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {formatLastSeen(new Date(item.time))}
                </span>
              </div>
            );
            return item.username ? (
              <Link key={item.id} href={`/profile/${item.username}`} className="block">
                {inner}
              </Link>
            ) : (
              <div key={item.id}>{inner}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
