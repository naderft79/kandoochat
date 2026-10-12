// داشبورد کاربر: سبک feed اینستاگرام — استوری + کارت پروفایل کاربر
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { Crown, Plus, Users } from "lucide-react";
import VerifiedBadge from "@/components/dashboard/VerifiedBadge";
import DefaultAvatar from "@/components/dashboard/DefaultAvatar";
import { getHomeFeed, newSeed, FEED_SEED_COOKIE } from "@/lib/homeFeed";
import { getCurrentUser } from "@/lib/auth";
import { getActiveSubscription } from "@/lib/finance";
import { toPersianDigits } from "@/lib/format";
import CoinBadge from "@/components/dashboard/CoinBadge";
import KandooLogo from "@/components/KandooLogo";
import PageHeader from "@/components/dashboard/PageHeader";
import NotificationBell from "@/components/dashboard/NotificationBell";
import FeedList from "@/components/dashboard/FeedList";
import EmptyState from "@/components/dashboard/EmptyState";
import StoryBar from "@/components/dashboard/StoryBar";
import PaymentResultModal from "@/components/dashboard/PaymentResultModal";
import FeaturedRail from "@/components/dashboard/FeaturedRail";
import { getFeaturedUsers } from "@/lib/featuredServer";
import OnboardingChecklist from "@/components/dashboard/OnboardingChecklist";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // seed نشست فید: ترتیب پایدار تا ۳۰ دقیقه (کوکی)، در صورت نبود seed جدید ساخته و سمت کلاینت ذخیره می شود
  const cookieStore = await cookies();
  const seed = cookieStore.get(FEED_SEED_COOKIE)?.value || newSeed();
  const [subscription, feed, featured] = await Promise.all([
    getActiveSubscription(user.id),
    getHomeFeed(user, seed, 0),
    getFeaturedUsers(user),
  ]);

  return (
    <div className="min-h-full">
    {/* هدر یکپارچه: لوگو در موبایل، عنوان در دسکتاپ */}
    <PageHeader
      center={
        <KandooLogo href="/dashboard" textClassName="text-3xl" hideIcon />
      }
      right={<NotificationBell />}
      left={<CoinBadge />}
    />

    <div className="flex flex-col lg:flex-row lg:justify-center lg:gap-6 xl:gap-8 lg:pt-6 px-0 lg:px-4 xl:px-6">
      {/* ستون اصلی — feed */}
      <div className="w-full lg:max-w-[470px] mx-auto lg:mx-0 lg:flex-1 xl:flex-none">
        {/* استوری بار واقعی */}
        <div className="-mt-1">
          <StoryBar
            currentUserPhoto={user.photos?.[0]?.url ?? null}
            currentUserFirstName={user.firstName}
            currentUserId={user.id}
            hasSubscription={!!subscription}
          />
        </div>

        <FeaturedRail users={featured} />

        {/* چک لیست تکمیل پروفایل برای کاربران جدید */}
        <OnboardingChecklist
          hasPhoto={user.photos.length > 0}
          hasBio={!!user.bio?.trim()}
          hasJob={!!user.job?.trim()}
          phoneVerified={user.phoneVerified}
        />

        {/* کارت پروفایل کاربر — infinite scroll */}
        <FeedList initialItems={feed.items} initialOffset={feed.nextOffset} initialHasMore={feed.hasMore} seed={seed} myPhoto={user.photos?.[0]?.url ?? null} />

        {feed.items.length === 0 && (
          <EmptyState
            icon={Users}
            title="کاربری در شهر شما نیست"
            description="از بخش جستجو می توانید کاربران شهرهای دیگر را ببینید"
            actionLabel="دیدن همه پروفایل ها"
            actionHref="/dashboard/search"
          />
        )}
      </div>

      {/* ستون کناری دسکتاپ */}
      <aside className="hidden xl:block w-80 shrink-0 pt-6">
        {/* پروفایل خود کاربر */}
        <div className="flex items-center gap-4 mb-6">
          <div className="ig-story-ring">
            <div className="w-12 h-12 rounded-full bg-surface p-0.5 flex items-center justify-center">
              {user.photos?.[0]?.url ? (
                <Image src={user.photos[0].url} alt={user.firstName} width={44} height={44} className="w-full h-full rounded-full object-cover" />
              ) : (
                <DefaultAvatar size={44} />
              )}
            </div>
          </div>
          <div>
            <span className="text-sm font-bold flex items-center gap-1">
              {user.firstName} {user.lastName}
              {user.isVerified && <VerifiedBadge className="w-3.5 h-3.5" />}
            </span>
            <span className="text-sm text-ig-gray">{user.city}</span>
          </div>
        </div>

        {/* وضعیت اشتراک */}
        {!subscription && !user.isSpecial ? (
          <div className="rounded-2xl p-4 mb-4 bg-ig-gray-bg">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-5 h-5 text-neutral-700" />
              <span className="text-sm font-bold">اشتراک فعال نیست</span>
            </div>
            <p className="text-xs text-ig-gray mb-3 leading-5">
              برای شروع گفتگو با کاربران، اشتراک ماهانه تهیه کنید
            </p>
            <Link
              href="/dashboard/subscription"
              className="inline-flex items-center gap-1 text-xs font-bold text-neutral-700 hover:text-foreground transition-colors"
            >
              خرید اشتراک
              <span>←</span>
            </Link>
          </div>
        ) : user.isSpecial ? (
          <div className="rounded-2xl p-4 mb-4 bg-ig-gray-bg border border-ig-border">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-ig-red" />
              <span className="text-sm font-bold text-ig-red">اشتراک ویژه (نامحدود)</span>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl p-4 mb-4 bg-ig-gray-bg">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-neutral-700" />
              <span className="text-sm font-bold">اشتراک فعال</span>
            </div>
          </div>
        )}

        {/* فوتر */}
        <div className="flex flex-wrap gap-x-2 gap-y-1 text-xs text-ig-gray mt-8">
          <Link href="/about" className="hover:text-foreground transition-colors">درباره</Link>
          <span>·</span>
          <Link href="/help" className="hover:text-foreground transition-colors">راهنما</Link>
          <span>·</span>
          <Link href="/privacy" className="hover:text-foreground transition-colors">حریم خصوصی</Link>
          <span>·</span>
          <Link href="/terms" className="hover:text-foreground transition-colors">قوانین</Link>
        </div>
        <p className="text-xs text-ig-gray mt-4">
          © {toPersianDigits(new Date().getFullYear())} KanDoo
        </p>
      </aside>
    </div>
      <PaymentResultModal />
    </div>
  );
}
