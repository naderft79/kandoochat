"use client";

// کامپوننت آکاردئون سوالات متداول — با جستجو و دسته بندی
import { useState, useMemo } from "react";
import {
  ChevronDown,
  Search,
  HelpCircle,
  UserPlus,
  CreditCard,
  Coins,
  Shield,
  MessageCircle,
  User,
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  UserPlus,
  CreditCard,
  Coins,
  Shield,
  MessageCircle,
  User,
};

export type FAQItem = {
  q: string;
  a: string;
  category: string;
};

export type FAQCategory = {
  key: string;
  label: string;
  icon: keyof typeof iconMap;
};

export default function FAQAccordion({
  items,
  categories,
}: {
  items: FAQItem[];
  categories: FAQCategory[];
}) {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const filtered = useMemo(() => {
    let result = items;
    if (activeCategory !== "all") {
      result = result.filter((item) => item.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (item) =>
          item.q.toLowerCase().includes(q) ||
          item.a.toLowerCase().includes(q)
      );
    }
    return result;
  }, [items, activeCategory, search]);

  return (
    <div>
      {/* جستجو */}
      <div className="relative mb-4">
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ig-gray" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="جستجو در سوالات..."
          className="w-full pr-11 pl-4 py-3 rounded-2xl bg-white border border-ig-border text-sm outline-none focus:border-ig-gray transition-colors"
        />
      </div>

      {/* دسته بندی ها */}
      <div className="flex flex-wrap gap-2 mb-5">
        <button
          onClick={() => setActiveCategory("all")}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-colors ${
            activeCategory === "all"
              ? "ig-gradient text-white"
              : "bg-white border border-ig-border text-foreground hover:bg-neutral-50"
          }`}
        >
          همه
        </button>
        {categories.map((cat) => {
          const Icon = iconMap[cat.icon];
          return (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-colors ${
                activeCategory === cat.key
                  ? "ig-gradient text-white"
                  : "bg-white border border-ig-border text-foreground hover:bg-neutral-50"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* لیست سوالات */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-ig-border rounded-2xl p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-ig-gray-bg flex items-center justify-center mx-auto mb-3">
            <HelpCircle className="w-7 h-7 text-ig-gray" strokeWidth={1.5} />
          </div>
          <p className="text-sm font-bold text-foreground mb-1">سوالی یافت نشد</p>
          <p className="text-xs text-ig-gray">عبارت دیگری را جستجو کنید</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item, i) => (
            <details
              key={i}
              open={openIndex === i}
              onToggle={(e) => {
                if ((e.target as HTMLDetailsElement).open) {
                  setOpenIndex(i);
                } else if (openIndex === i) {
                  setOpenIndex(null);
                }
              }}
              className="group bg-white border border-ig-border rounded-2xl overflow-hidden"
            >
              <summary className="cursor-pointer list-none flex items-center justify-between gap-3 px-5 py-4 hover:bg-neutral-50 transition-colors">
                <span className="text-sm font-bold text-foreground">{item.q}</span>
                <ChevronDown className="w-4 h-4 text-ig-gray shrink-0 group-open:rotate-180 transition-transform" />
              </summary>
              <div className="px-5 pb-4">
                <p className="text-sm text-foreground/70 leading-6">{item.a}</p>
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
