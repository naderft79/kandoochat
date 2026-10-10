"use client";

// ابزار مشترک قابلیت های ویژه: ردیف اینستاگرامی، شیت ترغیب خرید و شمارنده زمان
import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft, Coins, Lock, Loader2 } from "lucide-react";
import { BottomSheet } from "@/components/ui/Modal";
import { cn } from "@/components/ui/cn";
import { toPersianDigits } from "@/lib/format";

type IconType = ComponentType<{ className?: string; strokeWidth?: number }>;

export type FeatureStatus = {
  kind: "active" | "pending" | "done";
  label: string;
};

/** زمان باقی مانده به صورت زنده (ساعت:دقیقه یا دقیقه:ثانیه) */
export function Remaining({
  endsAt,
  withSeconds,
}: {
  endsAt: string;
  withSeconds?: boolean;
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), withSeconds ? 1000 : 30000);
    return () => clearInterval(t);
  }, [withSeconds]);
  const ms = Math.max(0, new Date(endsAt).getTime() - now);
  const pad = (n: number) => toPersianDigits(String(n).padStart(2, "0"));
  if (withSeconds)
    return (
      <span>
        {pad(Math.floor(ms / 60000))}:{pad(Math.floor((ms % 60000) / 1000))}
      </span>
    );
  return (
    <span>
      {pad(Math.floor(ms / 3600000))}:{pad(Math.floor((ms % 3600000) / 60000))}
    </span>
  );
}

/** ردیف قابلیت: آیکن دایره ای، عنوان، توضیح کوتاه و وضعیت یا قیمت */
export function FeatureRow({
  icon: Icon,
  title,
  subtitle,
  cost,
  status,
  onClick,
  href,
}: {
  icon: IconType;
  title: string;
  subtitle: ReactNode;
  cost?: number;
  status?: FeatureStatus;
  onClick?: () => void;
  href?: string;
}) {
  const interactive = (!!onClick || !!href) && !status;
  const body = (
    <>
      <span className="w-11 h-11 rounded-full bg-ig-gray-bg border border-ig-divider flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-foreground" strokeWidth={2} />
      </span>
      <span className="flex-1 min-w-0 text-start">
        <span className="block text-sm font-bold text-foreground truncate">
          {title}
        </span>
        <span className="block text-xs text-ig-gray mt-0.5 truncate">
          {subtitle}
        </span>
      </span>
      {status ? (
        <span
          className={cn(
            "shrink-0 px-2.5 py-1 rounded-full text-xs font-bold",
            status.kind === "active"
              ? "bg-ig-blue text-white"
              : "bg-ig-btn2 text-ig-gray"
          )}
        >
          {status.label}
        </span>
      ) : (
        <>
          {cost != null && (
            <span className="shrink-0 flex items-center gap-1 text-xs font-bold text-ig-gray">
              <Coins className="w-4 h-4" strokeWidth={2} aria-hidden />
              {toPersianDigits(cost)}
            </span>
          )}
          <ChevronLeft className="w-5 h-5 text-ig-gray shrink-0" aria-hidden />
        </>
      )}
    </>
  );
  const cls = cn(
    "w-full flex items-center gap-3 px-4 py-3 min-h-[68px] transition-colors",
    interactive && "hover:bg-ig-gray-bg active:bg-ig-btn2"
  );
  if (href)
    return (
      <Link href={href} className={cls}>
        {body}
      </Link>
    );
  return interactive ? (
    <button type="button" onClick={onClick} className={cls}>
      {body}
    </button>
  ) : (
    <div className={cls}>{body}</div>
  );
}

export type Benefit = { icon: IconType; title: string; desc: string };

/** شیت ترغیب خرید: مزایا، قیمت، هشدار غیرقابل لغو بودن و دکمه خرید */
export function FeaturePitchSheet({
  open,
  onClose,
  icon: Icon,
  title,
  tagline,
  benefits,
  cost,
  ctaLabel = "خرید و فعال سازی",
  onConfirm,
  canConfirm = true,
  children,
}: {
  open: boolean;
  onClose: () => void;
  icon: IconType;
  title: string;
  tagline: string;
  benefits: Benefit[];
  // بدون قیمت — برای قابلیت های رایگان مثل احراز هویت باکس قیمت و هشدار سکه نمایش داده نمی شود
  cost?: number;
  ctaLabel?: string;
  onConfirm: () => Promise<string | void>;
  canConfirm?: boolean;
  children?: ReactNode;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submitPurchase() {
    setLoading(true);
    setError("");
    try {
      const err = await onConfirm();
      if (err) setError(err);
    } catch {
      setError("خطای شبکه");
    } finally {
      setLoading(false);
    }
  }

  return (
    <BottomSheet
      open={open}
      onClose={() => {
        setError("");
        onClose();
      }}
      title={title}
      dismissible={!loading}
    >
      <div className="px-5 pt-4 pb-5">
        <div className="text-center">
          <span className="w-16 h-16 rounded-full bg-ig-gray-bg border border-ig-divider mx-auto flex items-center justify-center">
            <Icon className="w-8 h-8 text-foreground" strokeWidth={1.8} />
          </span>
          <p className="text-sm text-ig-gray mt-3 leading-6">{tagline}</p>
        </div>

        <ul className="mt-5 space-y-4">
          {benefits.map((b) => (
            <li key={b.title} className="flex items-start gap-3">
              <b.icon
                className="w-6 h-6 text-foreground shrink-0 mt-0.5"
                strokeWidth={2}
              />
              <div>
                <p className="text-sm font-bold text-foreground">{b.title}</p>
                <p className="text-xs text-ig-gray mt-0.5 leading-5">
                  {b.desc}
                </p>
              </div>
            </li>
          ))}
        </ul>

        {children && <div className="mt-5">{children}</div>}

        {cost != null && (
          <>
            <div className="mt-5 flex items-center justify-between rounded-xl bg-ig-gray-bg px-4 py-3">
              <span className="text-sm text-ig-gray">قیمت</span>
              <span className="flex items-center gap-1.5 text-base font-black text-foreground">
                <Coins className="w-5 h-5" strokeWidth={2} aria-hidden />
                {toPersianDigits(cost)} سکه
              </span>
            </div>

            <p className="mt-3 flex items-start gap-1.5 text-xs text-ig-gray leading-5">
              <Lock className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden />
              پس از خرید و فعال سازی، امکان لغو یا بازگشت سکه وجود ندارد.
            </p>
          </>
        )}

        {error && (
          <p role="alert" className="mt-3 text-xs text-ig-red">
            {error}{" "}
            {error.includes("سکه") && (
              <Link href="/dashboard/coins" className="font-bold underline">
                خرید سکه
              </Link>
            )}
          </p>
        )}

        <button
          type="button"
          onClick={submitPurchase}
          disabled={loading || !canConfirm}
          className="mt-4 w-full h-11 rounded-lg bg-ig-blue text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-ig-blue-hover disabled:opacity-40 active:scale-[0.98] transition-all"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
          ) : null}
          {loading ? "در حال پردازش..." : ctaLabel}
        </button>
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="mt-2 w-full h-11 rounded-lg bg-ig-btn2 text-foreground text-sm font-bold hover:bg-ig-btn2-hover disabled:opacity-40 transition-colors"
        >
          انصراف
        </button>
      </div>
    </BottomSheet>
  );
}
