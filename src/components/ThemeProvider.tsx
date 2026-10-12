"use client";

// تم روشن و تاریک (مشترک بین کاربر و ادمین) — کلاس dark روی html و ذخیره در localStorage
import { useCallback, useSyncExternalStore, type MouseEvent, type ReactNode } from "react";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

const STORAGE_KEY = "kandoo-theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="light" enableSystem={false} storageKey={STORAGE_KEY}>
      {children}
    </NextThemesProvider>
  );
}

const subscribeNoop = () => () => {};
const useMounted = () => useSyncExternalStore(subscribeNoop, () => true, () => false);

type ViewTransitionDocument = Document & {
  startViewTransition?: (update: () => void) => { ready: Promise<void> };
};

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();
  const isDark = mounted && resolvedTheme === "dark";

  const toggle = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      const next = isDark ? "light" : "dark";
      const doc = document as ViewTransitionDocument;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!doc.startViewTransition || reduceMotion) {
        setTheme(next);
        return;
      }
      // انیمیشن دایره ای از محل کلیک: تغییر کلاس داخل همان انتقال انجام می شود
      const x = event.clientX;
      const y = event.clientY;
      const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
      const transition = doc.startViewTransition(() => {
        // ذخیره همزمان: اگر کاربر همین لحظه ریلود کند، انتخابش از دست نمی رود
        localStorage.setItem(STORAGE_KEY, next);
        document.documentElement.classList.toggle("dark", next === "dark");
        setTheme(next);
      });
      void transition.ready.then(() => {
        document.documentElement.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
          { duration: 450, easing: "ease-in-out", pseudoElement: "::view-transition-new(root)" }
        );
      });
    },
    [isDark, setTheme]
  );

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "تغییر به حالت روشن" : "تغییر به حالت تاریک"}
      title={isDark ? "حالت روشن" : "حالت تاریک"}
      className={`w-9 h-9 rounded-xl bg-ig-gray-bg hover:bg-ig-btn2-hover flex items-center justify-center shrink-0 transition-colors active:scale-95 ${className}`}
    >
      {isDark ? <Sun className="w-4 h-4 text-foreground" aria-hidden /> : <Moon className="w-4 h-4 text-foreground" aria-hidden />}
    </button>
  );
}
