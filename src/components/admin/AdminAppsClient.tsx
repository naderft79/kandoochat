"use client";

// مدیریت اپ ها — تب هر برند و تنظیمات جداگانه اش (override روی تنظیمات سراسری)
import { useCallback, useEffect, useMemo, useState } from "react";
import { Smartphone, Loader2, Save, RotateCcw, Check } from "lucide-react";

type BrandTab = { id: string; name: string; color: string };

type Row = {
  key: string;
  field: string;
  label: string;
  type: "bool" | "number" | "text";
  group: string;
  global: unknown;
  override: string | null;
  value: unknown;
  customized: boolean;
};

const inputClass =
  "w-full px-4 py-2.5 rounded-lg border border-[rgba(212,175,55,0.15)] bg-[#0d0b14] text-[#e8e8e8] focus:border-[rgba(212,175,55,0.4)] outline-none transition-colors text-left";

export default function AdminAppsClient({ brands }: { brands: BrandTab[] }) {
  const [active, setActive] = useState(brands[0]?.id ?? "kandoo");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async (brand: string) => {
    setLoading(true);
    setEdits({});
    try {
      const res = await fetch(`/api/admin/app-settings?brand=${encodeURIComponent(brand)}`);
      const data = await res.json();
      setRows(res.ok ? data.rows : []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(active);
  }, [active, load]);

  const groups = useMemo(() => {
    const out: { name: string; rows: Row[] }[] = [];
    for (const r of rows ?? []) {
      const g = out.find((x) => x.name === r.group);
      if (g) g.rows.push(r);
      else out.push({ name: r.group, rows: [r] });
    }
    return out;
  }, [rows]);

  async function save(key: string, value: string | null) {
    setSaving(key);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/app-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand: active, key, value }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ ok: false, text: data.error ?? "خطایی رخ داد" });
        return;
      }
      setMessage({ ok: true, text: "ذخیره شد" });
      setEdits((e) => {
        const n = { ...e };
        delete n[key];
        return n;
      });
      await load(active);
    } catch {
      setMessage({ ok: false, text: "خطا در ارتباط با سرور" });
    } finally {
      setSaving(null);
    }
  }

  const activeBrand = brands.find((b) => b.id === active);

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Smartphone className="w-6 h-6 text-[#d4af37]" />
        <h1 className="text-xl md:text-2xl font-bold text-[#e8e8e8]">مدیریت اپ ها</h1>
      </div>
      <p className="text-sm text-[#888]">
        تنظیمات هر اپ به صورت جداگانه — مقدار سفارشی هر اپ جایگزین تنظیم سراسری می شود و در اپ اندرویدی، PWA و نسخه سایت همان برند اعمال می گردد.
      </p>

      {/* تب های برند */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {brands.map((b) => (
          <button
            key={b.id}
            onClick={() => setActive(b.id)}
            className={`shrink-0 px-5 py-2.5 rounded-xl border text-sm font-bold transition-all ${
              active === b.id
                ? "text-[#0d0b14]"
                : "border-[rgba(212,175,55,0.15)] text-[#aaa] hover:text-[#e8e8e8] bg-[#0d0b14]"
            }`}
            style={active === b.id ? { background: b.color, borderColor: b.color } : undefined}
          >
            {b.name}
          </button>
        ))}
      </div>

      {message && (
        <p className={`text-sm rounded-lg px-4 py-3 ${message.ok ? "bg-[rgba(16,185,129,0.1)] text-[#34d399] border border-[rgba(16,185,129,0.2)]" : "bg-[rgba(239,68,68,0.1)] text-[#f87171] border border-[rgba(239,68,68,0.2)]"}`}>
          {message.text}
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-[#d4af37]" />
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((g) => (
            <div key={g.name} className="lux-card p-5">
              <h2 className="text-sm font-bold text-[#d4af37] mb-4">
                {g.name} <span className="text-[#666] font-normal">— {activeBrand?.name}</span>
              </h2>
              <div className="space-y-3">
                {g.rows.map((r) => (
                  <SettingRow
                    key={r.key}
                    row={r}
                    edit={edits[r.key]}
                    saving={saving === r.key}
                    onEdit={(v) => setEdits((e) => ({ ...e, [r.key]: v }))}
                    onSave={(v) => save(r.key, v)}
                    onReset={() => save(r.key, null)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function displayVal(v: unknown, type: Row["type"]): string {
  if (type === "bool") return v === true || v === "true" ? "فعال" : "غیرفعال";
  return String(v ?? "—");
}

function SettingRow({
  row,
  edit,
  saving,
  onEdit,
  onSave,
  onReset,
}: {
  row: Row;
  edit: string | undefined;
  saving: boolean;
  onEdit: (v: string) => void;
  onSave: (v: string | null) => void;
  onReset: () => void;
}) {
  const dirty = edit !== undefined;
  const boolVal = row.value === true || row.value === "true";

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 rounded-lg border border-[rgba(212,175,55,0.1)] bg-[#0d0b14]/60 px-4 py-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm text-[#e8e8e8]">{row.label}</span>
          {row.customized && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[rgba(212,175,55,0.15)] text-[#d4af37]">سفارشی</span>
          )}
        </div>
        <span className="text-[11px] text-[#666]">سراسری: {displayVal(row.global, row.type)}</span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {row.type === "bool" ? (
          <button
            disabled={saving}
            onClick={() => onSave(boolVal ? "false" : "true")}
            className={`w-12 h-6 rounded-full transition-colors relative ${boolVal ? "bg-[#10b981]" : "bg-[#333]"}`}
            aria-label={row.label}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${boolVal ? "right-0.5" : "right-[26px]"}`}
            />
          </button>
        ) : row.type === "number" ? (
          <input
            type="number"
            dir="ltr"
            min={0}
            value={dirty ? edit : String(row.value ?? "")}
            onChange={(e) => onEdit(e.target.value)}
            className={`${inputClass} !w-28 !py-1.5 text-center`}
          />
        ) : (
          <input
            type="text"
            dir="rtl"
            value={dirty ? edit : String(row.value ?? "")}
            onChange={(e) => onEdit(e.target.value)}
            className={`${inputClass} !w-52 !py-1.5 text-right`}
          />
        )}

        {dirty && (
          <button
            disabled={saving}
            onClick={() => onSave(edit)}
            className="px-3 py-1.5 rounded-lg lux-btn-gold text-xs font-bold flex items-center gap-1 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            ذخیره
          </button>
        )}
        {saving && !dirty && <Loader2 className="w-4 h-4 animate-spin text-[#d4af37]" />}
        {row.customized && (
          <button
            disabled={saving}
            onClick={onReset}
            title="بازگشت به مقدار سراسری"
            className="p-1.5 rounded-lg border border-[rgba(212,175,55,0.2)] text-[#888] hover:text-[#d4af37] transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}
        {!dirty && !row.customized && <Check className="w-4 h-4 text-[#333]" />}
      </div>
    </div>
  );
}
