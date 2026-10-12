"use client";

// پایه مودال: Esc، focus trap، scroll lock، بازگرداندن فوکوس و بسته شدن با دکمه back مرورگر
import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "./cn";

let lockCount = 0;
const FOCUSABLE =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

function useOverlay(open: boolean, onClose: () => void, panel: React.RefObject<HTMLElement | null>) {
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    lockCount++;
    document.body.style.overflow = "hidden";

    // دکمه back مرورگر/اندروید مودال را می بندد
    let closedByPop = false;
    history.pushState({ ...(history.state ?? {}), __modal: true }, "");
    const onPop = () => {
      closedByPop = true;
      closeRef.current();
    };
    window.addEventListener("popstate", onPop);

    const el0 = panel.current;
    const first = el0?.querySelector<HTMLElement>("[data-autofocus]") ?? el0?.querySelector<HTMLElement>(FOCUSABLE) ?? el0;
    first?.focus({ preventScroll: true });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        closeRef.current();
        return;
      }
      const el = panel.current;
      if (e.key !== "Tab" || !el) return;
      const nodes = Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((n) => n.offsetParent !== null);
      if (!nodes.length) {
        e.preventDefault();
        return;
      }
      const f = nodes[0];
      const l = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === f) {
        e.preventDefault();
        l.focus();
      } else if (!e.shiftKey && document.activeElement === l) {
        e.preventDefault();
        f.focus();
      }
    };
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("popstate", onPop);
      if (--lockCount <= 0) {
        lockCount = 0;
        document.body.style.overflow = "";
      }
      if (!closedByPop && history.state?.__modal) history.back();
      prev?.focus?.({ preventScroll: true });
    };
  }, [open, panel]);
}

function Portal({ children }: { children: ReactNode }) {
  // مودال هیچ وقت در SSR باز نیست، پس ایجاد مستقیم portal امن است
  return typeof document === "undefined" ? null : createPortal(children, document.body);
}

type BaseProps = {
  open: boolean;
  onClose: () => void;
  /** عنوان برای فناوری کمکی و هدر */
  title?: string;
  children: ReactNode;
  className?: string;
  /** اگر false باشد کلیک بیرون و Esc نمی بندد (مثلا در حال ارسال) */
  dismissible?: boolean;
  hideClose?: boolean;
};

function useGuard(onClose: () => void, dismissible: boolean) {
  return dismissible ? onClose : () => {};
}

/** مودال وسط صفحه */
export function Modal({ open, onClose, title, children, className, dismissible = true, hideClose }: BaseProps) {
  const ref = useRef<HTMLDivElement>(null);
  const close = useGuard(onClose, dismissible);
  useOverlay(open, close, ref);
  if (!open) return null;
  return (
    <Portal>
      <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 ig-fade-in" onClick={close} aria-hidden />
        <div
          ref={ref}
          role="dialog"
          aria-modal="true"
          aria-label={title}
          tabIndex={-1}
          className={cn("relative w-full max-w-md max-h-[90dvh] overflow-y-auto rounded-xl bg-surface ig-modal-in outline-none", className)}
        >
          {!hideClose && (
            <button
              type="button"
              onClick={close}
              aria-label="بستن"
              className="absolute top-2 left-2 z-10 w-10 h-10 rounded-full flex items-center justify-center hover:bg-ig-gray-bg"
            >
              <X className="w-5 h-5" aria-hidden />
            </button>
          )}
          {children}
        </div>
      </div>
    </Portal>
  );
}

/** شیت پایین (موبایل) / مودال وسط (دسکتاپ) با دسته برای کشیدن به پایین */
export function BottomSheet({ open, onClose, title, children, className, dismissible = true }: BaseProps) {
  const ref = useRef<HTMLDivElement>(null);
  const startY = useRef<number | null>(null);
  const close = useGuard(onClose, dismissible);
  useOverlay(open, close, ref);

  function onDown(e: React.PointerEvent) {
    startY.current = e.clientY;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onMove(e: React.PointerEvent) {
    if (startY.current === null || !ref.current) return;
    const dy = Math.max(0, e.clientY - startY.current);
    ref.current.style.transform = `translateY(${dy}px)`;
  }
  function onUp(e: React.PointerEvent) {
    if (startY.current === null || !ref.current) return;
    const dy = e.clientY - startY.current;
    startY.current = null;
    ref.current.style.transform = "";
    if (dy > 90) close();
  }

  if (!open) return null;
  return (
    <Portal>
      <div className="fixed inset-0 z-[90] flex items-end lg:items-center justify-center">
        <div className="absolute inset-0 bg-black/60 ig-fade-in" onClick={close} aria-hidden />
        <div
          ref={ref}
          role="dialog"
          aria-modal="true"
          aria-label={title}
          tabIndex={-1}
          className={cn(
            "relative w-full lg:max-w-md max-h-[90dvh] overflow-y-auto bg-surface outline-none",
            "rounded-t-2xl lg:rounded-xl ig-slide-up lg:ig-modal-in pb-[env(safe-area-inset-bottom)]",
            className
          )}
        >
          <div
            className="lg:hidden flex justify-center pt-2 pb-1 touch-none cursor-grab"
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
            aria-hidden
          >
            <span className="w-10 h-1 rounded-full bg-ig-border" />
          </div>
          {title && <h2 className="px-5 pt-2 pb-3 text-center text-base font-bold border-b border-ig-divider">{title}</h2>}
          {children}
        </div>
      </div>
    </Portal>
  );
}
