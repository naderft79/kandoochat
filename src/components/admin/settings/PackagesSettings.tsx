"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2, Plus, Trash2 } from "lucide-react";

const inputClass =
  "w-full px-4 py-3 rounded-lg border border-[rgba(212,175,55,0.15)] bg-[#0d0b14] text-[#e8e8e8] focus:border-[rgba(212,175,55,0.4)] outline-none transition-colors text-left";

type CoinPackage = { coins: number; price: number; label: string };

type Props = {
  coinPackages: string;
};

export default function PackagesSettings(props: Props) {
  const router = useRouter();
  const [packages, setPackages] = useState<CoinPackage[]>(() => {
    try { return JSON.parse(props.coinPackages) as CoinPackage[]; } catch { return []; }
  });
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  function addPackage() {
    setPackages((prev) => [...prev, { coins: 100, price: 1000000, label: `بسته ${prev.length + 1}` }]);
  }

  function updatePackage(index: number, field: keyof CoinPackage, value: string | number) {
    setPackages((prev) => prev.map((p, i) => i === index ? { ...p, [field]: value } : p));
  }

  function removePackage(index: number) {
    setPackages((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coinPackages: JSON.stringify(packages) }),
      });
      const data = await res.json();
      if (!res.ok) { setMessage({ ok: false, text: data.error ?? "خطایی رخ داد" }); return; }
      setMessage({ ok: true, text: "بسته ها ذخیره شدند" });
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
        <div className="space-y-2">
          {packages.map((pkg, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input
                type="number"
                dir="ltr"
                value={pkg.coins}
                onChange={(e) => updatePackage(i, "coins", parseInt(e.target.value) || 0)}
                className={`${inputClass} flex-1`}
                placeholder="تعداد سکه"
              />
              <input
                type="number"
                dir="ltr"
                value={pkg.price}
                onChange={(e) => updatePackage(i, "price", parseInt(e.target.value) || 0)}
                className={`${inputClass} flex-1`}
                placeholder="قیمت (تومان)"
              />
              <input
                type="text"
                value={pkg.label}
                onChange={(e) => updatePackage(i, "label", e.target.value)}
                className={`${inputClass} flex-1`}
                placeholder="برچسب"
              />
              <button type="button" onClick={() => removePackage(i)} className="shrink-0 w-10 h-10 rounded-lg bg-[rgba(239,68,68,0.1)] text-[#f87171] border border-[rgba(239,68,68,0.2)] flex items-center justify-center hover:bg-[rgba(239,68,68,0.15)] transition-all">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {packages.length === 0 && (
            <p className="text-center text-[#666] py-8 text-sm">هیچ بسته ای تعریف نشده است</p>
          )}
        </div>
        <button type="button" onClick={addPackage} className="mt-3 flex items-center gap-1.5 px-3 py-2 rounded-lg lux-btn-outline text-xs font-bold">
          <Plus className="w-4 h-4" />
          افزودن بسته جدید
        </button>
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
