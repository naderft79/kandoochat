"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2, AlertTriangle } from "lucide-react";

const inputClass =
  "w-full px-4 py-3 rounded-lg border border-[rgba(212,175,55,0.15)] bg-[#0d0b14] text-[#e8e8e8] focus:border-[rgba(212,175,55,0.4)] outline-none transition-colors text-left";

type Props = {
  maintenanceMode: boolean;
  maintenanceMessage: string;
};

export default function MaintenanceSettings(props: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    maintenanceMode: props.maintenanceMode,
    maintenanceMessage: props.maintenanceMessage,
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
          maintenanceMode: form.maintenanceMode,
          maintenanceMessage: form.maintenanceMessage,
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
      <div className="lux-card p-5">
        <label className="flex items-center justify-between bg-[rgba(239,68,68,0.06)] border border-[rgba(239,68,68,0.15)] rounded-lg px-4 py-3 cursor-pointer mb-3">
          <span className="text-sm text-[#e8e8e8] font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#f87171]" />
            فعال سازی حالت تعمیر (کل سایت بسته می شود)
          </span>
          <input type="checkbox" checked={form.maintenanceMode} onChange={(e) => setForm((f) => ({ ...f, maintenanceMode: e.target.checked }))} className="w-5 h-5 accent-[#f87171]" />
        </label>
        <div>
          <label className="block text-xs font-bold text-[#888] mb-1.5">پیام نمایش داده شده به کاربران</label>
          <textarea
            dir="rtl"
            value={form.maintenanceMessage}
            onChange={(e) => setForm((f) => ({ ...f, maintenanceMessage: e.target.value }))}
            className={`${inputClass} text-right`}
            rows={3}
          />
        </div>
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
