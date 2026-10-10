"use client";

// هدر یکپارچه صفحات اصلی داشبورد
// ثابت بالا (sticky)، ارتفاع یکسان در همه دیوایس ها، چیدمان سه بخشی راست/وسط/چپ
import { ReactNode } from "react";

type Props = {
  // عنوان وسط هدر
  title?: string;
  // زیرعنوان کوچک زیر عنوان
  subtitle?: string;
  // آیکون کنار عنوان (به صورت element پاس داده شود نه تابع)
  icon?: ReactNode;
  // جایگزین کامل بخش وسط (مثل لوگو یا باکس جستجو)
  center?: ReactNode;
  // محتوای سمت راست (شروع در حالت راست به چپ)
  right?: ReactNode;
  // محتوای سمت چپ (پایان در حالت راست به چپ)
  left?: ReactNode;
  // محتوای تمام عرض؛ در صورت وجود، چیدمان سه بخشی نادیده گرفته می شود
  children?: ReactNode;
};

export default function PageHeader({
  title,
  subtitle,
  icon,
  center,
  right,
  left,
  children,
}: Props) {
  return (
    <header className="sticky top-0 z-30 bg-white/80 ig-glass border-b border-ig-border">
      {children ? (
        <div className="h-14 md:h-16 px-4 md:px-6 flex items-center">{children}</div>
      ) : (
        <div className="h-14 md:h-16 px-4 md:px-6 flex items-center gap-2">
          {/* سمت راست */}
          <div className="flex items-center gap-1.5 flex-1 justify-start min-w-0">
            {right}
          </div>

          {/* وسط */}
          <div className="flex items-center justify-center shrink-0">
            {center ?? (
              <div className="flex items-center gap-2">
                {icon}
                <div className="flex flex-col items-center leading-none">
                  <h1 className="text-base md:text-lg font-bold text-foreground">
                    {title}
                  </h1>
                  {subtitle && (
                    <span className="text-xs md:text-xs text-ig-gray mt-1">
                      {subtitle}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* سمت چپ */}
          <div className="flex items-center gap-1.5 flex-1 justify-end min-w-0">
            {left}
          </div>
        </div>
      )}
    </header>
  );
}
