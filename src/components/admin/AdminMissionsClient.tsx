"use client";

// مدیریت ماموریت ها توسط ادمین — ساخت/ویرایش/فعال/غیرفعال/حذف
import { useState, useEffect, useCallback } from "react";
import { Target, Plus, Edit2, Trash2, Power, X, Loader2, Coins } from "lucide-react";
import { toPersianDigits } from "@/lib/format";
import AlertModal from "@/components/AlertModal";

type Mission = {
  id: string;
  key: string;
  title: string;
  description: string;
  rewardCoins: number;
  target: number;
  icon: string;
  isActive: boolean;
  createdAt: string;
  _count?: { userMissions: number };
};

export default function AdminMissionsClient() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    key: "",
    title: "",
    description: "",
    rewardCoins: "10",
    target: "1",
    icon: "🎯",
  });
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const fetchMissions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/missions");
      const data = await res.json();
      if (data.missions) setMissions(data.missions);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMissions();
  }, [fetchMissions]);

  function resetForm() {
    setForm({ key: "", title: "", description: "", rewardCoins: "10", target: "1", icon: "🎯" });
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(m: Mission) {
    setForm({
      key: m.key,
      title: m.title,
      description: m.description,
      rewardCoins: String(m.rewardCoins),
      target: String(m.target),
      icon: m.icon,
    });
    setEditingId(m.id);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const url = "/api/admin/missions";
      const method = editingId ? "PUT" : "POST";
      const body = editingId ? { id: editingId, ...form } : form;
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        resetForm();
        fetchMissions();
      }
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(m: Mission) {
    const res = await fetch("/api/admin/missions", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: m.id, isActive: !m.isActive }),
    });
    if (res.ok) fetchMissions();
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/admin/missions?id=${id}`, { method: "DELETE" });
    if (res.ok) fetchMissions();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="lux-card p-5">
          <h1 className="text-lg font-black text-[#e8e8e8] flex items-center gap-2">
            <Target className="w-5 h-5 text-[#d4af37]" />
            مدیریت ماموریت ها
          </h1>
          <p className="text-[#888] mt-1 text-xs">
            {toPersianDigits(missions.length)} ماموریت تعریف شده
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl lux-btn-gold text-xs font-bold transition-all"
        >
          <Plus className="w-4 h-4" />
          ماموریت جدید
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="lux-card p-4 space-y-3 animate-fade-in-up">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-[#e8e8e8]">
              {editingId ? "ویرایش ماموریت" : "ماموریت جدید"}
            </h3>
            <button type="button" onClick={resetForm} className="text-[#888] hover:text-[#d4af37]">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-[#888] mb-1 block">کلید (انگلیسی)</label>
              <input
                type="text"
                value={form.key}
                onChange={(e) => setForm({ ...form, key: e.target.value })}
                disabled={!!editingId}
                required
                placeholder="daily_login"
                className="w-full px-3 py-2 rounded-lg border border-[rgba(212,175,55,0.15)] bg-[#0d0d0d] text-[#e8e8e8] text-sm focus:outline-none focus:border-[rgba(212,175,55,0.4)] disabled:opacity-50"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#888] mb-1 block">عنوان</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                placeholder="ورود روزانه"
                className="w-full px-3 py-2 rounded-lg border border-[rgba(212,175,55,0.15)] bg-[#0d0d0d] text-[#e8e8e8] text-sm focus:outline-none focus:border-[rgba(212,175,55,0.4)]"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-[#888] mb-1 block">توضیحات</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
                rows={2}
                placeholder="هر روز وارد شوید و سکه رایگان بگیرید"
                className="w-full px-3 py-2 rounded-lg border border-[rgba(212,175,55,0.15)] bg-[#0d0d0d] text-[#e8e8e8] text-sm focus:outline-none focus:border-[rgba(212,175,55,0.4)]"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#888] mb-1 block">پاداش (سکه)</label>
              <input
                type="number"
                value={form.rewardCoins}
                onChange={(e) => setForm({ ...form, rewardCoins: e.target.value })}
                required
                min="1"
                className="w-full px-3 py-2 rounded-lg border border-[rgba(212,175,55,0.15)] bg-[#0d0d0d] text-[#e8e8e8] text-sm focus:outline-none focus:border-[rgba(212,175,55,0.4)]"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#888] mb-1 block">هدف (تعداد)</label>
              <input
                type="number"
                value={form.target}
                onChange={(e) => setForm({ ...form, target: e.target.value })}
                required
                min="1"
                className="w-full px-3 py-2 rounded-lg border border-[rgba(212,175,55,0.15)] bg-[#0d0d0d] text-[#e8e8e8] text-sm focus:outline-none focus:border-[rgba(212,175,55,0.4)]"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#888] mb-1 block">آیکن (اموجی)</label>
              <input
                type="text"
                value={form.icon}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
                maxLength={4}
                className="w-full px-3 py-2 rounded-lg border border-[rgba(212,175,55,0.15)] bg-[#0d0d0d] text-[#e8e8e8] text-sm focus:outline-none focus:border-[rgba(212,175,55,0.4)]"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={resetForm} className="px-4 py-2 rounded-lg lux-btn-outline text-xs font-bold">
              انصراف
            </button>
            <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg lux-btn-gold text-xs font-bold disabled:opacity-50 inline-flex items-center gap-1.5">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              {editingId ? "ذخیره تغییرات" : "ایجاد ماموریت"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-[#d4af37]" />
        </div>
      ) : missions.length === 0 ? (
        <div className="text-center py-20">
          <Target className="w-12 h-12 text-[rgba(212,175,55,0.2)] mx-auto mb-3" />
          <p className="text-sm text-[#666]">هنوز ماموریتی تعریف نشده است</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {missions.map((m, idx) => (
            <div key={m.id} className={`lux-card p-4 animate-fade-in-up ${m.isActive ? "" : "opacity-60"}`} style={{ animationDelay: `${Math.min(idx * 0.03, 0.3)}s` }}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{m.icon}</span>
                  <div>
                    <p className="text-sm font-bold text-[#e8e8e8]">{m.title}</p>
                    <p className="text-[10px] text-[#888] font-mono">{m.key}</p>
                  </div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${m.isActive ? "bg-[rgba(16,185,129,0.1)] text-[#34d399]" : "bg-[rgba(212,175,55,0.08)] text-[#888]"}`}>
                  {m.isActive ? "فعال" : "غیرفعال"}
                </span>
              </div>
              <p className="text-xs text-[#888] mb-3 line-clamp-2">{m.description}</p>
              <div className="flex items-center gap-3 text-xs mb-3">
                <span className="inline-flex items-center gap-1 text-[#d4af37] font-bold">
                  <Coins className="w-3.5 h-3.5" />
                  {toPersianDigits(m.rewardCoins)} سکه
                </span>
                <span className="text-[#888]">هدف: {toPersianDigits(m.target)}</span>
                {m._count && (
                  <span className="text-[#888]">{toPersianDigits(m._count.userMissions)} انجام</span>
                )}
              </div>
              <div className="flex gap-1.5">
                <button onClick={() => startEdit(m)} className="flex-1 py-1.5 rounded-lg lux-btn-outline text-[10px] font-bold inline-flex items-center justify-center gap-1">
                  <Edit2 className="w-3 h-3" />
                  ویرایش
                </button>
                <button onClick={() => toggleActive(m)} className="py-1.5 px-2 rounded-lg lux-btn-outline text-[10px] font-bold">
                  <Power className="w-3 h-3" />
                </button>
                <button onClick={() => setConfirmDeleteId(m.id)} className="py-1.5 px-2 rounded-lg bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] text-[10px] font-bold text-[#f87171] hover:bg-[rgba(239,68,68,0.15)] transition-all">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* مودال تایید حذف */}
      <AlertModal
        open={confirmDeleteId !== null}
        message="آیا از حذف این ماموریت مطمئن هستید؟"
        variant="error"
        confirmLabel="حذف"
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={() => {
          if (confirmDeleteId) handleDelete(confirmDeleteId);
          setConfirmDeleteId(null);
        }}
      />
    </div>
  );
}
