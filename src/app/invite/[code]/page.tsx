// صفحه فرود لینک دعوت — توضیح پاداش و دعوت به ثبت نام
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Gift, UserPlus, ClipboardCheck, Coins, Trophy, ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getAllSettings } from "@/lib/settings";
import { findUserByReferralCode, normalizeReferralCode } from "@/lib/referral";
import { toPersianDigits } from "@/lib/format";
import { requestBrandName } from "@/lib/brand-server";
import DefaultAvatar from "@/components/dashboard/DefaultAvatar";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const n = await requestBrandName();
  const referrer = await findUserByReferralCode(code);
  if (!referrer) return { title: `دعوت دوستان — ${n}` };
  return {
    title: `دعوت ${referrer.firstName} به ${n}`,
    description: "با لینک دعوت ثبت نام کنید و سکه رایگان دریافت کنید",
  };
}

export default async function InvitePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const n = await requestBrandName();
  const normalized = normalizeReferralCode(code);
  const referrer = await findUserByReferralCode(code);
  const settings = await getAllSettings();

  const photo = referrer
    ? await prisma.profilePhoto.findFirst({
        where: { userId: referrer.id, isProfile: true, isVerified: true, isRejected: false, isDeletedByUser: false },
        select: { url: true },
      })
    : null;

  const reward = settings.referralRewardCoins;
  const milestoneCount = settings.referralMilestoneCount;
  const milestoneReward = settings.referralMilestoneCoins;

  const steps = [
    {
      icon: UserPlus,
      title: "ثبت نام کنید",
      desc: "با لینک دعوت ثبت نام کنید تا دعوت شما ثبت شود",
    },
    {
      icon: ClipboardCheck,
      title: "پروفایلتان را کامل کنید",
      desc: "مشخصات پروفایل را کامل کنید و یک ماموریت روزانه انجام دهید",
    },
    {
      icon: Coins,
      title: "پاداش بگیرید",
      desc: `شما و دوستتان هر کدام ${toPersianDigits(reward)} سکه پاداش می گیرید`,
    },
  ];

  return (
    <div dir="rtl" className="min-h-dvh bg-ig-gray-bg">
      <div className="mx-auto max-w-md px-4 py-8 md:py-12 space-y-5">

        {/* کارت اصلی دعوت */}
        <div className="bg-surface rounded-2xl border border-ig-border p-6 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-ig-btn2 flex items-center justify-center">
            <Gift className="w-8 h-8 text-ig-blue" />
          </div>

          {referrer ? (
            <>
              <div className="flex flex-col items-center gap-2">
                {photo ? (
                  <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-ig-border">
                    <Image src={photo.url} alt={referrer.firstName} fill className="object-cover" unoptimized />
                  </div>
                ) : (
                  <DefaultAvatar size={80} />
                )}
                <h1 className="text-xl font-bold text-foreground">
                  {referrer.firstName} شما را به {n} دعوت کرد
                </h1>
              </div>
              <p className="text-sm text-ig-gray leading-6">
                با ثبت نام از طریق این لینک، بعد از فعال شدن حسابتان{" "}
                <span className="font-bold text-foreground">{toPersianDigits(reward)} سکه</span> پاداش
                می گیرید و دوستتان هم {toPersianDigits(reward)} سکه دریافت می کند.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-xl font-bold text-foreground">دعوت به {n}</h1>
              <p className="text-sm text-ig-gray leading-6">
                {normalized
                  ? "این کد دعوت معتبر نیست یا منقضی شده — ولی می توانید همین حالا ثبت نام کنید و از همه امکانات استفاده کنید."
                  : "لینک دعوت نامعتبر است."}
              </p>
            </>
          )}

          <Link
            href={referrer ? `/register?ref=${encodeURIComponent(normalized)}` : "/register"}
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-ig-blue text-white font-bold text-base hover:bg-ig-blue-hover transition-colors active:scale-[0.98]"
          >
            {referrer ? "ثبت نام و دریافت پاداش" : `ثبت نام در ${n}`}
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <Link href="/login" className="block text-sm text-ig-blue font-semibold">
            قبلا ثبت نام کرده اید؟ ورود
          </Link>
        </div>

        {/* مراحل دریافت پاداش */}
        <div className="bg-surface rounded-2xl border border-ig-border p-5 space-y-4">
          <h2 className="font-bold text-foreground text-center">چطور پاداش بگیرید؟</h2>
          <div className="space-y-3">
            {steps.map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-ig-btn2 flex items-center justify-center shrink-0">
                  <step.icon className="w-5 h-5 text-ig-blue" />
                </div>
                <div className="pt-0.5">
                  <p className="text-sm font-semibold text-foreground">
                    {toPersianDigits(i + 1)}. {step.title}
                  </p>
                  <p className="text-xs text-ig-gray mt-0.5 leading-5">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* جایزه مایلستون برای دعوت کننده */}
        <div className="bg-surface rounded-2xl border border-ig-border p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
              <Trophy className="w-5 h-5 text-amber-500" />
            </div>
            <p className="text-xs text-ig-gray leading-5">
              شما هم می توانید دوستانتان را دعوت کنید — با هر دعوت فعال{" "}
              <span className="font-bold text-foreground">{toPersianDigits(reward)} سکه</span> و بعد از{" "}
              <span className="font-bold text-foreground">{toPersianDigits(milestoneCount)} دعوت</span>{" "}
              <span className="font-bold text-amber-600">{toPersianDigits(milestoneReward)} سکه جایزه ویژه</span> بگیرید.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
