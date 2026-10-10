"use client";

// انتخاب و نمایش علایق کاربر — آیکن های حرفه ای
import { useEffect, useState, useCallback } from "react";
import {
  Check, Dumbbell, Music, Plane, ChefHat, Film, BookOpen, Palette,
  Laptop, Camera, Trees, PartyPopper, Gamepad2, Coffee, Car, Cat,
  Shirt, Flower2, Mountain, Waves, Brush, type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  Dumbbell, Music, Plane, ChefHat, Film, BookOpen, Palette,
  Laptop, Camera, Trees, PartyPopper, Gamepad2, Coffee, Car, Cat,
  Shirt, Flower2, Mountain, Waves, Brush,
};

type Interest = {
  id: string;
  name: string;
  icon: string;
};

export default function InterestPicker({ initialInterestIds }: { initialInterestIds: string[] }) {
  const [interests, setInterests] = useState<Interest[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set(initialInterestIds));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/interests")
      .then((r) => r.json())
      .then((data) => {
        if (data.interests) setInterests(data.interests);
        if (data.userInterestIds) setSelected(new Set(data.userInterestIds));
      })
      .catch(() => {});
  }, []);

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const save = useCallback(async () => {
    setLoading(true);
    try {
      await fetch("/api/interests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interestIds: Array.from(selected) }),
      });
    } finally {
      setLoading(false);
    }
  }, [selected]);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-foreground">علایق</h3>
        <button
          onClick={save}
          disabled={loading}
          className="text-xs font-bold text-neutral-600 hover:text-black disabled:opacity-40 transition-colors"
        >
          {loading ? "در حال ذخیره..." : "ذخیره"}
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {interests.map((interest) => {
          const isSelected = selected.has(interest.id);
          const Icon = ICON_MAP[interest.icon] || Check;
          return (
            <button
              key={interest.id}
              onClick={() => toggle(interest.id)}
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold transition-all active:scale-95 ${
                isSelected
                  ? "bg-ig-blue text-white"
                  : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
              }`}
            >
              <Icon className="w-3 h-3" />
              <span>{interest.name}</span>
              {isSelected && <Check className="w-2.5 h-2.5" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
