"use client";

// قفل برنامه: پین ۴ رقمی + بیومتریک در اپ اندروید — ردیف قابلیت های ویژه
// پین فقط محلی روی همین دستگاه ذخیره می شود؛ قفل با AppLockGate در layout داشبورد اعمال می شود
// ورود پین فقط با صفحه کلید عددی خود برنامه است — کیبورد گوشی هیچ وقت باز نمی شود
import { useEffect, useRef, useState } from "react";
import { Lock, Fingerprint, ScanFace, KeyRound, LockOpen, Loader2, Info } from "lucide-react";
import { FeatureRow } from "@/components/dashboard/features/FeatureKit";
import { BottomSheet } from "@/components/ui/Modal";
import PinPad from "@/components/dashboard/PinPad";
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

type Mode = "info" | "set" | "change" | "disable" | "menu";

// مراحل هر حالت — هر مرحله یک پین ۴ رقمی با صفحه کلید خودمان
const STEP_LABELS: Record<"set" | "change" | "disable", string[]> = {
  set: ["پین ۴ رقمی انتخاب کنید", "تکرار پین"],
  change: ["پین فعلی", "پین جدید", "تکرار پین جدید"],
  disable: ["پین فعلی"],
};

const INFO_POINTS = [
  "هر بار که وارد برنامه شوید، پین ۴ رقمی لازم است",
  "پین فقط روی همین گوشی نگه داری می شود و به سرور ارسال نمی شود",
  "روی اندروید می توانید اثر انگشت یا تشخیص چهره را هم فعال کنید",
  "پین همیشه لازم است — اگر بیومتریک کار نکرد با پین وارد می شوید",
  "اگر پین را فراموش کنید، با خروج از حساب قفل پاک می شود",
];

export default function AppLockButton() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [bioOn, setBioOn] = useState(false);
  const [bioKind, setBioKind] = useState<BiometryKind>("none");
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("info");

  const [step, setStep] = useState(0);
  const [vals, setVals] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);
  const busy = useRef(false);

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

  const pin = vals[step] ?? "";
  const steps = mode in STEP_LABELS ? STEP_LABELS[mode as "set"] : [];

  function openSheet() {
    // قفل فعال → منوی مدیریت؛ غیرفعال → اول مودال توضیحات
    setMode(getLockConfig() ? "menu" : "info");
    setStep(0);
    setVals([]);
    setError("");
    setOpen(true);
  }

  function fail(msg: string, restart = true) {
    setError(msg);
    setShake(true);
    setTimeout(() => setShake(false), 400);
    if (restart) {
      setVals([]);
      setStep(0);
    } else {
      const nv = [...vals];
      nv[step] = "";
      setVals(nv);
    }
  }

  async function finish(v: string[]) {
    if (mode === "set") {
      if (v[0] !== v[1]) return fail("تکرار پین با پین یکی نیست");
      setLoading(true);
      await setLock(v[0], bioOn && bioKind !== "none");
      setLoading(false);
      setEnabled(true);
      setOpen(false);
      return;
    }
    if (mode === "change") {
      setLoading(true);
      if (!(await verifyPin(v[0]))) {
        setLoading(false);
        return fail("پین فعلی اشتباه است");
      }
      if (v[1] !== v[2]) {
        setLoading(false);
        setError("تکرار پین با پین جدید یکی نیست");
        setShake(true);
        setTimeout(() => setShake(false), 400);
        // پین فعلی درست بوده — فقط پین جدید دوباره گرفته می شود
        setVals([v[0]]);
        setStep(1);
        return;
      }
      await setLock(v[1], getLockConfig()?.bio ?? false);
      setLoading(false);
      setMode("menu");
      setStep(0);
      setVals([]);
      return;
    }
    if (mode === "disable") {
      setLoading(true);
      if (!(await verifyPin(v[0]))) {
        setLoading(false);
        return fail("پین اشتباه است", false);
      }
      clearLock();
      setEnabled(false);
      setBioOn(false);
      setLoading(false);
      setOpen(false);
    }
  }

  function onDigit(d: string) {
    if (busy.current || loading) return;
    setError("");
    const next = (pin + d).slice(0, 4);
    const nv = [...vals];
    nv[step] = next;
    setVals(nv);
    if (next.length === 4) {
      busy.current = true;
      void (async () => {
        try {
          // کمی صبر تا آخرین رقم دیده شود
          await new Promise((r) => setTimeout(r, 150));
          if (step < steps.length - 1) {
            setStep(step + 1);
          } else {
            await finish(nv);
          }
        } finally {
          busy.current = false;
        }
      })();
    }
  }

  function onDelete() {
    if (busy.current || loading) return;
    const nv = [...vals];
    nv[step] = pin.slice(0, -1);
    setVals(nv);
    setError("");
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

  const bioToggle = bioKind !== "none" && (
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
  );

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
          {mode === "info" && (
            <>
              <div className="text-center">
                <span className="w-16 h-16 rounded-full bg-ig-gray-bg border border-ig-divider mx-auto flex items-center justify-center">
                  <Lock className="w-8 h-8 text-foreground" strokeWidth={1.8} />
                </span>
              </div>
              <ul className="mt-4 space-y-2.5">
                {INFO_POINTS.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-xs text-ig-gray leading-5">
                    <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-ig-blue" />
                    {p}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => {
                  setMode("set");
                  setStep(0);
                  setVals([]);
                  setError("");
                }}
                className="mt-5 w-full h-11 rounded-lg bg-ig-blue text-white text-sm font-bold hover:bg-ig-blue-hover active:scale-[0.98] transition-all"
              >
                فعال سازی قفل
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="mt-2 w-full h-11 rounded-lg bg-ig-btn2 text-foreground text-sm font-bold hover:bg-ig-btn2-hover transition-colors"
              >
                انصراف
              </button>
            </>
          )}

          {(mode === "set" || mode === "change" || mode === "disable") && (
            <>
              <p className="text-center text-sm font-bold text-foreground mb-4">
                {steps[step]}
              </p>
              <PinPad pin={pin} onDigit={onDigit} onDelete={onDelete} error={error} shake={shake} compact />
              {mode === "set" && <div className="mt-3">{bioToggle}</div>}
              {loading && (
                <p className="mt-2 flex items-center justify-center gap-2 text-xs text-ig-gray">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  در حال بررسی...
                </p>
              )}
              <button
                type="button"
                onClick={() => (getLockConfig() ? (setMode("menu"), setStep(0), setVals([]), setError("")) : setOpen(false))}
                disabled={loading}
                className="mt-3 w-full h-11 rounded-lg bg-ig-btn2 text-foreground text-sm font-bold hover:bg-ig-btn2-hover disabled:opacity-40 transition-colors"
              >
                انصراف
              </button>
            </>
          )}

          {mode === "menu" && (
            <>
              <div className="text-center">
                <span className="w-16 h-16 rounded-full bg-ig-gray-bg border border-ig-divider mx-auto flex items-center justify-center">
                  <Lock className="w-8 h-8 text-foreground" strokeWidth={1.8} />
                </span>
                <p className="text-sm text-ig-gray mt-3 leading-6">
                  قفل برنامه فعال است — هر بار که وارد برنامه شوید پین یا بیومتریک لازم است.
                </p>
              </div>
              <div className="mt-5 space-y-3">
                {bioToggle}
                <button
                  type="button"
                  onClick={() => {
                    setMode("change");
                    setStep(0);
                    setVals([]);
                    setError("");
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
                    setStep(0);
                    setVals([]);
                    setError("");
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
            </>
          )}
        </div>
      </BottomSheet>
    </>
  );
}
