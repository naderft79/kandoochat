"use client";

// سویچ آبی (ON = آبی روشن اینستاگرام)؛ در RTL دستگیره از راست به چپ می رود
import { cn } from "./cn";

type Props = {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  "aria-label": string;
};

export default function Toggle({ checked, onChange, disabled, ...rest }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative w-11 h-6 rounded-full shrink-0 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ig-blue",
        checked ? "bg-ig-blue-bright" : "bg-ig-border",
        disabled && "opacity-50"
      )}
      {...rest}
    >
      <span
        className={cn(
          "absolute top-0.5 w-5 h-5 rounded-full bg-surface shadow-sm transition-all",
          checked ? "right-0.5" : "right-5"
        )}
      />
    </button>
  );
}
