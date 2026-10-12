// کامپوننت حالت خالی — نمایش زیبا وقتی داده ای وجود ندارد
import Link from "next/link";
import { LucideIcon } from "lucide-react";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  gradient?: boolean;
};

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  gradient = false,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 ig-fade-in">
      <div
        className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${
          gradient ? "bg-ig-gray-bg" : "bg-ig-btn2"
        }`}
      >
        <Icon
          className={`w-10 h-10 ${gradient ? "text-white" : "text-neutral-400"}`}
          strokeWidth={1.5}
        />
      </div>
      <h3 className="text-base font-bold text-foreground mb-1.5">{title}</h3>
      <p className="text-sm text-ig-gray leading-6 max-w-xs mb-5">{description}</p>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-ig-blue text-white text-sm font-bold hover:opacity-90 transition-opacity active:scale-95"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
