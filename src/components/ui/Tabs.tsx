"use client";

// تب زیرخط دار مثل اینستاگرام
import { cn } from "./cn";

type Tab<T extends string> = { id: T; label: string; badge?: number };

export default function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: Tab<T>[];
  value: T;
  onChange: (id: T) => void;
  className?: string;
}) {
  return (
    <div role="tablist" className={cn("flex border-b border-ig-border", className)}>
      {tabs.map((t) => {
        const active = t.id === value;
        return (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(t.id)}
            className={cn(
              "flex-1 h-12 text-sm -mb-px border-b-2 transition-colors",
              active ? "border-foreground text-foreground font-bold" : "border-transparent text-ig-gray"
            )}
          >
            {t.label}
            {t.badge ? <span className="mr-1.5 text-xs text-ig-gray">({t.badge})</span> : null}
          </button>
        );
      })}
    </div>
  );
}
