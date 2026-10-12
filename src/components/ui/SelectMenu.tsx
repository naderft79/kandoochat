"use client";

// دراپ دان سفارشی — کلیک روی فیلد، لیست گزینه ها زیر آن باز می شود
// برای لیست های بلند (بیش از ۱۵ گزینه) جستجو هم دارد
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/components/ui/cn";

export type SelectOption = { value: string; label: string };

type Props = {
  label?: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
};

export default function SelectMenu({ label, value, options, onChange, placeholder = "انتخاب کنید", error, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  // بستن با کلیک بیرون یا Escape
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const selected = options.find((o) => o.value === value);
  const filtered = q ? options.filter((o) => o.label.includes(q)) : options;

  return (
    <div className="space-y-1.5" ref={ref}>
      {label && <span className="block text-sm font-semibold">{label}</span>}
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          aria-expanded={open}
          onClick={() => {
            setOpen((o) => !o);
            setQ("");
          }}
          className={cn(
            "w-full h-11 px-3 rounded-lg border bg-ig-gray-bg text-base flex items-center justify-between gap-2 outline-none transition-colors",
            "focus:bg-surface focus:border-ig-gray disabled:opacity-50",
            error ? "border-ig-red" : "border-ig-border"
          )}
        >
          <span className={cn("truncate", selected ? "text-foreground" : "text-ig-gray")}>
            {selected?.label ?? placeholder}
          </span>
          <ChevronDown className={cn("w-4 h-4 shrink-0 text-ig-gray transition-transform", open && "rotate-180")} aria-hidden />
        </button>

        {open && (
          <div className="absolute z-40 top-full mt-1 inset-x-0 bg-surface border border-ig-border rounded-xl shadow-lg overflow-hidden">
            {options.length > 15 && (
              <div className="sticky top-0 bg-surface p-2 border-b border-ig-border">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="جستجو..."
                  autoFocus
                  className="w-full h-9 px-3 rounded-lg bg-ig-gray-bg text-sm outline-none"
                />
              </div>
            )}
            <div className="max-h-56 overflow-y-auto overscroll-contain">
              {filtered.length === 0 && (
                <p className="text-sm text-ig-gray text-center py-4">موردی یافت نشد</p>
              )}
              {filtered.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between gap-2 px-4 py-2.5 text-sm text-right hover:bg-ig-gray-bg transition-colors",
                    o.value === value && "font-bold"
                  )}
                >
                  {o.label}
                  {o.value === value && <Check className="w-4 h-4 shrink-0 text-ig-blue" aria-hidden />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      {error && <p role="alert" className="text-sm text-ig-red">{error}</p>}
    </div>
  );
}
