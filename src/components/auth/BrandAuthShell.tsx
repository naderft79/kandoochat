"use client";

// پوسته صفحات احراز هویت — هر قالب برند لی اوت متفاوتی دور فرم می سازد
// کندو دقیقاً پوسته فعلی را برمی گرداند؛ ورودی ها و منطق فرم ها دست نمی خورند
import type { ReactNode } from "react";
import { useBrand } from "@/components/BrandProvider";
import { getBrandTheme } from "@/lib/brand-theme";

type Mode = "login" | "register" | "forgot" | "special";

// مونوگرام برند برای هدر auth — همان تصویر API با گردی قالب
function Monogram({ px = 72 }: { px?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/api/brand-icon/180"
      alt=""
      width={px}
      height={px}
      draggable={false}
      className="select-none"
      style={{ borderRadius: "28%", width: px, height: px }}
    />
  );
}

export default function BrandAuthShell({
  children,
  mode,
}: {
  children: ReactNode;
  mode: Mode;
}) {
  const brand = useBrand();
  const theme = getBrandTheme(brand);
  const t = brand.texts ?? {};
  const sub =
    mode === "login"
      ? (t.loginSub ?? t.welcomeSub ?? brand.slogan)
      : mode === "register"
        ? (t.registerSub ?? t.welcomeSub ?? brand.slogan)
        : (t.welcomeSub ?? brand.slogan);

  // کندو — عیناً ظاهر فعلی
  if (theme.authLayout === "kandoo") {
    return (
      <div className="min-h-dvh bg-surface flex flex-col items-center justify-center p-4">
        {children}
      </div>
    );
  }

  // کارت شناور روی گرادیانت ملایم — نفس چت (aurora)
  if (theme.authLayout === "card") {
    return (
      <div className="min-h-dvh soft-gradient flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center mb-6 text-center">
          <Monogram px={76} />
          <h1 className="headline text-3xl mt-4 text-foreground">
            {t.welcomeTitle ?? brand.name}
          </h1>
          <p className="text-sm text-ig-gray mt-1.5">{sub}</p>
        </div>
        {children}
      </div>
    );
  }

  // پنل هیرو بالای صفحه + شیت فرم — هم فاز چت (flame)
  if (theme.authLayout === "hero") {
    return (
      <div className="min-h-dvh bg-surface flex flex-col">
        <div className="hero-gradient relative flex flex-col items-center justify-center text-center text-white px-6 pt-12 pb-14">
          <Monogram px={80} />
          <h1 className="headline text-3xl mt-4 text-white drop-shadow-sm">
            {t.welcomeTitle ?? brand.name}
          </h1>
          <p className="text-sm/6 text-white/90 mt-1.5 max-w-xs">{sub}</p>
        </div>
        <div
          className="relative -mt-7 flex-1 bg-surface flex flex-col items-center px-4 pt-8 pb-6"
          style={{
            borderRadius: "var(--brand-radius-sheet) var(--brand-radius-sheet) 0 0",
            boxShadow: "var(--brand-shadow-modal)",
          }}
        >
          {children}
        </div>
      </div>
    );
  }

  // دو ستونه (دسکتاپ) / هدر فشرده (موبایل) — هم مسیر چت (voyage)
  return (
    <div className="min-h-dvh bg-surface flex flex-col md:flex-row">
      {/* پنل برند — راست در RTL؛ روی موبایل نوار بالایی فشرده است */}
      <div className="hero-gradient text-white flex items-center justify-center gap-3 px-6 py-5 md:w-[42%] md:min-h-dvh md:flex-col md:gap-0 md:text-center md:px-10 md:justify-center">
        <Monogram px={48} />
        <div className="md:mt-6">
          <h1 className="headline text-xl md:text-3xl text-white">{brand.name}</h1>
          <p className="hidden md:block text-sm/7 text-white/90 mt-3 max-w-xs mx-auto">
            {t.welcomeSub ?? brand.slogan}
          </p>
        </div>
        <p className="md:hidden text-sm text-white/90">{sub}</p>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center p-4 soft-gradient md:soft-gradient">
        {children}
      </div>
    </div>
  );
}
