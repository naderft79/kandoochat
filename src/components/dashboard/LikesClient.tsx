"use client";

// کلاینت صفحه لایک ها — برای پریمیوم کارت کامل، برای رایگان کارت بلر و دعوت به اشتراک
import Link from "next/link";
import Image from "next/image";
import { Heart, Star, Lock, Crown, Sparkles } from "lucide-react";
import VerifiedBadge from "@/components/dashboard/VerifiedBadge";
import DefaultAvatar from "@/components/dashboard/DefaultAvatar";
import { toPersianDigits, formatLastSeen } from "@/lib/format";

export type LikeItem = {
  id: string;
  type: string;
  isMatched: boolean;
  createdAt: string;
  // فقط برای کاربران ویژه ارسال می شود
  sender?: {
    id: string;
    firstName: string;
    username: string;
    age: number;
    city: string;
    gender: string;
    isVerified: boolean;
    isOnline: boolean;
    photoUrl: string | null;
  };
};

type Props = {
  premium: boolean;
  items: LikeItem[];
  total: number;
  superTotal: number;
};

export default function LikesClient({ premium, items, total, superTotal }: Props) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24 lg:pb-10">
      {/* هدر آمار */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Heart className="w-6 h-6 text-ig-red" fill="currentColor" />
            چه کسانی تو را پسندیدند
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {toPersianDigits(total)} لایک
            {superTotal > 0 && ` · ${toPersianDigits(superTotal)} سوپر لایک`}
          </p>
        </div>
      </div>

      {/* بنر اشتراک برای کاربران رایگان */}
      {!premium && total > 0 && (
        <Link
          href="/dashboard/subscription"
          className="flex items-center gap-4 p-4 mb-6 rounded-2xl bg-ig-gold/10 border border-ig-gold/30 hover:border-ig-gold/50 transition-colors"
        >
          <div className="w-12 h-12 rounded-full bg-ig-gold/20 flex items-center justify-center shrink-0">
            <Crown className="w-6 h-6 text-ig-gold" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm">ببین چه کسی تو را پسندیده</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              با اشتراک ویژه هویت همه لایک کننده ها نمایان می شود
            </p>
          </div>
          <Sparkles className="w-5 h-5 text-ig-gold shrink-0" />
        </Link>
      )}

      {items.length === 0 ? (
        <div className="text-center py-20">
          <Heart className="w-14 h-14 text-ig-border mx-auto mb-4" />
          <p className="font-medium">هنوز کسی تو را لایک نکرده</p>
          <p className="text-sm text-muted-foreground mt-1">
            پروفایلت را کامل تر کن و عکس های بهتری بگذار
          </p>
          <Link
            href="/dashboard"
            className="inline-block mt-4 px-6 py-2.5 rounded-full bg-ig-red text-white text-sm font-medium"
          >
            رفتن به خانه
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {items.map((item) =>
            premium && item.sender ? (
              <PremiumCard key={item.id} item={item} />
            ) : (
              <BlurredCard key={item.id} item={item} />
            )
          )}
        </div>
      )}
    </div>
  );
}

function TypeBadge({ type }: { type: string }) {
  if (type === "SUPER_LIKE")
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-ig-blue text-white text-xs font-bold">
        <Star className="w-3 h-3" fill="currentColor" />
        سوپر لایک
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-ig-red text-white text-xs font-bold">
      <Heart className="w-3 h-3" fill="currentColor" />
      لایک
    </span>
  );
}

// کارت کامل برای کاربران ویژه
function PremiumCard({ item }: { item: LikeItem }) {
  const s = item.sender!;
  return (
    <Link
      href={`/profile/${s.id}`}
      className="group relative rounded-2xl overflow-hidden bg-ig-gray-bg border border-ig-border hover:border-foreground/20 transition-colors block"
    >
      <div className="relative aspect-[3/4]">
        {s.photoUrl ? (
          <Image
            src={s.photoUrl}
            alt={s.firstName}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <DefaultAvatar size={80} />
          </div>
        )}
        <div className="absolute top-2 right-2">
          <TypeBadge type={item.type} />
        </div>
        {item.isMatched && (
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-ig-online text-white text-xs font-bold">
            مچ شدید
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-10">
          <div className="flex items-center gap-1.5 text-white">
            <p className="font-bold text-sm truncate">
              {s.firstName}، {toPersianDigits(s.age)}
            </p>
            {s.isVerified && <VerifiedBadge className="w-3.5 h-3.5" />}
          </div>
          <p className="text-white/70 text-xs mt-0.5 truncate">
            {s.city} · {formatLastSeen(new Date(item.createdAt))}
          </p>
        </div>
        {s.isOnline && (
          <div className="absolute bottom-[72px] right-3 w-2.5 h-2.5 rounded-full bg-ig-online ring-2 ring-black/40" />
        )}
      </div>
    </Link>
  );
}

// کارت بلر شده برای کاربران رایگان — عکس از /api/likes/blur می آید و غیرقابل بازیابی است
function BlurredCard({ item }: { item: LikeItem }) {
  return (
    <Link
      href="/dashboard/subscription"
      className="group relative rounded-2xl overflow-hidden bg-ig-gray-bg border border-ig-border hover:border-ig-gold/40 transition-colors block"
    >
      <div className="relative aspect-[3/4]">
        {/* eslint-disable-next-line @next/next/no-img-element -- مسیر داینامیک API، نیازی به بهینه سازی ندارد */}
        <img
          src={`/api/likes/blur/${item.id}`}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute top-2 right-2">
          <TypeBadge type={item.type} />
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30">
          <Lock className="w-8 h-8 text-white/90 mb-2" />
          <p className="text-white text-xs font-medium px-3 text-center">
            با اشتراک ویژه ببین
          </p>
        </div>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-8">
          <p className="text-white/80 text-xs">{formatLastSeen(new Date(item.createdAt))}</p>
        </div>
      </div>
    </Link>
  );
}
