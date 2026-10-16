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
      {/* نمایش رقم های وارد شده — دایره های پر و خالی */}
      <div
        dir="ltr"
        className={`flex justify-center gap-4 ${shake ? "ig-shake" : ""}`}
        aria-live="polite"
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <span
            key={i}
            className={`w-4 h-4 rounded-full transition-all duration-150 ${
              i < pin.length
                ? "bg-ig-blue scale-110 ig-shadow-sm"
                : "bg-transparent border-2 border-ig-border"
            }`}
          />
        ))}
      </div>
      <p className="mt-3 h-5 text-center text-xs font-bold text-ig-red" role="alert">
        {error}
      </p>

      {/* صفحه کلید عددی — دکمه ها با aspect-square همیشه دایره کامل می مانند */}
      <div
        dir="ltr"
        className={`grid grid-cols-3 mx-auto w-full ${compact ? "max-w-[200px] gap-2.5" : "max-w-[240px] gap-3"}`}
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
              className="aspect-square rounded-full flex items-center justify-center text-foreground active:bg-ig-btn2 active:scale-90 transition-all duration-100"
            >
              <Delete className={compact ? "w-4.5 h-4.5" : "w-5 h-5"} />
            </button>
          ) : (
            <button
              key={k}
              type="button"
              onClick={() => onDigit(k)}
              className={`aspect-square rounded-full flex items-center justify-center bg-ig-gray-bg border border-ig-divider font-black text-foreground ig-shadow-sm active:bg-ig-btn2 active:scale-90 transition-all duration-100 ${
                compact ? "text-lg" : "text-xl"
              }`}
            >
              {toPersianDigits(k)}
            </button>
          )
        )}
      </div>
    </div>
  );
}
