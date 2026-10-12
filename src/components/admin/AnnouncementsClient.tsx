"use client";

// فرم ساخت و مدیریت اطلاعیه های سراسری
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Megaphone, Loader2, Trash2, AlertTriangle, Info, Sparkles } from "lucide-react";
import { formatDateTime, toPersianDigits } from "@/lib/format";

type Item = {
  id: string;
  title: string;
  body: string;
  type: string;
  isActive: boolean;
  startsAt: string;
  endsAt: string | null;
  createdAt: string;
  live: boolean;
};

const inputCls =
  "w-full px-4 py-3 rounded-lg border border-[rgba(212,175,55,0.15)] bg-[#0d0b14] text-[#e8e8e8] focus:border-[rgba(212,175,55,0.4)] outline-none transition-colors";

const TYPE_META: Record<string, { label: string; icon: typeof Info; cls: string }> = {
  INFO: { label: "اطلاع رسانی", icon: Info, cls: "text-sky-400 bg-sky-500/10" },
  WARNING: { label: "هشدار", icon: AlertTriangle, cls: "text-amber-400 bg-amber-500/10" },
  PROMO: { label: "تبلیغ", icon: Sparkles, cls: "text-pink-400 bg-pink-500/10" },
};

export default function AnnouncementsClient({ items: initial }: { items: Item[] }) {
  const router = useRouter();
  const [items] = useState(initial);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState("INFO");
  const [endsAt, setEndsAt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          body,
          type,
          endsAt: endsAt ? new Date(endsAt).toISOString() : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "خطا");
        return;
      }
      setTitle("");
      setBody("");
      setEndsAt("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function toggle(id: string, isActive: boolean) {
    await fetch("/api/admin/announcements", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isActive: !isActive }),
    });
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm("این اطلاعیه برای همیشه حذف شود؟")) return;
    await fetch(`/api/admin/announcements?id=${id}`, { method: "DELETE" });
    router.refresh();
  }

  // وضعیت نمایش زنده روی سرور محاسبه و در فیلد live می آید

  return (
    <>
      {/* فرم ساخت */}
      <form onSubmit={create} className="lux-card p-5 space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-xs font-bold text-[#888] mb-1.5">عنوان</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              required
              className={inputCls}
              placeholder="مثلا: نگهداری سرور"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#888] mb-1.5">نوع</label>
              <select value={type} onChange={(e) => setType(e.target.value)} className={inputCls}>
                <option value="INFO">اطلاع رسانی</option>
                <option value="WARNING">هشدار</option>
                <option value="PROMO">تبلیغ</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#888] mb-1.5">پایان (اختیاری)</label>
              <input
                type="datetime-local"
                dir="ltr"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-[#888] mb-1.5">متن اطلاعیه</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={500}
            required
            rows={3}
            className={inputCls}
            placeholder="متنی که در بنر بالای پنل کاربر دیده می شود"
          />
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#d4af37] text-[#0d0b14] font-bold text-sm hover:bg-[#e5c04a] transition-colors disabled:opacity-50"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Megaphone className="w-4 h-4" />}
          انتشار اطلاعیه
        </button>
      </form>

      {/* لیست */}
      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="lux-card p-8 text-center text-[#888] text-sm">اطلاعیه ای ثبت نشده است</div>
        ) : (
          items.map((a) => {
            const meta = TYPE_META[a.type] ?? TYPE_META.INFO;
            const Icon = meta.icon;
            const live = a.live;
            return (
              <div key={a.id} className="lux-card p-4 flex items-start gap-4">
                <span className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${meta.cls}`}>
                  <Icon className="w-4 h-4" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-[#e8e8e8]">{a.title}</p>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        live ? "bg-green-500/10 text-green-400" : "bg-white/5 text-[#888]"
                      }`}
                    >
                      {live ? "فعال و نمایش داده می شود" : a.isActive ? "زمان بندی شده / منقضی" : "غیرفعال"}
                    </span>
                  </div>
                  <p className="text-sm text-[#bbb] mt-1 whitespace-pre-wrap">{a.body}</p>
                  <p className="text-xs text-[#888] mt-2">
                    {formatDateTime(a.createdAt)}
                    {a.endsAt && ` · پایان: ${formatDateTime(a.endsAt)}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggle(a.id, a.isActive)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      a.isActive
                        ? "bg-white/5 text-[#bbb] hover:bg-white/10"
                        : "bg-[#d4af37]/15 text-[#d4af37] hover:bg-[#d4af37]/25"
                    }`}
                  >
                    {a.isActive ? "غیرفعال" : "فعال"}
                  </button>
                  <button
                    onClick={() => remove(a.id)}
                    className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                    aria-label="حذف"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
      <p className="text-xs text-[#666]">
        {toPersianDigits(items.length)} اطلاعیه ثبت شده — همزمان فقط اطلاعیه های فعال و در بازه زمانی به کاربر نمایش داده می شوند
      </p>
    </>
  );
}
