"use client";

// دو ردیف قابلیت ویژه: احراز هویت کامل و تیک آبی — هرکدام اول شیت ترغیب باز می کنند
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, UserCheck, ShieldCheck, HeartHandshake, Banknote, Sparkles, Eye, TrendingUp } from "lucide-react";
import { FeatureRow, FeaturePitchSheet, type FeatureStatus } from "@/components/dashboard/features/FeatureKit";

type VerifyState = {
  isVerified: boolean;
  isIdentityVerified: boolean;
  blueTickStatus: string | null;
  kycStatus: string | null;
};

// نگاشت وضعیت درخواست به وضعیت ردیف
function rowStatus(status: string | null): FeatureStatus | undefined {
  if (status === "APPROVED") return { kind: "active", label: "تایید شده" };
  if (status === "PENDING") return { kind: "pending", label: "در بررسی" };
  return undefined;
}

export default function VerifyFeatureButtons() {
  const router = useRouter();
  const [state, setState] = useState<VerifyState | null>(null);
  const [sheet, setSheet] = useState<"kyc" | "bluetick" | null>(null);

  useEffect(() => {
    fetch("/api/verify-badge")
      .then((r) => r.json())
      .then(setState)
      .catch(() => {});
  }, []);

  const kycStatus = rowStatus(state?.kycStatus ?? null);
  const tickStatus = rowStatus(state?.blueTickStatus ?? null);

  return (
    <>
      <FeatureRow
        icon={UserCheck}
        title="احراز هویت"
        subtitle={
          kycStatus
            ? kycStatus.label === "تایید شده"
              ? "هویت شما تایید شده است"
              : "مدارک شما در حال بررسی است"
            : "هویت خود را تایید کنید و مزایای بیشتری بگیرید"
        }
        status={kycStatus}
        onClick={() => setSheet("kyc")}
      />
      <FeaturePitchSheet
        open={sheet === "kyc"}
        onClose={() => setSheet(null)}
        icon={UserCheck}
        title="احراز هویت"
        tagline="با تایید هویت خود ثابت کنید واقعی هستید؛ پروفایل تان معتبرتر می شود و امکانات ویژه برای تان باز می شود."
        benefits={[
          { icon: ShieldCheck, title: "اعتماد کامل", desc: "کاربران می دانند با یک شخص واقعی طرف هستند و راحت تر گفتگو می کنند" },
          { icon: Banknote, title: "برداشت درآمد", desc: "فقط با احراز هویت کامل می توانید سکه های خود را به پول تبدیل و برداشت کنید" },
          { icon: TrendingUp, title: "جایگاه بهتر", desc: "پروفایل های تایید شده در جستجو و فید دیده تر و متمایزتر هستند" },
        ]}
        ctaLabel="شروع احراز هویت"
        onConfirm={async () => {
          // اول ورودی تاریخچه مودال بسته می شود؛ بدون این کار cleanup مودال ناوبری را برمی گرداند
          window.history.back();
          setTimeout(() => router.push("/dashboard/verify?tab=kyc"), 50);
        }}
      />

      <FeatureRow
        icon={BadgeCheck}
        title="تیک آبی"
        subtitle={
          tickStatus
            ? tickStatus.label === "تایید شده"
              ? "تیک آبی شما فعال است"
              : "درخواست شما در حال بررسی است"
            : "نشان اعتبار بگیرید و متمایز دیده شوید"
        }
        status={tickStatus}
        onClick={() => setSheet("bluetick")}
      />
      <FeaturePitchSheet
        open={sheet === "bluetick"}
        onClose={() => setSheet(null)}
        icon={BadgeCheck}
        title="تیک آبی"
        tagline="تیک آبی کنار نام شما به همه نشان می دهد پروفایل تان واقعی و تایید شده است؛ همان چیزی که همه دنبالش هستند."
        benefits={[
          { icon: HeartHandshake, title: "اعتماد فوری", desc: "کاربران به پروفایل های تیک دار سریع تر اعتماد، لایک و پیام می دهند" },
          { icon: Eye, title: "دیده شدن بیشتر", desc: "تیک آبی پروفایل شما را در فید و جستجو متمایز و چشمگیر می کند" },
          { icon: Sparkles, title: "اعتبار واقعی", desc: "با بررسی سلفی و صدای شما توسط تیم کندو، نشان اعتبار می گیرید" },
        ]}
        ctaLabel="دریافت تیک آبی"
        onConfirm={async () => {
          window.history.back();
          setTimeout(() => router.push("/dashboard/verify?tab=bluetick"), 50);
        }}
      />
    </>
  );
}
