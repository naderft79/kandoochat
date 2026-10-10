"use client";

// badge نمایش موجودی سکه در سربرگ — به روزرسانی زنده از LiveDataProvider
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Coins } from "lucide-react";
import { toPersianDigits } from "@/lib/format";
import { useLiveData } from "@/components/dashboard/LiveDataProvider";

export default function CoinBadge() {
  const { balance } = useLiveData();
  const [pulse, setPulse] = useState(false);
  const prevBalance = useRef<number | null>(null);

  useEffect(() => {
    if (balance === null) return;
    if (prevBalance.current !== null && balance !== prevBalance.current) {
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 1000);
      prevBalance.current = balance;
      return () => clearTimeout(t);
    }
    prevBalance.current = balance;
  }, [balance]);

  return (
    <Link
      href="/dashboard/coins"
      aria-label={`موجودی سکه: ${balance !== null ? toPersianDigits(balance) : "در حال بارگذاری"}`}
      className="flex items-center gap-1.5 h-9 px-3 rounded-full bg-ig-divider hover:bg-ig-btn2-hover transition-colors active:scale-95"
    >
      <span className={`text-sm font-bold text-foreground transition-all ${pulse ? "scale-110" : ""}`}>
        {balance !== null ? toPersianDigits(balance) : "…"}
      </span>
      <Coins
        className={`w-4 h-4 text-ig-gold transition-transform ${pulse ? "scale-125" : ""}`}
        fill="currentColor"
        aria-hidden
      />
    </Link>
  );
}
