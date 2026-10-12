"use client";

// کشیدن به پایین برای تازه سازی — دقیقا مثل اینستاگرام (برای PWA و اندروید)
// جایگزین رفرش داخلی مرورگر می شود که با overscroll-behavior خاموش است
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useLiveData } from "@/components/dashboard/LiveDataProvider";

const THRESHOLD = 72; // حد کشیدن برای فعال شدن رفرش
const REST = 52; // ارتفاع اسپینر هنگام رفرش
const MAX_PULL = 120; // سقف کشیدن
const SPINNER = 44; // اندازه دایره اسپینر

// آیا زنجیره اسکرولرهای داخلی زیر اسکرولر اصلی همه در بالا هستند؟
function innerAtTop(target: Element | null, stop: Element): boolean {
  let el = target;
  while (el && el !== stop) {
    const oy = getComputedStyle(el).overflowY;
    if ((oy === "auto" || oy === "scroll") && el.scrollTop > 0) return false;
    el = el.parentElement;
  }
  return true;
}

export default function PullToRefresh({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { refresh } = useLiveData();
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const pullRef = useRef(0);
  const refreshingRef = useRef(false);

  const doRefresh = useCallback(async () => {
    if (refreshingRef.current) return;
    refreshingRef.current = true;
    setRefreshing(true);
    pullRef.current = REST;
    setPull(REST);
    refresh();
    router.refresh();
    // حداقل زمان چرخش تا انیمیشن دیده شود
    await new Promise((r) => setTimeout(r, 700));
    refreshingRef.current = false;
    setRefreshing(false);
    pullRef.current = 0;
    setPull(0);
  }, [refresh, router]);

  useEffect(() => {
    const wrap = wrapRef.current;
    const scroller = wrap?.parentElement; // <main> اسکرولر اصلی
    if (!wrap || !scroller) return;

    let startY = 0;
    let startX = 0;
    let pulling = false;

    const damp = (dy: number) => Math.min(MAX_PULL, dy * 0.45);

    const onStart = (e: TouchEvent) => {
      if (refreshingRef.current) return;
      if (scroller.scrollTop > 0) return;
      const t = e.touches[0];
      startY = t.clientY;
      startX = t.clientX;
      pulling = true;
    };

    const onMove = (e: TouchEvent) => {
      if (!pulling || refreshingRef.current) return;
      const t = e.touches[0];
      const dy = t.clientY - startY;
      const dx = t.clientX - startX;

      // کشیدن افقی (کاروسل استوری و...) نادیده گرفته می شود
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
        pulling = false;
        return;
      }
      if (dy <= 0 || scroller.scrollTop > 0) {
        if (pullRef.current !== 0) {
          pullRef.current = 0;
          setPull(0);
        }
        if (dy <= 0) pulling = false;
        return;
      }
      // اگر لیست داخلی هنوز پایین تر است، اسکرول خودش را بکند نه رفرش
      if (!innerAtTop(e.target as Element, scroller)) {
        pulling = false;
        return;
      }
      e.preventDefault();
      pullRef.current = damp(dy);
      setPull(pullRef.current);
    };

    const onEnd = () => {
      if (!pulling) return;
      pulling = false;
      if (pullRef.current >= THRESHOLD) void doRefresh();
      else {
        pullRef.current = 0;
        setPull(0);
      }
    };

    wrap.addEventListener("touchstart", onStart, { passive: true });
    wrap.addEventListener("touchmove", onMove, { passive: false });
    wrap.addEventListener("touchend", onEnd, { passive: true });
    wrap.addEventListener("touchcancel", onEnd, { passive: true });
    return () => {
      wrap.removeEventListener("touchstart", onStart);
      wrap.removeEventListener("touchmove", onMove);
      wrap.removeEventListener("touchend", onEnd);
      wrap.removeEventListener("touchcancel", onEnd);
    };
  }, [doRefresh]);

  const progress = Math.min(1, pull / THRESHOLD);
  // ترنزیشن فقط هنگام برگشت/استراحت — حین کشیدن انگشت حرکت لحظه ای است
  const settling = pull === 0 || refreshing;

  return (
    <div ref={wrapRef} className="relative">
      {/* دایره اسپینر — از بالای صفحه بیرون می آید */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-30 flex justify-center"
        style={{
          transform: `translateY(${pull - SPINNER}px)`,
          opacity: refreshing ? 1 : progress,
          transition: settling ? "transform .25s ease-out" : "none",
        }}
      >
        <div
          className="w-11 h-11 rounded-full bg-surface border border-ig-border shadow-md flex items-center justify-center"
          style={{ transform: refreshing ? undefined : `rotate(${progress * 360}deg)` }}
        >
          <Loader2
            className={`w-5 h-5 text-foreground ${refreshing ? "animate-spin" : ""}`}
            strokeWidth={2.5}
          />
        </div>
      </div>

      {/* محتوا با انگشت پایین می آید مثل اینستاگرام */}
      <div
        style={{
          transform: pull ? `translateY(${pull}px)` : undefined,
          transition: settling ? "transform .25s ease-out" : "none",
        }}
      >
        {children}
      </div>
    </div>
  );
}
