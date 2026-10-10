"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2 } from "lucide-react";

const inputClass =
  "w-full px-4 py-3 rounded-lg border border-[rgba(212,175,55,0.15)] bg-[#0d0b14] text-[#e8e8e8] focus:border-[rgba(212,175,55,0.4)] outline-none transition-colors text-left";

const textareaClass =
  "w-full px-4 py-3 rounded-lg border border-[rgba(212,175,55,0.15)] bg-[#0d0b14] text-[#e8e8e8] focus:border-[rgba(212,175,55,0.4)] outline-none transition-colors text-right";

export { inputClass, textareaClass };

export function useSettingsSave() {
  const router = useRouter();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const save = useCallback(async (data: Record<string, unknown>) => {
    setMessage(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) { setMessage({ ok: false, text: json.error ?? "خطایی رخ داد" }); return; }
      setMessage({ ok: true, text: "تنظیمات ذخیره شد" });
      router.refresh();
    } catch {
      setMessage({ ok: false, text: "خطا در ارتباط با سرور" });
    } finally {
      setLoading(false);
    }
  }, [router]);

  return { save, message, loading };
}

export function SaveButton({ loading }: { loading: boolean }) {
  return (
    <button type="submit" disabled={loading} className="px-6 py-2.5 rounded-lg lux-btn-gold font-bold transition-all disabled:opacity-50 flex items-center gap-2">
      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
      {loading ? "در حال ذخیره..." : "ذخیره"}
    </button>
  );
}

export function MessageBanner({ message }: { message: { ok: boolean; text: string } | null }) {
  if (!message) return null;
  return (
    <p className={`text-sm rounded-lg px-4 py-3 ${message.ok ? "bg-[rgba(16,185,129,0.1)] text-[#34d399] border border-[rgba(16,185,129,0.2)]" : "bg-[rgba(239,68,68,0.1)] text-[#f87171] border border-[rgba(239,68,68,0.2)]"}`}>
      {message.text}
    </p>
  );
}

export function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between bg-[rgba(212,175,55,0.04)] border border-[rgba(212,175,55,0.1)] rounded-lg px-4 py-3 cursor-pointer">
      <span className="text-sm text-[#e8e8e8] font-medium">{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="w-5 h-5 accent-[#d4af37]" />
    </label>
  );
}

export function NumberField({ label, value, onChange, hint }: { label: string; value: string; onChange: (v: string) => void; hint?: string }) {
  return (
    <div>
      <label className="block text-xs font-bold text-[#888] mb-1.5">{label}</label>
      <input type="number" dir="ltr" value={value} onChange={(e) => onChange(e.target.value)} className={inputClass} />
      {hint && <p className="text-[10px] text-[#888] mt-1">{hint}</p>}
    </div>
  );
}

export function TextField({ label, value, onChange, hint, placeholder }: { label: string; value: string; onChange: (v: string) => void; hint?: string; placeholder?: string }) {
  return (
    <div>
      <label className="block text-xs font-bold text-[#888] mb-1.5">{label}</label>
      <input type="text" dir="ltr" value={value} onChange={(e) => onChange(e.target.value)} className={inputClass} placeholder={placeholder} />
      {hint && <p className="text-[10px] text-[#888] mt-1">{hint}</p>}
    </div>
  );
}

export function TextAreaField({ label, value, onChange, hint }: { label: string; value: string; onChange: (v: string) => void; hint?: string }) {
  return (
    <div>
      <label className="block text-xs font-bold text-[#888] mb-1.5">{label}</label>
      <textarea dir="rtl" value={value} onChange={(e) => onChange(e.target.value)} className={textareaClass} rows={3} />
      {hint && <p className="text-[10px] text-[#888] mt-1">{hint}</p>}
    </div>
  );
}

export function SettingsCard({ children }: { children: React.ReactNode }) {
  return <div className="lux-card p-5">{children}</div>;
}
