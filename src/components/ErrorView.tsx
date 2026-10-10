"use client";

// نمای خطای مشترک: پیام مهربان فارسی + تلاش مجدد + بازگشت
import Link from "next/link";
import { AlertCircle, SearchX } from "lucide-react";
import Button from "@/components/ui/Button";

type Props = {
  kind?: "error" | "notfound";
  title?: string;
  message?: string;
  onRetry?: () => void;
  homeHref?: string;
};

export default function ErrorView({ kind = "error", title, message, onRetry, homeHref = "/dashboard" }: Props) {
  const Icon = kind === "notfound" ? SearchX : AlertCircle;
  return (
    <div role="alert" className="min-h-[60dvh] flex flex-col items-center justify-center text-center px-6 py-12">
      <div className="w-20 h-20 rounded-full border-2 border-foreground flex items-center justify-center mb-5">
        <Icon className="w-9 h-9" strokeWidth={1.5} aria-hidden />
      </div>
      <h1 className="text-xl font-bold text-foreground mb-2">
        {title ?? (kind === "notfound" ? "صفحه پیدا نشد" : "مشکلی پیش آمد")}
      </h1>
      <p className="text-sm text-ig-gray leading-6 max-w-xs mb-6">
        {message ??
          (kind === "notfound"
            ? "ممکن است این صفحه حذف شده یا لینک اشتباه باشد."
            : "خطایی رخ داد. لطفا دوباره تلاش کنید؛ اگر ادامه داشت با پشتیبانی تماس بگیرید.")}
      </p>
      <div className="flex gap-2 w-full max-w-xs">
        {onRetry && (
          <Button onClick={onRetry} fullWidth>
            تلاش مجدد
          </Button>
        )}
        <Link
          href={homeHref}
          className="flex-1 h-10 inline-flex items-center justify-center rounded-lg bg-ig-btn2 hover:bg-ig-btn2-hover text-foreground text-sm font-semibold transition-colors"
        >
          بازگشت به خانه
        </Link>
      </div>
    </div>
  );
}
