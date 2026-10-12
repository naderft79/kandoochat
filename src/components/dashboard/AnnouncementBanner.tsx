"use client";

// بنر اطلاعیه سراسری — بستن با localStorage تا دوباره نمایش داده نشود
import { useState } from "react";
import { X, Info, AlertTriangle, Sparkles } from "lucide-react";

type Item = {
  id: string;
  title: string;
  body: string;
  type: string;
};

const TYPE_META: Record<string, { icon: typeof Info; cls: string }> = {
  INFO: { icon: Info, cls: "bg-ig-blue/10 border-ig-blue/30 text-ig-blue" },
  WARNING: { icon: AlertTriangle, cls: "bg-ig-gold/10 border-ig-gold/30 text-ig-gold" },
  PROMO: { icon: Sparkles, cls: "bg-ig-red/10 border-ig-red/30 text-ig-red" },
};

const storageKey = (id: string) => `kandoo-ann-${id}`;

export default function AnnouncementBanner({ items }: { items: Item[] }) {
  // اولین اطلاعیه بسته نشده را نشان می دهد
  const [dismissed, setDismissed] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    return new Set(items.filter((a) => localStorage.getItem(storageKey(a.id))).map((a) => a.id));
  });

  const visible = items.find((a) => !dismissed.has(a.id));
  if (!visible) return null;

  const meta = TYPE_META[visible.type] ?? TYPE_META.INFO;
  const Icon = meta.icon;

  function dismiss() {
    if (!visible) return;
    localStorage.setItem(storageKey(visible.id), "1");
    setDismissed((prev) => new Set(prev).add(visible.id));
  }

  return (
    <div className={`mx-4 mt-3 rounded-xl border p-3 flex items-start gap-3 ig-fade-in ${meta.cls}`}>
      <Icon className="w-5 h-5 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-foreground">{visible.title}</p>
        <p className="text-xs text-foreground/70 mt-0.5 whitespace-pre-wrap">{visible.body}</p>
      </div>
      <button
        onClick={dismiss}
        className="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors shrink-0"
        aria-label="بستن اطلاعیه"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
