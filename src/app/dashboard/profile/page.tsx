// صفحه پروفایل: چیدمان اینستاگرام — آواتار + آمار در یک ردیف، نام و بیو، دو دکمه خاکستری
import { redirect } from "next/navigation";
import {
  MapPin,
  Ruler,
  Weight,
  Briefcase,
  Car,
  Wallet,
  Star,
} from "lucide-react";
import VerifiedBadge from "@/components/dashboard/VerifiedBadge";
import { getCurrentUser } from "@/lib/auth";
import { hasActiveSubscription } from "@/lib/finance";
import { prisma } from "@/lib/prisma";
import { calculateProfileCompletion } from "@/lib/badges";
import { toPersianDigits, formatToman } from "@/lib/format";
import ProfileHeader from "@/components/dashboard/ProfileHeader";
import ProfileActions from "@/components/dashboard/ProfileActions";
import OtpVerification from "@/components/dashboard/OtpVerification";
import PhotoGallery from "@/components/dashboard/PhotoGallery";
import AvatarUploader from "@/components/dashboard/AvatarUploader";
import BoostButton from "@/components/dashboard/BoostButton";
import FeaturedButton from "@/components/dashboard/FeaturedButton";
import ReferralRow from "@/components/dashboard/ReferralRow";
import VerifyFeatureButtons from "@/components/dashboard/VerifyFeatureButtons";
import GoldenStoryButton from "@/components/dashboard/GoldenStoryButton";
import SpecialMissionsButton from "@/components/dashboard/SpecialMissionsButton";
import PaymentResultModal from "@/components/dashboard/PaymentResultModal";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [hasSubscription, viewCount, photos, likeCount] = await Promise.all([
    hasActiveSubscription(user.id),
    prisma.profileView.count({ where: { viewedId: user.id } }),
    prisma.profilePhoto.findMany({
      where: { userId: user.id, isRejected: false, isDeletedByUser: false },
      orderBy: { order: "asc" },
    }),
    prisma.like.count({
      where: { receiverId: user.id, type: "LIKE" },
    }),
  ]);

  const profilePhoto = photos.find((p) => p.isProfile && !p.isRejected) ?? null;
  const galleryPhotos = photos
    .filter((p) => !p.isProfile)
    .map((p) => ({
      id: p.id,
      url: p.url,
      order: p.order,
      isVerified: p.isVerified,
      isRejected: p.isRejected,
    }));

  const completion = calculateProfileCompletion(user);

  const infoItems = [
    { icon: MapPin, label: "شهر", value: user.city },
    { icon: MapPin, label: "استان", value: user.province },
    {
      icon: Ruler,
      label: "قد",
      value: `${toPersianDigits(user.height)} سانتی متر`,
    },
    {
      icon: Weight,
      label: "وزن",
      value: `${toPersianDigits(user.weight)} کیلوگرم`,
    },
    { icon: Briefcase, label: "شغل", value: user.job || "—" },
    { icon: Car, label: "ماشین", value: user.carModel || "—" },
    {
      icon: Wallet,
      label: "درآمد",
      value: user.income ? formatToman(user.income) : "—",
    },
    { icon: MapPin, label: "محله", value: user.neighborhood || "—" },
  ];

  return (
    <div className="min-h-screen bg-white">
      <ProfileHeader username={user.username} />

      <div className="max-w-[600px] mx-auto px-4 md:px-6 pb-20">
        {/* === کارت هدر پروفایل — چیدمان اینستاگرام === */}
        <div className="relative mt-4 md:mt-8">
          {user.isSpecial && (
            <div className="absolute -top-2 left-4 z-10">
              <SpecialMissionsButton />
            </div>
          )}
          <div className="relative overflow-hidden rounded-2xl border border-ig-border bg-white p-5 md:p-6">
            {/* ردیف اول: آواتار + ۳ آمار با جداکننده در یک ردیف */}
            <div className="flex items-center gap-5 md:gap-8">
              <AvatarUploader
                initialUrl={profilePhoto?.url ?? null}
                firstName={user.firstName}
                isVerified={user.isVerified}
                photoVerified={profilePhoto?.isVerified ?? false}
              />
              <div className="flex-1 flex items-center justify-around">
                <div className="text-center">
                  <p className="text-lg font-black text-foreground leading-tight">
                    {toPersianDigits(viewCount)}
                  </p>
                  <p className="text-xs text-ig-gray mt-0.5">بازدید</p>
                </div>
                <span className="w-px h-8 bg-ig-divider" aria-hidden />
                <div className="text-center">
                  <p
                    className={`text-base font-black leading-tight mt-0.5 ${
                      hasSubscription ? "text-foreground" : "text-ig-gray"
                    }`}
                  >
                    {hasSubscription ? "فعال" : "غیرفعال"}
                  </p>
                  <p className="text-xs text-ig-gray mt-0.5">اشتراک</p>
                </div>
                <span className="w-px h-8 bg-ig-divider" aria-hidden />
                <div className="text-center">
                  <p className="text-lg font-black text-foreground leading-tight">
                    {toPersianDigits(likeCount)}
                  </p>
                  <p className="text-xs text-ig-gray mt-0.5">لایک</p>
                </div>
              </div>
            </div>

            {/* نام + سن + شهر + بیو */}
            <div className="mt-4">
              <h1 className="text-base font-bold text-foreground flex items-center gap-1.5">
                <span className="truncate">
                  {user.firstName} {user.lastName}
                </span>
                {user.isVerified && (
                  <VerifiedBadge className="w-4.5 h-4.5 shrink-0" />
                )}
                {user.isSpecial && (
                  <Star
                    className="w-4 h-4 text-ig-gold fill-ig-gold shrink-0"
                    role="img"
                    aria-label="کاربر ویژه"
                  />
                )}
              </h1>
              <p className="text-sm text-ig-gray mt-1 flex items-center gap-1.5 flex-wrap">
                <span dir="ltr">@{user.username}</span>
                <span className="text-ig-divider">·</span>
                <span>{toPersianDigits(user.age)} ساله</span>
                <span className="text-ig-divider">·</span>
                <span className="flex items-center gap-0.5">
                  <MapPin className="w-3.5 h-3.5" />
                  {user.city}
                </span>
              </p>
              {user.bio && (
                <p className="text-sm text-foreground mt-2 leading-6 whitespace-pre-line">
                  {user.bio}
                </p>
              )}
            </div>

            {/* دو دکمه خاکستری */}
            <ProfileActions
              initial={{
                username: user.username,
                firstName: user.firstName,
                lastName: user.lastName,
                province: user.province,
                city: user.city,
                age: user.age,
                height: user.height,
                weight: user.weight,
                income: user.income,
                carModel: user.carModel,
                neighborhood: user.neighborhood,
                job: user.job,
                bio: user.bio,
              }}
            />
          </div>
        </div>

        {/* === تکمیل پروفایل — فقط در حالت ناقص === */}
        {completion < 100 && (
          <div className="mt-4 rounded-2xl border border-ig-border bg-white p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-foreground">
                تکمیل پروفایل
              </span>
              <span className="text-sm font-black text-foreground">
                {toPersianDigits(completion)}٪
              </span>
            </div>
            <div className="h-1.5 bg-ig-divider rounded-full overflow-hidden">
              <div
                className="h-full bg-ig-blue rounded-full transition-all duration-500"
                style={{ width: `${completion}%` }}
              />
            </div>
            <p className="text-xs text-ig-gray mt-2">
              با تکمیل پروفایل، دیده شدن شما بیشتر می شود
            </p>
          </div>
        )}

        {/* OTP اگر موبایل تایید نشده */}
        {!user.phoneVerified && (
          <div className="mt-4">
            <OtpVerification
              phoneVerified={user.phoneVerified}
              phone={user.phone}
            />
          </div>
        )}

        {/* === گالری عکس === */}
        <div className="mt-5">
          <PhotoGallery initialPhotos={galleryPhotos} />
        </div>

        {/* === علایق === (مخفی شده — برای فعال سازی کامنت را بردار) */}

        {/* === اطلاعات شخصی — کارت سفید با گرید تمیز === */}
        <div className="mt-6">
          <h3 className="text-sm font-black text-foreground mb-3 flex items-center gap-1.5">
            اطلاعات شخصی
          </h3>
          <div className="rounded-2xl border border-ig-border bg-white p-1.5">
            <div className="grid grid-cols-2">
              {infoItems.map((item, i) => (
                <div
                  key={item.label}
                  className={`flex items-center gap-3 p-3 ${
                    i % 2 === 0 ? "border-l border-ig-divider" : ""
                  } ${
                    i < infoItems.length - 2 ? "border-b border-ig-divider" : ""
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-ig-gray-bg flex items-center justify-center shrink-0 text-ig-gray">
                    <item.icon className="w-4 h-4" aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-ig-gray">{item.label}</p>
                    <p className="text-sm font-bold text-foreground truncate">
                      {item.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* === قابلیت های ویژه — لیست اینستاگرامی === */}
        <section className="mt-6" aria-labelledby="features-title">
          <h3
            id="features-title"
            className="text-base font-black text-foreground mb-3"
          >
            قابلیت های ویژه
          </h3>
          <div className="rounded-xl border border-ig-border bg-white divide-y divide-ig-divider overflow-hidden">
            <FeaturedButton />
            <GoldenStoryButton />
            <BoostButton />
            <VerifyFeatureButtons />
            <ReferralRow />
          </div>
        </section>

      </div>
      <PaymentResultModal />
    </div>
  );
}
