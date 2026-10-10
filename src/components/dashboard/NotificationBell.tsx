"use client";

// زنگوله اعلان ها — بج تعداد خوانده نشده از LiveDataProvider
import Link from "next/link";
import { Heart } from "lucide-react";
import { toPersianDigits } from "@/lib/format";
import { useLiveData } from "@/components/dashboard/LiveDataProvider";

export default function NotificationBell() {
  const { unreadCount } = useLiveData();

  return (
    <Link
      href="/dashboard/notifications"
      aria-label={unreadCount > 0 ? `اعلان ها: ${toPersianDigits(unreadCount)} خوانده نشده` : "اعلان ها"}
      className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-ig-divider transition-colors active:scale-95"
    >
      <Heart className="w-6 h-6 text-foreground" strokeWidth={1.8} />
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -end-0.5 min-w-4 h-4 px-0.5 rounded-full bg-ig-red text-white text-xs font-bold flex items-center justify-center leading-none">
          {unreadCount > 9 ? "+۹" : toPersianDigits(unreadCount)}
        </span>
      )}
    </Link>
  );
}
