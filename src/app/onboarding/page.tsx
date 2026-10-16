"use client";

// صفحات راهنمای اولیه — ۴ اسلاید معرفی کندو قبل از ثبت نام
// فقط یک بار نمایش داده می شود و بعد کوکی kandoo-onboarded ست می شود
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Heart, Search, MessageCircle, BadgeCheck, ArrowLeft, ArrowRight } from "lucide-react";
import { toPersianDigits } from "@/lib/format";
import { cn } from "@/components/ui/cn";
import { useBrand } from "@/components/BrandProvider";

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

export default function OnboardingPage() {
  const brand = useBrand();
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const rawSlide = SLIDES[index];
  // نام برند در متن اسلایدها جایگزین می شود
  const slide = {
    ...rawSlide,
    title: rawSlide.title.replaceAll("کندو", brand.name),
    body: rawSlide.body.replaceAll("کندو", brand.name),
  };
  const isLast = index === SLIDES.length - 1;
  const Icon = slide.icon;

  function finish() {
    // کوکی دائمی — سرور دیگر لندینگ را نشان نمی دهد
    document.cookie = "kandoo-onboarded=1; path=/; max-age=63072000; samesite=lax";
    localStorage.setItem("kandoo-onboarded", "1");
    router.replace("/register");
  }

  return (
    <div className="min-h-dvh bg-surface flex flex-col">
      {/* دکمه رد کردن بالای صفحه */}
      <div className="flex justify-end p-4">
        <button
          onClick={finish}
          className="text-sm text-ig-gray font-medium px-3 py-1.5 rounded-full hover:bg-ig-gray-bg transition-colors"
        >
          رد کردن
        </button>
      </div>

      {/* محتوای اسلاید */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div className="w-14 h-14 rounded-2xl overflow-hidden mb-8 shadow-sm">
          {brand.id === "kandoo" ? (
            <Image src="/bee-colori-logo.png" alt={brand.name} width={56} height={56} priority />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src="/api/brand-icon/96" alt={brand.name} width={56} height={56} className="rounded-2xl" />
          )}
        </div>
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

      {/* نقطه های پیشرفت + دکمه بعدی */}
      <div className="px-6 pb-10">
        <div className="flex justify-center gap-1.5 mb-6">
          {SLIDES.map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === index ? "w-6 bg-foreground" : "w-1.5 bg-ig-border"
              )}
            />
          ))}
        </div>
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
            className="flex-1 h-12 rounded-xl bg-ig-blue text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            {isLast ? "شروع کنید" : `بعدی (${toPersianDigits(index + 1)} از ${toPersianDigits(SLIDES.length)})`}
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
