"use client";

// درصد تکمیل پروفایل + نشان ها
import { useEffect, useState } from "react";
import { toPersianDigits } from "@/lib/format";

type Badge = {
  key: string;
  label: string;
  icon: string;
  color: string;
};

export default function ProfileCompletion() {
  const [completion, setCompletion] = useState(0);
  const [badges, setBadges] = useState<Badge[]>([]);

  useEffect(() => {
    fetch("/api/profile-completion")
      .then((r) => r.json())
      .then((data) => {
        if (data.completion !== undefined) setCompletion(data.completion);
        if (data.badges) setBadges(data.badges);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-3">
      {/* نوار تکمیل پروفایل */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-bold text-foreground">تکمیل پروفایل</span>
          <span className="text-xs font-bold text-ig-gray">{toPersianDigits(completion)}٪</span>
        </div>
        <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-neutral-800 rounded-full transition-all duration-500"
            style={{ width: `${completion}%` }}
          />
        </div>
      </div>

      {/* نشان ها */}
      {badges.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {badges.map((b) => (
            <span
              key={b.key}
              className={`text-xs px-2 py-1 rounded-full bg-ig-gray-bg ${b.color} font-bold`}
            >
              {b.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
