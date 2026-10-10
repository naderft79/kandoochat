"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2 } from "lucide-react";

const inputClass =
  "w-full px-4 py-3 rounded-lg border border-[rgba(212,175,55,0.15)] bg-[#0d0b14] text-[#e8e8e8] focus:border-[rgba(212,175,55,0.4)] outline-none transition-colors text-left";

type Props = {
  specialRegisterSlug: string;
  otpEnabled: boolean;
  buyCoinsEnabled: boolean;
  withdrawCoinsEnabled: boolean;
};

export default function SecuritySettings(props: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    specialRegisterSlug: props.specialRegisterSlug,
    otpEnabled: props.otpEnabled,
    buyCoinsEnabled: props.buyCoinsEnabled,
    withdrawCoinsEnabled: props.withdrawCoinsEnabled,
  });
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          specialRegisterSlug: form.specialRegisterSlug,
          otpEnabled: form.otpEnabled,
          buyCoinsEnabled: form.buyCoinsEnabled,
          withdrawCoinsEnabled: form.withdrawCoinsEnabled,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setMessage({ ok: false, text: data.error ?? "خطایی رخ داد" }); return; }
      setMessage({ ok: true, text: "تنظیمات ذخیره شد" });
      router.refresh();
    } catch {
      setMessage({ ok: false, text: "خطا در ارتباط با سرور" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="lux-card p-5 space-y-3">
        <div>
          <label className="block text-xs font-bold text-[#888] mb-1.5">کلمه لینک ثبت نام ویژه (انگلیسی)</label>
          <input type="text" dir="ltr" value={form.specialRegisterSlug} onChange={(e) => setForm((f) => ({ ...f, specialRegisterSlug: e.target.value }))} className={inputClass} placeholder="special" />
          <p className="text-[10px] text-[#888] mt-1">لینک ثبت نام ویژه: /register/{form.specialRegisterSlug || "special"}</p>
        </div>
        <label className="flex items-center justify-between bg-[rgba(212,175,55,0.04)] border border-[rgba(212,175,55,0.1)] rounded-lg px-4 py-3 cursor-pointer">
          <span className="text-sm text-[#e8e8e8] font-medium">تایید موبایل با OTP فعال باشد</span>
          <input type="checkbox" checked={form.otpEnabled} onChange={(e) => setForm((f) => ({ ...f, otpEnabled: e.target.checked }))} className="w-5 h-5 accent-[#d4af37]" />
        </label>
        <label className="flex items-center justify-between bg-[rgba(212,175,55,0.04)] border border-[rgba(212,175,55,0.1)] rounded-lg px-4 py-3 cursor-pointer">
          <span className="text-sm text-[#e8e8e8] font-medium">خرید سکه فعال باشد</span>
          <input type="checkbox" checked={form.buyCoinsEnabled} onChange={(e) => setForm((f) => ({ ...f, buyCoinsEnabled: e.target.checked }))} className="w-5 h-5 accent-[#d4af37]" />
        </label>
        <label className="flex items-center justify-between bg-[rgba(212,175,55,0.04)] border border-[rgba(212,175,55,0.1)] rounded-lg px-4 py-3 cursor-pointer">
          <span className="text-sm text-[#e8e8e8] font-medium">برداشت سکه فعال باشد</span>
          <input type="checkbox" checked={form.withdrawCoinsEnabled} onChange={(e) => setForm((f) => ({ ...f, withdrawCoinsEnabled: e.target.checked }))} className="w-5 h-5 accent-[#d4af37]" />
        </label>
      </div>

      {message && (
        <p className={`text-sm rounded-lg px-4 py-3 ${message.ok ? "bg-[rgba(16,185,129,0.1)] text-[#34d399] border border-[rgba(16,185,129,0.2)]" : "bg-[rgba(239,68,68,0.1)] text-[#f87171] border border-[rgba(239,68,68,0.2)]"}`}>
          {message.text}
        </p>
      )}

      <button type="submit" disabled={loading} className="px-6 py-2.5 rounded-lg lux-btn-gold font-bold transition-all disabled:opacity-50 flex items-center gap-2">
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
        {loading ? "در حال ذخیره..." : "ذخیره"}
      </button>
    </form>
  );
}
