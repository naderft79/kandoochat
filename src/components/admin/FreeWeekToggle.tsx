"use client";

// سوییچ قانون «اشتراک یک هفته ای» — با فعال بودن، اعضای دعوت شده یک هفته اشتراک رایگان می گیرند
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Gift } from "lucide-react";

export default function FreeWeekToggle({ initial }: { initial: boolean }) {
  const router = useRouter();
  const [on, setOn] = useState(initial);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (busy) return;
    const next = !on;
    setOn(next);
    setBusy(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ freeWeekSubscription: next }),
      });
      if (!res.ok) {
        setOn(!next);
        return;
      }
      router.refresh();
    } catch {
      setOn(!next);
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
