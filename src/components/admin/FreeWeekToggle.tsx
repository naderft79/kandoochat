"use client";

// سوییچ قانون «اشتراک یک هفته ای» — با فعال بودن، اعضای دعوت شده یک هفته اشتراک رایگان می گیرند
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Gift } from "lucide-react";

export default function FreeWeekToggle({ initial }: { initial: boolean }) {
  const router = useRouter();
  const [on, setOn] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const errTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (errTimer.current) clearTimeout(errTimer.current);
    };
  }, []);

  function flashError() {
    setSaveError(true);
    if (errTimer.current) clearTimeout(errTimer.current);
    errTimer.current = setTimeout(() => setSaveError(false), 4000);
  }

  async function toggle() {
    if (busy) return;
    const next = !on;
    setOn(next);
    setBusy(true);
    setSaveError(false);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ freeWeekSubscription: next }),
      });
      if (!res.ok) {
        setOn(!next);
        flashError();
        return;
      }
      router.refresh();
    } catch {
      setOn(!next);
      flashError();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="lux-card p-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <Gift className="w-5 h-5 text-[#d4af37] shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-bold text-[#e8e8e8]">اشتراک یک هفته ای</p>
          <p className="text-[10px] text-[#888] leading-4">
            {on
              ? "فعال — اعضایی که با لینک دعوت ثبت نام می کنند یک هفته اشتراک رایگان می گیرند"
              : "غیرفعال — عضویت با لینک دعوت مثل قبل بدون هدیه انجام می شود"}
          </p>
          {saveError && (
            <p className="text-[10px] text-[#f87171] leading-4 mt-0.5" role="alert">
              ذخیره نشد — اتصال را بررسی و دوباره تلاش کنید
            </p>
          )}
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label="اشتراک یک هفته ای"
        disabled={busy}
        onClick={toggle}
        className={`relative shrink-0 w-11 h-6 rounded-full transition-colors disabled:opacity-60 ${on ? "bg-[#d4af37]" : "bg-[#3a3a3a]"}`}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${on ? "right-0.5" : "right-[22px]"}`}
        />
      </button>
    </div>
  );
}
