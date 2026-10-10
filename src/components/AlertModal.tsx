"use client";

// دیالوگ هشدار/تایید سفید به سبک اینستاگرام — جایگزین alert/confirm مرورگر
import Dialog from "@/components/ui/Dialog";

type Props = {
  open: boolean;
  message: string;
  title?: string;
  variant?: "error" | "info";
  onClose: () => void;
  /** اگر ست شود، دیالوگ به حالت تاییدیه تبدیل می شود */
  onConfirm?: () => void;
  confirmLabel?: string;
};

export default function AlertModal({ open, message, title, variant = "info", onClose, onConfirm, confirmLabel }: Props) {
  const isError = variant === "error";
  return (
    <Dialog
      open={open}
      title={title ?? (isError ? "خطا" : "توجه")}
      message={message}
      onClose={onClose}
      actions={
        onConfirm
          ? [
              { label: confirmLabel ?? "تایید", tone: isError ? "danger" : "primary", onClick: onConfirm },
              { label: "انصراف", onClick: onClose },
            ]
          : [{ label: "متوجه شدم", tone: "primary", onClick: onClose }]
      }
    />
  );
}
