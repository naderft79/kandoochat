"use client";

// پوسته چت: در دسکتاپ لیست و اتاق کنار هم، در موبایل فقط یکی (بر اساس مسیر)
import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/components/ui/cn";

export default function ChatShell({ list, children }: { list: ReactNode; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isIndex = pathname === "/dashboard/chat";

  // تازه سازی دوره ای لیست (شمارنده پیام ها) چون layout بین گفتگوها دوباره رندر نمی شود
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, 30000);
    return () => clearInterval(id);
  }, [router]);

  return (
    <div className="flex h-full min-h-0">
      <aside
        className={cn(
          "h-full min-h-0 overflow-y-auto no-scrollbar lg:block lg:w-[380px] lg:shrink-0 lg:border-l lg:border-ig-border w-full",
          isIndex ? "block" : "hidden"
        )}
      >
        {list}
      </aside>
      <section className={cn("h-full min-h-0 flex-1 min-w-0 lg:block", isIndex ? "hidden" : "block")}>{children}</section>
    </div>
  );
}
