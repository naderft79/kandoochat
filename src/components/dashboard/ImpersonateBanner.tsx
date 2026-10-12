"use client";

// بنر بازگشت به پنل مدیریت — وقتی ادمین وارد حساب کاربر شده است
import { useState } from "react";
import { ArrowRight, Loader2, ShieldAlert } from "lucide-react";

export default function ImpersonateBanner() {
  const [restoring, setRestoring] = useState(false);

  async function restore() {
    setRestoring(true);
    try {
      const res = await fetch("/api/admin/restore", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        window.location.href = data.redirect;
      }
    } finally {
      setRestoring(false);
    }
  }

  return (
    <div className="bg-ig-blue text-white px-4 py-2 flex items-center justify-between gap-3 shrink-0">
      <div className="flex items-center gap-2">
        <ShieldAlert className="w-4 h-4 shrink-0" />
        <span className="text-xs font-bold">شما به عنوان کاربر وارد شده اید — دسترسی موقت مدیر</span>
      </div>
      <button
        onClick={restore}
        disabled={restoring}
        className="flex items-center gap-1.5 bg-surface text-ig-blue px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-surface/90 transition-colors disabled:opacity-50"
      >
        {restoring ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
        بازگشت به پنل مدیریت
      </button>
    </div>
  );
}
