"use client";

// نشان استریک روزانه — مثل اسنپ چت
import { useEffect, useState } from "react";
import { Flame } from "lucide-react";
import { toPersianDigits } from "@/lib/format";

export default function StreakIndicator() {
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/streak")
      .then((r) => r.json())
      .then((data) => {
        if (data.streak) setStreak(data.streak);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading || streak === 0) return null;

  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-ig-btn2 border border-neutral-200">
      <Flame className="w-4 h-4 text-neutral-700" fill="currentColor" />
      <span className="text-sm font-bold text-foreground">
        {toPersianDigits(streak)} روز
      </span>
    </div>
  );
}
