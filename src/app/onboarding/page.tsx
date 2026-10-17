"use client";

// صفحات راهنمای اولیه — اسلایدها و استایل هر برند متفاوت است؛ کندو همان طرح فعلی
// فقط یک بار نمایش داده می شود و بعد کوکی kandoo-onboarded ست می شود
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Heart, Search, MessageCircle, BadgeCheck, MapPin, ArrowLeft, ArrowRight } from "lucide-react";
import { toPersianDigits } from "@/lib/format";
import { cn } from "@/components/ui/cn";
import { useBrand } from "@/components/BrandProvider";
import { getBrandTheme } from "@/lib/brand-theme";

const SLIDES = [
  {
    icon: Heart,
    title: "کندو چیست؟",
    body: "کندو یه اپلیکیشن همسریابیه — با پروفایل های تایید شده و امنیت بالا، نیمه گمشده ات رو اینجا پیدا می کنی.",
    color: "text-ig-like",
    bg: "bg-ig-like/10",
  },
  {
    icon: Search,
    title: "جستجو و کشف",
    body: "بر اساس استان، شهر و سن جستجو کن و آدم های اطرافت رو ببین — دقیقا همونی که می خوای.",
    color: "text-ig-blue",
    bg: "bg-ig-blue/10",
  },
  {
    icon: MessageCircle,
    title: "لایک و گفتگو",
    body: "پروفایل هایی که دوست داری رو لایک کن؛ اگه اون طرف هم لایکت کرد، گفتگو شروع می شه.",
    color: "text-ig-purple",
    bg: "bg-ig-purple/10",
  },
  {
    icon: BadgeCheck,
    title: "امنیت و تیک آبی",
    body: "با احراز هویت و تیک آبی پروفایلت معتبرتر می شه و اعتماد بیشتری جلب می کنی.",
    color: "text-ig-online",
    bg: "bg-ig-online/10",
  },
];

// آیکن اسلایدهای برند — whitelist از brands.json
const SLIDE_ICONS = { heart: Heart, search: Search, chat: MessageCircle, shield: BadgeCheck, map: MapPin };

