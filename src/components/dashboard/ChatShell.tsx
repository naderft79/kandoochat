"use client";

// پوسته چت: در دسکتاپ لیست و اتاق کنار هم، در موبایل فقط یکی (بر اساس مسیر)
import { useEffect, useRef, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/components/ui/cn";

export default function ChatShell({ list, children }: { list: ReactNode; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isIndex = pathname === "/dashboard/chat";
  const rootRef = useRef<HTMLDivElement>(null);

  // قفل کامل اسکرول صفحه در بخش چت: main اسکرولر اصلی است و اگر ارتفاع محتوا
  // حتی کمی از قاب بیشتر شود هدر/اینپوت/منوی موبایل با صفحه می غلتند.
  // اینجا overflow آن را مخفی می کنیم و ارتفاع پوسته را دقیقا برابر فضای باقی مانده
  // قاب (بعد از بنرها و پدینگ پایین main) تنظیم می کنیم تا هیچ اسکرول بیرونی وجود نداشته باشد.
  useEffect(() => {
    const root = rootRef.current;
    const main = root?.closest("main");
    if (!root || !main) return;
    main.style.overflowY = "hidden";
    let raf = 0;
    const apply = () => {
      raf = 0;
      const padBottom = parseFloat(getComputedStyle(main).paddingBottom) || 0;
      const topOffset = root.getBoundingClientRect().top - main.getBoundingClientRect().top;
      root.style.height = `${Math.max(0, Math.round(main.clientHeight - padBottom - topOffset))}px`;
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };
    apply();
    const vv = window.visualViewport;
    window.addEventListener("resize", schedule);
    vv?.addEventListener("resize", schedule);
    vv?.addEventListener("scroll", schedule);
    // باز/بسته شدن بنر اطلاعیه یا کیبورد، ارتفاع را دوباره محاسبه می کند
    const mo = new MutationObserver(schedule);
    mo.observe(main, { childList: true });
    return () => {
      cancelAnimationFrame(raf);
      mo.disconnect();
      main.style.overflowY = "";
      root.style.height = "";
      window.removeEventListener("resize", schedule);
      vv?.removeEventListener("resize", schedule);
      vv?.removeEventListener("scroll", schedule);
    };
  }, []);

  // تازه سازی دوره ای لیست (شمارنده پیام ها) چون layout بین گفتگوها دوباره رندر نمی شود
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, 30000);
    return () => clearInterval(id);
  }, [router]);

  return (
    <div ref={rootRef} className="flex h-full min-h-0 overflow-hidden">
      <aside
        className={cn(
          "h-full min-h-0 overflow-y-auto overscroll-contain no-scrollbar lg:block lg:w-[380px] lg:shrink-0 lg:border-l lg:border-ig-border w-full",
          isIndex ? "block" : "hidden"
        )}
      >
        {list}
      </aside>
      <section className={cn("h-full min-h-0 flex-1 min-w-0 lg:block", isIndex ? "hidden" : "block")}>{children}</section>
    </div>
  );
}
