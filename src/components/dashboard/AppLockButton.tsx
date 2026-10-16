"use client";

// قفل برنامه: پین ۴ رقمی + بیومتریک در اپ اندروید — ردیف قابلیت های ویژه
// پین فقط محلی روی همین دستگاه ذخیره می شود؛ قفل با AppLockGate در layout داشبورد اعمال می شود
import { useEffect, useState } from "react";
import { Lock, Fingerprint, ScanFace, KeyRound, LockOpen, Loader2 } from "lucide-react";
import { FeatureRow } from "@/components/dashboard/features/FeatureKit";
import { BottomSheet } from "@/components/ui/Modal";
import { PasswordInput } from "@/components/ui/Input";
import { normalizeDigits } from "@/lib/format";
import {
  getLockConfig,
  setLock,
  verifyPin,
  setBioEnabled,
  clearLock,
  checkBiometry,
  biometricUnlock,
  type BiometryKind,
} from "@/lib/appLock";

type Mode = "menu" | "set" | "change" | "disable";

export default function AppLockButton() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [bioOn, setBioOn] = useState(false);
  const [bioKind, setBioKind] = useState<BiometryKind>("none");
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("menu");

  const [pin, setPin] = useState("");
  const [pin2, setPin2] = useState("");
  const [currentPin, setCurrentPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // خواندن localStorage باید async انجام شود تا با SSR تداخل نکند
    void Promise.resolve().then(async () => {
      const cfg = getLockConfig();
      setEnabled(!!cfg);
      setBioOn(!!cfg?.bio);
      const s = await checkBiometry();
      setBioKind(s.available ? s.kind : "none");
    });
  }, []);

  const bioLabel =
    bioKind === "face" ? "ورود با تشخیص چهره" : "ورود با اثر انگشت";

  function openSheet() {
    setMode(getLockConfig() ? "menu" : "set");
    setPin("");
    setPin2("");
    setCurrentPin("");
    setError("");
    setOpen(true);
  }

  function validPin(p: string) {
    return /^\d{4}$/.test(p);
  }

  async function submit() {
    setError("");
    if (mode === "set") {
      if (!validPin(pin)) return setError("پین باید ۴ رقم باشد");
      if (pin !== pin2) return setError("تکرار پین با پین یکی نیست");
      setLoading(true);
      await setLock(pin, bioOn && bioKind !== "none");
      setEnabled(true);
      setLoading(false);
      setOpen(false);
      return;
    }
    if (mode === "change") {
      setLoading(true);
      if (!(await verifyPin(currentPin))) {
        setLoading(false);
        return setError("پین فعلی اشتباه است");
      }
      if (!validPin(pin)) {
        setLoading(false);
        return setError("پین جدید باید ۴ رقم باشد");
      }
      if (pin !== pin2) {
        setLoading(false);
        return setError("تکرار پین با پین جدید یکی نیست");
      }
      await setLock(pin, getLockConfig()?.bio ?? false);
      setLoading(false);
      setMode("menu");
      setPin("");
      setPin2("");
      setCurrentPin("");
      return;
    }
    if (mode === "disable") {
      setLoading(true);
      if (!(await verifyPin(currentPin))) {
        setLoading(false);
        return setError("پین اشتباه است");
      }
      clearLock();
      setEnabled(false);
      setBioOn(false);
      setLoading(false);
      setOpen(false);
      return;
    }
  }

  async function toggleBio(next: boolean) {
    // روشن کردن بیومتریک با یک بار تایید واقعی انجام می شود
    if (next) {
      const ok = await biometricUnlock();
      if (!ok) return;
    }
    await setBioEnabled(next);
    setBioOn(next);
  }

  return (
    <>
      <FeatureRow
        icon={Lock}
        title="قفل برنامه"
        subtitle={
          enabled
            ? `ورود با پین${bioOn && bioKind !== "none" ? " و بیومتریک" : ""} فعال است`
            : "قفل کردن ورود به برنامه با پین ۴ رقمی"
        }
        status={enabled ? { kind: "active", label: "فعال" } : undefined}
        onClick={openSheet}
      />

      <BottomSheet open={open} onClose={() => setOpen(false)} title="قفل برنامه" dismissible={!loading}>
        <div className="px-5 pt-4 pb-5">
          <div className="text-center">
            <span className="w-16 h-16 rounded-full bg-ig-gray-bg border border-ig-divider mx-auto flex items-center justify-center">
              <Lock className="w-8 h-8 text-foreground" strokeWidth={1.8} />
            </span>
            <p className="text-sm text-ig-gray mt-3 leading-6">
              {mode === "menu"
                ? "قفل برنامه فعال است — هر بار که وارد برنامه شوید پین یا بیومتریک لازم است."
                : "با فعال کردن قفل، هر بار ورود به برنامه پین ۴ رقمی لازم می شود."}
            </p>
          </div>

          {mode === "menu" && (
            <div className="mt-5 space-y-3">
              {bioKind !== "none" && (
                <button
                  type="button"
                  onClick={() => void toggleBio(!bioOn)}
                  className="w-full flex items-center justify-between rounded-xl bg-ig-gray-bg border border-ig-divider px-4 py-3"
                  aria-pressed={bioOn}
                >
                  <span className="flex items-center gap-2.5 text-sm font-bold text-foreground">
                    {bioKind === "face" ? (
                      <ScanFace className="w-5 h-5" />
                    ) : (
                      <Fingerprint className="w-5 h-5" />
                    )}
                    {bioLabel}
                  </span>
                  <span
                    className={`w-10 h-6 rounded-full p-0.5 transition-colors ${
                      bioOn ? "bg-ig-blue" : "bg-ig-border"
                    }`}
                  >
                    <span
                      className={`block w-5 h-5 rounded-full bg-white transition-transform ${
                        bioOn ? "-translate-x-4" : ""
                      }`}
                    />
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setMode("change");
                  setError("");
                  setPin("");
                  setPin2("");
                  setCurrentPin("");
                }}
                className="w-full flex items-center justify-center gap-2 h-11 rounded-lg bg-ig-btn2 text-foreground text-sm font-bold hover:bg-ig-btn2-hover transition-colors"
              >
                <KeyRound className="w-4 h-4" />
                تغییر پین
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("disable");
                  setError("");
                  setCurrentPin("");
                }}
                className="w-full flex items-center justify-center gap-2 h-11 rounded-lg border border-ig-red/40 text-ig-red text-sm font-bold hover:bg-ig-red/10 transition-colors"
              >
                <LockOpen className="w-4 h-4" />
                غیرفعال کردن قفل
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-full h-11 rounded-lg bg-ig-btn2 text-foreground text-sm font-bold hover:bg-ig-btn2-hover transition-colors"
              >
                انصراف
              </button>
            </div>
          )}

          {mode === "set" && (
            <div className="mt-5 space-y-3">
              <PasswordInput
                numeric
                maxLength={4}
                label="پین ۴ رقمی"
                placeholder="••••"
                value={pin}
                onChange={(e) => setPin(normalizeDigits(e.target.value).slice(0, 4))}
              />
              <PasswordInput
                numeric
                maxLength={4}
                label="تکرار پین"
                placeholder="••••"
                value={pin2}
                onChange={(e) => setPin2(normalizeDigits(e.target.value).slice(0, 4))}
              />
              {bioKind !== "none" && (
                <button
                  type="button"
                  onClick={() => setBioOn((v) => !v)}
                  className="w-full flex items-center justify-between rounded-xl bg-ig-gray-bg border border-ig-divider px-4 py-3"
                  aria-pressed={bioOn}
                >
                  <span className="flex items-center gap-2.5 text-sm font-bold text-foreground">
                    {bioKind === "face" ? (
                      <ScanFace className="w-5 h-5" />
                    ) : (
                      <Fingerprint className="w-5 h-5" />
                    )}
                    {bioLabel}
                  </span>
                  <span
                    className={`w-10 h-6 rounded-full p-0.5 transition-colors ${
                      bioOn ? "bg-ig-blue" : "bg-ig-border"
                    }`}
                  >
                    <span
                      className={`block w-5 h-5 rounded-full bg-white transition-transform ${
                        bioOn ? "-translate-x-4" : ""
                      }`}
                    />
                  </span>
                </button>
              )}
            </div>
          )}

          {mode === "change" && (
            <div className="mt-5 space-y-3">
              <PasswordInput
                numeric
                maxLength={4}
                label="پین فعلی"
                placeholder="••••"
                value={currentPin}
                onChange={(e) => setCurrentPin(normalizeDigits(e.target.value).slice(0, 4))}
              />
              <PasswordInput
                numeric
                maxLength={4}
                label="پین جدید"
                placeholder="••••"
                value={pin}
                onChange={(e) => setPin(normalizeDigits(e.target.value).slice(0, 4))}
              />
              <PasswordInput
                numeric
                maxLength={4}
                label="تکرار پین جدید"
                placeholder="••••"
                value={pin2}
                onChange={(e) => setPin2(normalizeDigits(e.target.value).slice(0, 4))}
              />
            </div>
          )}

          {mode === "disable" && (
            <div className="mt-5 space-y-3">
              <PasswordInput
                numeric
                maxLength={4}
                label="پین فعلی"
                placeholder="••••"
                value={currentPin}
                onChange={(e) => setCurrentPin(normalizeDigits(e.target.value).slice(0, 4))}
              />
            </div>
          )}

          {mode !== "menu" && error && (
            <p role="alert" className="mt-3 text-xs text-ig-red">
              {error}
            </p>
          )}

          {mode !== "menu" && (
            <>
              <button
                type="button"
                onClick={() => void submit()}
                disabled={loading}
                className="mt-4 w-full h-11 rounded-lg bg-ig-blue text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-ig-blue-hover disabled:opacity-40 active:scale-[0.98] transition-all"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" aria-hidden />}
                {mode === "set"
                  ? "فعال سازی قفل"
                  : mode === "change"
                    ? "ذخیره پین جدید"
                    : "غیرفعال کردن قفل"}
              </button>
              <button
                type="button"
                onClick={() => (getLockConfig() ? setMode("menu") : setOpen(false))}
                disabled={loading}
                className="mt-2 w-full h-11 rounded-lg bg-ig-btn2 text-foreground text-sm font-bold hover:bg-ig-btn2-hover disabled:opacity-40 transition-colors"
              >
                انصراف
              </button>
            </>
          )}
        </div>
      </BottomSheet>
    </>
  );
}
