"use client";

// صفحه کلید عددی اختصاصی برای پین — کیبورد گوشی به هیچ عنوان باز نمی شود
import { Delete } from "lucide-react";
import { toPersianDigits } from "@/lib/format";

const PAD = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];

export default function PinPad({
  pin,
  onDigit,
  onDelete,
  error,
  shake,
  compact,
}: {
  pin: string;
  onDigit: (d: string) => void;
  onDelete: () => void;
  error?: string;
  shake?: boolean;
  compact?: boolean;
}) {
  return (
    <div className="select-none">
      {/* نمایش رقم های وارد شده */}
      <div
        dir="ltr"
        className={`flex justify-center gap-3 ${shake ? "ig-shake" : ""}`}
        aria-live="polite"
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <span
            key={i}
            className={`w-3.5 h-3.5 rounded-full border-2 transition-colors ${
              i < pin.length
                ? "bg-ig-blue border-ig-blue"
                : "border-ig-border bg-transparent"
            }`}
          />
        ))}
      </div>
      <p className="mt-3 h-5 text-center text-xs text-ig-red" role="alert">
        {error}
      </p>

      {/* صفحه کلید عددی */}
      <div
        dir="ltr"
        className={`grid grid-cols-3 gap-3 mx-auto w-full ${compact ? "max-w-[220px]" : "max-w-[260px]"}`}
      >
        {PAD.map((k, i) =>
          k === "" ? (
            <span key={`e${i}`} />
          ) : k === "del" ? (
            <button
              key="del"
              type="button"
              onClick={onDelete}
              aria-label="حذف"
              className={`${compact ? "h-12" : "h-16"} rounded-full flex items-center justify-center text-foreground active:bg-ig-btn2 transition-colors`}
            >
              <Delete className={compact ? "w-5 h-5" : "w-6 h-6"} />
            </button>
          ) : (
            <button
              key={k}
              type="button"
              onClick={() => onDigit(k)}
              className={`${compact ? "h-12 text-lg" : "h-16 text-xl"} rounded-full bg-ig-gray-bg border border-ig-divider font-bold text-foreground active:bg-ig-btn2 transition-colors`}
            >
              {toPersianDigits(k)}
            </button>
          )
        )}
      </div>
    </div>
  );
}
