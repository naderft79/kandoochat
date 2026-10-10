// صفحه لینک عمومی پروفایل کاربر — بر اساس یوزرنیم (همان استایل صفحه پروفایل اصلی)
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { MapPin, Ruler, Weight, Briefcase, Car, Wallet, Sparkles, ShieldCheck, Phone, ArrowRight, Star } from "lucide-react";
import VerifiedBadge from "@/components/dashboard/VerifiedBadge";
import { prisma } from "@/lib/prisma";
import { toPersianDigits, formatToman, formatLastSeen } from "@/lib/format";
import { getUserBadges } from "@/lib/badges";
import { getCurrentUser } from "@/lib/auth";
import { hasActiveSubscription } from "@/lib/finance";
import PageHeader from "@/components/dashboard/PageHeader";
import DefaultAvatar from "@/components/dashboard/DefaultAvatar";
import PublicProfileActions from "@/components/dashboard/PublicProfileActions";
import PublicGallery from "@/components/dashboard/PublicGallery";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const user = await prisma.user.findUnique({
    where: { username, isActive: true, role: "USER" },
    select: { firstName: true, lastName: true, age: true, city: true, bio: true, isVerified: true },
  });

  if (!user) {
    return { title: "کاربر یافت نشد" };
  }

  const title = `${user.firstName} ${user.lastName} — ${toPersianDigits(user.age)} ساله، ${user.city}`;
  const description = user.bio
    ? `${user.firstName} ${user.lastName} از ${user.city} — ${user.bio.slice(0, 150)}`
    : `${user.firstName} ${user.lastName}، ${toPersianDigits(user.age)} ساله از ${user.city}. پروفایل در سایت همسریابی کندو.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
      locale: "fa_IR",
    },
  };
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  const user = await prisma.user.findUnique({
    where: { username, isActive: true, role: "USER" },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      username: true,
      gender: true,
      age: true,
      height: true,
      weight: true,
      city: true,
      province: true,
      neighborhood: true,
      job: true,
      carModel: true,
      income: true,
      bio: true,
      isVerified: true,
      isSpecial: true,
      phoneVerified: true,
      isOnline: true,
      lastSeen: true,
      createdAt: true,
      photos: { select: { id: true, url: true, order: true, isProfile: true, isVerified: true }, where: { isVerified: true, isRejected: false, isDeletedByUser: false }, orderBy: { order: "asc" } },
    },
  });

  if (!user) notFound();

  const viewer = await getCurrentUser();

  const [badges, hasSubscription, likeCount, viewerLike] = await Promise.all([
    getUserBadges(user.id),
    hasActiveSubscription(user.id),
    prisma.like.count({
      where: { receiverId: user.id, type: "LIKE" },
    }),
    viewer
      ? prisma.like.findUnique({
          where: { senderId_receiverId_type: { senderId: viewer.id, receiverId: user.id, type: "LIKE" } },
          select: { id: true },
        })
      : Promise.resolve(null),
  ]);

  const infoItems = [
    { icon: MapPin, label: "شهر", value: user.city },
    { icon: MapPin, label: "استان", value: user.province },
    { icon: Ruler, label: "قد", value: `${toPersianDigits(user.height)} سانتی متر` },
    { icon: Weight, label: "وزن", value: `${toPersianDigits(user.weight)} کیلوگرم` },
    { icon: Briefcase, label: "شغل", value: user.job || "—" },
    { icon: Car, label: "ماشین", value: user.carModel || "—" },
    { icon: Wallet, label: "درآمد", value: user.income ? formatToman(user.income) : "—" },
    { icon: MapPin, label: "محله", value: user.neighborhood || "—" },
  ];

  return (
    <div className="min-h-screen bg-ig-gray-bg">
      <PageHeader
        center={<span className="text-lg font-bold text-foreground">@{user.username}</span>}
        left={
          <Link
            href="/dashboard"
            className="p-1.5 rounded-lg hover:bg-ig-gray-bg active:scale-90 transition-all"
          >
            <ArrowRight className="w-6 h-6 text-foreground" strokeWidth={1.5} />
          </Link>
        }
      />

      <div className="max-w-[600px] mx-auto px-4 md:px-6 pb-20">

        {/* === کارت هدر پروفایل === */}
        <div className="relative mt-4 md:mt-8">
          {/* بج ویژه فقط برای صاحب پروفایل نمایش داده می شود */}
          {user.isSpecial && viewer?.id === user.id && (
            <div className="absolute -top-2 left-4 z-10 flex items-center gap-1 px-3 py-1 rounded-full bg-ig-red text-white text-xs font-black ig-shadow-lg">
              <Star className="w-3.5 h-3.5 fill-ig-gold text-ig-gold" />
              ویژه
            </div>
          )}
          <div className="relative overflow-hidden rounded-3xl bg-neutral-200 p-[1.5px] ig-shadow-lg">
            <div className="rounded-3xl bg-white p-5 md:p-6">
              {/* ردیف اول: آواتار + نام + آمار */}
              <div className="flex items-center gap-4 md:gap-5">
                {/* آواتار */}
                <div className="relative shrink-0">
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden ig-shadow-lg flex items-center justify-center">
                    {user.photos?.find((p) => p.isProfile)?.url ? (
                      <div className="relative w-full h-full">
                        <Image src={user.photos.find((p) => p.isProfile)!.url} alt={user.firstName} fill className="object-cover" sizes="96px" />
                      </div>
                    ) : (
                      <DefaultAvatar size={80} className="md:!w-24 md:!h-24" />
                    )}
                  </div>
                  {user.isVerified && (
                    <span className="absolute -bottom-1 -right-1 z-10">
                      <VerifiedBadge className="w-6 h-6" />
                    </span>
                  )}
                </div>

                {/* نام + سن + شهر */}
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg md:text-xl font-black text-foreground truncate flex items-center gap-1.5">
                    {user.firstName} {user.lastName}
                    {user.isVerified && <VerifiedBadge className="w-5 h-5 shrink-0" />}
                    {user.isSpecial && viewer?.id === user.id && (
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-ig-red text-white text-xs font-black shrink-0">
                        <Star className="w-3 h-3 fill-ig-gold text-ig-gold" />
                        ویژه
                      </span>
                    )}
                  </h1>
                  <p className="text-xs md:text-sm text-foreground/60 mt-0.5 flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold">@{user.username}</span>
                    <span className="text-foreground/20">|</span>
                    <span className="font-bold">{toPersianDigits(user.age)} ساله</span>
                    <span className="text-foreground/20">|</span>
                    <span className="flex items-center gap-0.5">
                      <MapPin className="w-3 h-3 text-neutral-400" />
                      {user.city}
                    </span>
                  </p>
                  {user.bio && (
                    <p className="text-xs text-foreground/50 mt-1 line-clamp-2 leading-5">{user.bio}</p>
                  )}
                </div>
              </div>

              {/* آمار — ۳ کارت */}
              <div className="grid grid-cols-3 gap-2 mt-4">
                <div className="rounded-xl bg-neutral-100 px-2 py-2.5 text-center">
                  <p className={`text-base font-black ${hasSubscription ? "text-neutral-800" : "text-neutral-400"}`}>
                    {hasSubscription ? "فعال" : "غیرفعال"}
                  </p>
                  <p className="text-xs text-neutral-500 font-bold">اشتراک</p>
                </div>
                <div className="rounded-xl bg-neutral-100 px-2 py-2.5 text-center">
                  <p className="text-base font-black text-neutral-800">{toPersianDigits(likeCount)}</p>
                  <p className="text-xs text-neutral-500 font-bold">لایک</p>
                </div>
                <div className="rounded-xl bg-neutral-100 px-2 py-2.5 text-center">
                  <p className={`text-base font-black flex items-center justify-center gap-0.5 ${user.isOnline ? "text-ig-gray" : "text-neutral-400"}`}>
                    {user.isOnline ? "آنلاین" : "آفلاین"}
                  </p>
                  <p className="text-xs text-neutral-500 font-bold">
                    {user.isOnline ? "وضعیت" : `آخرین بازدید ${formatLastSeen(user.lastSeen)}`}
                  </p>
                </div>
              </div>

              {/* نوار وضعیت: تایید موبایل + تایید هویت */}
              <div className="flex flex-wrap gap-2 mt-3">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${user.phoneVerified ? "bg-neutral-100" : "bg-neutral-100"}`}>
                  <Phone className={`w-3.5 h-3.5 ${user.phoneVerified ? "text-foreground" : "text-neutral-400"}`} />
                  <span className={`text-xs font-bold ${user.phoneVerified ? "text-foreground" : "text-neutral-400"}`}>
                    {user.phoneVerified ? "موبایل تایید شده" : "موبایل تایید نشده"}
                  </span>
                </div>

                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${user.isVerified ? "bg-neutral-100" : "bg-neutral-100"}`}>
                  <ShieldCheck className={`w-3.5 h-3.5 ${user.isVerified ? "text-foreground" : "text-neutral-400"}`} />
                  <span className={`text-xs font-bold ${user.isVerified ? "text-foreground" : "text-neutral-500"}`}>
                    {user.isVerified ? "هویت تایید شده" : "هویت تایید نشده"}
                  </span>
                </div>
              </div>

              {/* اکشن ها: گفتگو آبی + لایک خاکستری + منو */}
              <PublicProfileActions
                targetUserId={user.id}
                username={user.username}
                firstName={user.firstName}
                initialLiked={!!viewerLike}
                loggedIn={!!viewer}
              />
            </div>
          </div>
        </div>

        {/* === نشان ها === */}
        {badges.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-black text-foreground mb-3 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-neutral-700" />
              نشان ها
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {badges.map((b) => (
                <span
                  key={b.key}
                  className={`text-xs px-3 py-1.5 rounded-full bg-ig-gray-bg ${b.color} font-bold`}
                >
                  {b.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* === گالری عکس + لایت باکس === */}
        {user.photos.filter((p) => !p.isProfile).length > 0 && (
          <div className="mt-5">
            <h3 className="text-sm font-black text-foreground mb-3 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-neutral-700" />
              عکس ها
            </h3>
            <PublicGallery
              photos={user.photos.filter((p) => !p.isProfile).map((p) => ({ id: p.id, url: p.url }))}
              name={user.firstName}
            />
          </div>
        )}

        {/* === اطلاعات شخصی === */}
        <div className="mt-5">
          <h3 className="text-sm font-black text-foreground mb-3 flex items-center gap-1.5">
            اطلاعات شخصی
          </h3>
          <div className="grid grid-cols-2 gap-2.5">
            {infoItems.map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-2.5 rounded-2xl bg-neutral-50 p-3 ig-shadow-sm"
              >
                <div className="w-8 h-8 rounded-xl bg-neutral-200 flex items-center justify-center shrink-0 text-neutral-700">
                  <item.icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-ig-gray font-bold">{item.label}</p>
                  <p className="text-xs font-black text-foreground truncate">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
