"use client";

// صفحه قفل برنامه — اگر کاربر قفل فعال کرده باشد، روی کل داشبورد می نشیند
// پین ۴ رقمی + بیومتریک (اثر انگشت/چهره) در اپ اندروید
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Fingerprint, Lock, ScanFace } from "lucide-react";
import PinPad from "@/components/dashboard/PinPad";
import { useBrand } from "@/components/BrandProvider";
import {
  getLockConfig,
  verifyPin,
  clearLock,
  checkBiometry,
  biometricUnlock,
  type BiometryKind,
} from "@/lib/appLock";

export default function AppLockGate() {
  const brand = useBrand();
  const router = useRouter();
  const [locked, setLocked] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [bioKind, setBioKind] = useState<BiometryKind>("none");
  const busy = useRef(false);

  const tryBiometric = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    const ok = await biometricUnlock(brand.name);
    busy.current = false;
    if (ok) setLocked(false);
  }, [brand.name]);

  useEffect(() => {
    // خواندن localStorage باید async انجام شود تا با SSR تداخل نکند
    void Promise.resolve().then(() => {
      const cfg = getLockConfig();
      if (!cfg) return;
      setLocked(true);

      if (cfg.bio) {
        void checkBiometry().then((s) => {
          if (s.available) {
            setBioKind(s.kind);
            void tryBiometric();
          }
        });
      }
    });

    // در اپ بومی با برگشت به اپ، دوباره قفل می شود
    let remove: (() => void) | undefined;
    void import("@capacitor/core")
      .then(({ Capacitor }) => {
        if (!Capacitor.isNativePlatform()) return;
        return import("@capacitor/app").then(({ App }) => {
          let handle: { remove: () => void } | undefined;
          void App.addListener("appStateChange", ({ isActive }) => {
            if (isActive) setLocked(true);
          }).then((h) => {
            handle = h;
          });
          remove = () => handle?.remove();
        });
      })
      .catch(() => {});
    return () => remove?.();
  }, [tryBiometric]);

  useEffect(() => {
    if (!locked || pin.length < 4) return;
    busy.current = true;
    void verifyPin(pin).then((ok) => {
      busy.current = false;
      if (ok) {
        setLocked(false);
      } else {
        setError("پین اشتباه است");
        setPin("");
        setShake(true);
        setTimeout(() => setShake(false), 400);
      }
    });
  }, [locked, pin]);

  if (!locked) return null;

  function press(key: string) {
    if (busy.current) return;
    setError("");
    if (key === "del") {
      setPin((p) => p.slice(0, -1));
      return;
    }
    if (!key || pin.length >= 4) return;
    setPin((p) => p + key);
  }

  async function logoutAndRemoveLock() {
    clearLock();
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    router.push("/login");
    router.refresh();
  }

  const BioIcon = bioKind === "face" ? ScanFace : Fingerprint;
  const bioLabel =
    bioKind === "face" ? "ورود با تشخیص چهره" : "ورود با اثر انگشت";

  return (
    <div className="fixed inset-0 z-[100] bg-surface flex flex-col items-center justify-center p-6 select-none">
      {/* حلقه آیکون قفل با سایه نرم */}
      <span className="w-20 h-20 rounded-full bg-ig-gray-bg border border-ig-divider ig-shadow-md flex items-center justify-center">
        <span className="w-14 h-14 rounded-full bg-surface border border-ig-divider flex items-center justify-center">
          <Lock className="w-7 h-7 text-foreground" strokeWidth={1.8} />
        </span>
      </span>
      <h1 className="text-lg font-black text-foreground mt-4">{brand.name} قفل است</h1>
      <p className="text-xs text-ig-gray mt-1">پین ۴ رقمی را وارد کنید</p>

      {/* صفحه کلید عددی اختصاصی — کیبورد گوشی هیچ وقت باز نمی شود */}
      <div className="mt-6 w-full max-w-sm">
        <PinPad
          pin={pin}
          onDigit={(d) => press(d)}
          onDelete={() => press("del")}
          error={error}
          shake={shake}
        />
      </div>

      {bioKind !== "none" && (
        <button
          type="button"
          onClick={() => void tryBiometric()}
          className="mt-5 flex items-center gap-2 rounded-full bg-ig-gray-bg border border-ig-divider px-5 py-2.5 text-sm font-bold text-ig-blue active:scale-95 transition-all"
        >
          <BioIcon className="w-5 h-5" />
          {bioLabel}
        </button>
      )}

      <button
        type="button"
        onClick={() => void logoutAndRemoveLock()}
        className="mt-8 text-xs text-ig-gray underline"
      >
        پین را فراموش کرده اید؟ خروج از حساب و حذف قفل
      </button>
    </div>
  );
}
