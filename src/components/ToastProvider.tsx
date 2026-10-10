"use client";

// سیستم toast تیره به سبک اینستاگرام — موبایل: پایین (بالای تب ها)، دسکتاپ: گوشه پایین چپ
import { createContext, useCallback, useContext, useState, ReactNode } from "react";
import { AlertTriangle, X } from "lucide-react";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="fixed z-[100] bottom-[calc(4.5rem+env(safe-area-inset-bottom))] lg:bottom-6 inset-x-0 lg:inset-x-auto lg:left-6 flex flex-col items-center lg:items-start gap-2 pointer-events-none px-4"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex items-center gap-3 bg-ig-toast text-white rounded-lg px-4 py-3 min-h-12 max-w-sm w-full lg:w-auto ig-slide-up shadow-lg"
          >
            {(t.type === "error" || t.type === "warning") && <AlertTriangle className="w-5 h-5 shrink-0" aria-hidden />}
            <p className="flex-1 text-sm">{t.message}</p>
            <button onClick={() => dismiss(t.id)} aria-label="بستن" className="shrink-0 w-8 h-8 flex items-center justify-center text-white/70 hover:text-white">
              <X className="w-4 h-4" aria-hidden />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