export default function OnboardingPage() {
  const brand = useBrand();
  const theme = getBrandTheme(brand);
  const router = useRouter();
  const [index, setIndex] = useState(0);

  const isKandoo = theme.onboardingStyle === "kandoo";
  // اسلایدهای برند از متن های brands.json؛ کندو و برند بدون متن = اسلایدهای پیش فرض
  const customSlides = (brand.texts?.onboarding ?? [])
    .filter((s) => s.title && s.body)
    .map((s) => ({
      icon: SLIDE_ICONS[s.icon as keyof typeof SLIDE_ICONS] ?? Heart,
      title: s.title,
      body: s.body,
      color: "text-brand",
      bg: "bg-brand-soft",
    }));
  const allSlides = !isKandoo && customSlides.length >= 2 ? customSlides : SLIDES;

  const rawSlide = allSlides[Math.min(index, allSlides.length - 1)];
  // نام برند در متن اسلایدها جایگزین می شود
  const slide = {
    ...rawSlide,
    title: rawSlide.title.replaceAll("کندو", brand.name),
    body: rawSlide.body.replaceAll("کندو", brand.name),
  };
  const isLast = index === allSlides.length - 1;
  const Icon = slide.icon;

  function finish() {
    // کوکی دائمی — سرور دیگر لندینگ را نشان نمی دهد
    document.cookie = "kandoo-onboarded=1; path=/; max-age=63072000; samesite=lax";
    localStorage.setItem("kandoo-onboarded", "1");
    router.replace("/register");
  }

  const logo = (
    <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-sm">
      {brand.id === "kandoo" ? (
        <Image src="/bee-colori-logo.png" alt={brand.name} width={56} height={56} priority />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/api/brand-icon/96"
          alt={brand.name}
          width={56}
          height={56}
          style={{ borderRadius: "var(--brand-radius-card, 16px)" }}
        />
      )}
    </div>
  );

  const dots = (
    <div className="flex justify-center gap-1.5 mb-6">
      {allSlides.map((_, i) => (
        <span
          key={i}
          className={cn(
            "h-1.5 rounded-full transition-all duration-300",
            i === index ? "w-6 bg-foreground" : "w-1.5 bg-ig-border"
          )}
          style={!isKandoo && i === index ? { background: "var(--brand-gold)" } : undefined}
        />
      ))}
    </div>
  );

  const controls = (
    <div className="flex items-center gap-3">
      {index > 0 && (
        <button
          onClick={() => setIndex((i) => i - 1)}
          className="h-12 px-5 rounded-xl border border-ig-border text-foreground font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform ig-fade-in"
        >
          <ArrowRight className="w-4 h-4" />
          قبلی
        </button>
      )}
      <button
        onClick={() => (isLast ? finish() : setIndex((i) => i + 1))}
        className={cn(
          "flex-1 h-12 text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform",
          isKandoo ? "rounded-xl bg-ig-blue" : "btn-brand"
        )}
      >
        {isLast ? "شروع کنید" : `بعدی (${toPersianDigits(index + 1)} از ${toPersianDigits(allSlides.length)})`}
        <ArrowLeft className="w-4 h-4" />
      </button>
    </div>
  );

  const skipBtn = (light?: boolean) => (
    <button
      onClick={finish}
      className={cn(
        "text-sm font-medium px-3 py-1.5 rounded-full transition-colors",
        light ? "text-white/90 hover:bg-white/15" : "text-ig-gray hover:bg-ig-gray-bg"
      )}
    >
      رد کردن
    </button>
  );

  // کندو — عیناً طرح فعلی
  if (isKandoo) {
    return (
      <div className="min-h-dvh bg-surface flex flex-col">
        <div className="flex justify-end p-4">{skipBtn()}</div>
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          <div className="mb-8">{logo}</div>
          <div
            key={index}
            className={`w-24 h-24 rounded-full ${slide.bg} flex items-center justify-center mb-7 ig-fade-in`}
          >
            <Icon className={`w-11 h-11 ${slide.color}`} strokeWidth={1.6} />
          </div>
          <h1 key={`t${index}`} className="text-2xl font-black text-foreground ig-fade-in">
            {slide.title}
          </h1>
          <p key={`b${index}`} className="text-sm text-ig-gray leading-7 mt-3 max-w-xs ig-fade-in">
            {slide.body}
          </p>
        </div>
        <div className="px-6 pb-10">
          {dots}
          {controls}
        </div>
      </div>
    );
  }

  // حباب — نفس چت: کارت سفید گرد روی گرادیانت ملایم
  if (theme.onboardingStyle === "bubble") {
    return (
      <div className="min-h-dvh soft-gradient flex flex-col">
        <div className="flex justify-end p-4">{skipBtn()}</div>
        <div className="flex-1 flex flex-col items-center justify-center px-5">
          <div className="auth-card w-full max-w-sm bg-surface border border-ig-border p-8 text-center">
            <div className="flex justify-center mb-6">{logo}</div>
            <div
              key={index}
              className="w-24 h-24 rounded-full bg-brand-soft flex items-center justify-center mx-auto mb-7 ig-fade-in"
            >
              <Icon className="w-11 h-11 text-brand" strokeWidth={1.6} />
            </div>
            <h1 key={`t${index}`} className="headline text-2xl text-foreground ig-fade-in">
              {slide.title}
            </h1>
            <p key={`b${index}`} className="text-sm text-ig-gray leading-7 mt-3 ig-fade-in">
              {slide.body}
            </p>
          </div>
        </div>
        <div className="px-6 pb-10">
          {dots}
          {controls}
        </div>
      </div>
    );
  }

  // بنر — هم فاز چت: پنل گرادیانت بالا با محتوای اسلاید
  if (theme.onboardingStyle === "banner") {
    return (
      <div className="min-h-dvh bg-surface flex flex-col">
        <div className="hero-gradient flex flex-col text-white" style={{ minHeight: "52dvh" }}>
          <div className="flex justify-end p-4">{skipBtn(true)}</div>
          <div className="flex-1 flex flex-col items-center justify-center px-8 text-center pb-8">
            <div
              key={index}
              className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center mb-6 ig-fade-in"
            >
              <Icon className="w-11 h-11 text-white" strokeWidth={1.6} />
            </div>
            <h1 key={`t${index}`} className="headline text-2xl text-white ig-fade-in">
              {slide.title}
            </h1>
            <p key={`b${index}`} className="text-sm text-white/90 leading-7 mt-3 max-w-xs ig-fade-in">
              {slide.body}
            </p>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-end px-6 pb-10 pt-8">
          <div className="mb-4 flex justify-center">{logo}</div>
          <p className="text-sm text-ig-gray mb-6">{brand.slogan}</p>
          <div className="w-full max-w-sm">
            {dots}
            {controls}
          </div>
        </div>
      </div>
    );
  }

  // تمیز — هم مسیر چت: حداقلی، فضای باز و نشانگر برند
  return (
    <div className="min-h-dvh soft-gradient flex flex-col">
      <div className="flex justify-end p-4">{skipBtn()}</div>
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div className="mb-10">{logo}</div>
        <div
          key={index}
          className="w-20 h-20 flex items-center justify-center mb-6 ig-fade-in"
          style={{
            borderRadius: "var(--brand-radius-card)",
            border: "2px solid color-mix(in srgb, var(--brand-gold) 35%, transparent)",
            background: "color-mix(in srgb, var(--brand-gold) 8%, transparent)",
          }}
        >
          <Icon className="w-9 h-9 text-brand" strokeWidth={1.6} />
        </div>
        <h1 key={`t${index}`} className="headline text-xl text-foreground ig-fade-in">
          {slide.title}
        </h1>
        <p key={`b${index}`} className="text-sm text-ig-gray leading-7 mt-3 max-w-xs ig-fade-in">
          {slide.body}
        </p>
      </div>
      <div className="px-6 pb-10 max-w-sm w-full mx-auto">
        {dots}
        {controls}
      </div>
    </div>
  );
}
