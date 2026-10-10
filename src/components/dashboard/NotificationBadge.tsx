"use client";

// badge نوتیفیکیشن — شمارش خوانده نشده
import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { toPersianDigits } from "@/lib/format";

export default function NotificationBadge() {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((data) => {
        if (data.unreadCount !== undefined) setUnread(data.unreadCount);
      })
      .catch(() => {});

    // هر ۳۰ ثانیه به روزرسانی
    const interval = setInterval(() => {
      fetch("/api/notifications")
        .then((r) => r.json())
        .then((data) => {
          if (data.unreadCount !== undefined) setUnread(data.unreadCount);
        })
        .catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative">
      <Bell className="w-6 h-6 text-foreground" strokeWidth={1.5} />
      {unread > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-ig-red rounded-full flex items-center justify-center text-xs font-bold text-white px-1">
          {toPersianDigits(unread > 99 ? "۹۹+" : unread)}
        </span>
      )}
    </div>
  );
}
