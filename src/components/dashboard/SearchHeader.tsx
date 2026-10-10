"use client";

// سربرگ صفحه جستجو — باکس جستجو چسبیده به سمت راست + جستجوهای اخیر + CoinBadge در سمت چپ
import { useEffect, useRef, useState } from "react";
import { Search, Clock, X } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import CoinBadge from "@/components/dashboard/CoinBadge";

type Props = {
  onSearch?: (query: string) => void;
};

const KEY = "kandoo_recent_searches";
const MAX = 5;

function readRecents(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "string").slice(0, MAX) : [];
  } catch {
    return [];
  }
}

export default function SearchHeader({ onSearch }: Props) {
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const [recents, setRecents] = useState<string[]>([]);
  const idle = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // خواندن localStorage فقط بعد از hydration ممکن است؛ در render زمان mismatch رخ می دهد
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRecents(readRecents());
  }, []);

  function remember(q: string) {
    const t = q.trim();
    if (t.length < 2) return;
    const next = [t, ...readRecents().filter((r) => r !== t)].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(next));
    setRecents(next);
  }

  function change(q: string) {
    setValue(q);
    onSearch?.(q);
    if (idle.current) clearTimeout(idle.current);
    // جستجوی بدون تغییر ۱ ثانیه به عنوان جستجوی اخیر ثبت می شود
    idle.current = setTimeout(() => remember(q), 1000);
  }

  function pick(q: string) {
    setValue(q);
    onSearch?.(q);
    setFocused(false);
  }

  function clearRecents() {
    localStorage.removeItem(KEY);
    setRecents([]);
  }

  const showRecents = focused && !value && recents.length > 0;

  return (
    <PageHeader
      right={
        <div className="relative w-full max-w-[560px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ig-gray" strokeWidth={2} aria-hidden />
          <input
            type="search"
            value={value}
            aria-label="جستجوی نام، نام کاربری یا شغل"
            placeholder="جستجوی نام، نام کاربری، شغل..."
            onChange={(e) => change(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            onKeyDown={(e) => e.key === "Enter" && remember(value)}
            className="w-full h-10 bg-ig-gray-bg rounded-lg pr-10 pl-4 text-base outline-none focus:bg-white focus:ring-1 focus:ring-ig-border transition-all"
          />
          {showRecents && (
            <div className="absolute top-full mt-1 inset-x-0 z-40 bg-white border border-ig-border rounded-lg shadow-lg overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 text-xs text-ig-gray">
                <span>جستجوهای اخیر</span>
                <button onMouseDown={(e) => e.preventDefault()} onClick={clearRecents} className="font-semibold text-ig-blue">
                  پاک کردن
                </button>
              </div>
              {recents.map((r) => (
                <button
                  key={r}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(r)}
                  className="w-full h-11 px-3 flex items-center gap-2 text-sm hover:bg-ig-gray-bg text-start"
                >
                  <Clock className="w-4 h-4 text-ig-gray shrink-0" aria-hidden />
                  <span className="flex-1 truncate">{r}</span>
                  <X className="w-4 h-4 text-ig-gray" aria-hidden />
                </button>
              ))}
            </div>
          )}
        </div>
      }
      left={<CoinBadge />}
    />
  );
}
