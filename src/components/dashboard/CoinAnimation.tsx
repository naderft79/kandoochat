"use client";

// انیمیشن دریافت سکه — کارت با انیمیشن ورودی و نمایش مبلغ
import { useEffect, useState } from "react";
import { Coins, X } from "lucide-react";
import { toPersianDigits } from "@/lib/format";

type CoinAnimationProps = {
  amount: number;
  reason: string;
  show: boolean;
  onClose: () => void;
};

export default function CoinAnimation({ amount, reason, show, onClose }: CoinAnimationProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onClose, 300);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div
      className={`fixed top-20 left-1/2 -translate-x-1/2 z-[60] transition-all duration-300 ${
        visible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 -translate-y-4 scale-90"
      }`}
    >
      <div className="bg-ig-gray-bg rounded-2xl px-6 py-4 ig-shadow-lg flex items-center gap-3 min-w-[200px]">
        <div className="w-12 h-12 rounded-full bg-surface/30 flex items-center justify-center animate-bounce">
          <Coins className="w-7 h-7 text-white" fill="currentColor" />
        </div>
        <div className="flex-1">
          <p className="text-white font-bold text-lg">
            +{toPersianDigits(amount)} سکه
          </p>
          <p className="text-white/80 text-xs">{reason}</p>
        </div>
        <button
          onClick={() => {
            setVisible(false);
            setTimeout(onClose, 300);
          }}
          className="text-white/70 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
