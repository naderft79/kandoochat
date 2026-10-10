"use client";

// دیالوگ تایید/هشدار سفید به سبک اینستاگرام: دکمه های متنی عمودی با خط جداکننده
import { useRef } from "react";
import { Modal } from "./Modal";
import { cn } from "./cn";

export type DialogAction = {
  label: string;
  onClick: () => void;
  tone?: "primary" | "danger" | "default";
  disabled?: boolean;
};

type Props = {
  open: boolean;
  title?: string;
  message: string;
  actions: DialogAction[];
  onClose: () => void;
  dismissible?: boolean;
};

const tones = {
  primary: "text-ig-blue font-bold",
  danger: "text-ig-red font-bold",
  default: "text-foreground font-normal",
};

export default function Dialog({ open, title, message, actions, onClose, dismissible = true }: Props) {
  const first = useRef<HTMLButtonElement>(null);
  return (
    <Modal open={open} onClose={onClose} title={title ?? message} hideClose dismissible={dismissible} className="max-w-xs rounded-xl p-0">
      <div className="px-6 pt-6 pb-5 text-center">
        {title && <h2 className="text-base font-bold text-foreground mb-1.5">{title}</h2>}
        <p className="text-sm text-ig-gray leading-6">{message}</p>
      </div>
      <div className="border-t border-ig-border">
        {actions.map((a, i) => (
          <button
            key={a.label}
            ref={i === 0 ? first : undefined}
            type="button"
            disabled={a.disabled}
            onClick={a.onClick}
            className={cn(
              "w-full h-12 text-sm transition-colors hover:bg-ig-gray-bg disabled:opacity-40",
              i > 0 && "border-t border-ig-border",
              tones[a.tone ?? "default"]
            )}
          >
            {a.label}
          </button>
        ))}
      </div>
    </Modal>
  );
}
