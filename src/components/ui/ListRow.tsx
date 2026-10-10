"use client";

// ردیف لیستی (تنظیمات/ابزارها): آیکن مشکی، عنوان، زیرعنوان خاکستری، فلش یا عنصر انتهایی
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import { cn } from "./cn";

type Props = {
  icon?: ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  subtitle?: string;
  href?: string;
  onClick?: () => void;
  end?: ReactNode;
  tone?: "default" | "danger";
};

export default function ListRow({ icon: Icon, title, subtitle, href, onClick, end, tone = "default" }: Props) {
  const body = (
    <>
      {Icon && <Icon className={cn("w-6 h-6 shrink-0", tone === "danger" ? "text-ig-red" : "text-foreground")} strokeWidth={2} />}
      <span className="flex-1 min-w-0 text-start">
        <span className={cn("block text-sm", tone === "danger" ? "text-ig-red font-bold" : "text-foreground font-semibold")}>{title}</span>
        {subtitle && <span className="block text-xs text-ig-gray mt-0.5">{subtitle}</span>}
      </span>
      {end ?? (href || onClick ? <ChevronLeft className="w-5 h-5 text-ig-gray shrink-0" aria-hidden /> : null)}
    </>
  );
  const cls = "w-full flex items-center gap-3 px-4 min-h-14 py-2 hover:bg-ig-gray-bg transition-colors";
  if (href) return <Link href={href} className={cls}>{body}</Link>;
  if (onClick) return <button type="button" onClick={onClick} className={cls}>{body}</button>;
  return <div className={cls}>{body}</div>;
}
