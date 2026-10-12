"use client";

// بنر نصب PWA — از اولین بازدید نمایش داده می شود؛ بستن فقط چند روز آن را مخفی می کند
import { useEffect, useState } from "react";
import Image from "next/image";
import { X, Share, Plus } from "lucide-react";

const DISMISS_KEY = "kandoo-install-dismissed";
// بستن بنر به مدت ۳ روز آن را پنهان می کند و بعد دوباره تبلیغ می شود
const DISMISS_MS = 3 * 24 * 60 * 60 * 1000;

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

function isDismissed() {
  const ts = Number(localStorage.getItem(DISMISS_KEY) ?? 0);
  return ts > 0 && Date.now() - ts < DISMISS_MS;
}

export default function InstallBanner() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [iosMode, setIosMode] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isStandalone()) return;
    if (isDismissed()) return;

    // iOS رویداد installprompt ندارد — راهنمای دستی نمایش می دهیم
    if (isIos()) {
      queueMicrotask(() => {
        setIosMode(true);
        setShow(true);
      });
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setShow(false);
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === "accepted") {
      // نصب شد — دیگر لازم نیست تبلیغ شود (standalone هم برمی گرداند)
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
      setShow(false);
    }
  }

  if (!show) return null;

  return (
    <div className="fixed bottom-16 lg:bottom-4 inset-x-3 z-40 max-w-md mx-auto bg-surface border border-ig-border rounded-2xl shadow-lg p-3.5 flex items-center gap-3 ig-fade-in">
      <Image src="/bee-colori-logo.png" alt="کندو" width={40} height={40} className="rounded-xl shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-foreground">کندو را نصب کنید</p>
        <p className="text-xs text-ig-gray mt-0.5 leading-5">
          {iosMode ? (
            <>
              روی <Share className="w-3.5 h-3.5 inline" /> بزنید و سپس <span dir="ltr">Add to Home Screen</span> <Plus className="w-3.5 h-3.5 inline" /> را انتخاب کنید
            </>
          ) : (
            "دسترسی سریع تر و تجربه بهتر با نسخه نصب شده"
          )}
        </p>
      </div>
      {!iosMode && (
        <button
          onClick={install}
          className="px-4 h-9 rounded-lg bg-ig-blue text-white text-sm font-bold shrink-0 active:scale-95 transition-transform"
        >
          نصب
        </button>
      )}
      <button onClick={dismiss} aria-label="بستن" className="p-1.5 text-ig-gray hover:text-foreground shrink-0">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
