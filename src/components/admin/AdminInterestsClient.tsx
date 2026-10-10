"use client";

// مدیریت علایق توسط ادمین — افزودن/ویرایش/حذف
import { useState, useEffect, useCallback } from "react";
import { Heart, Plus, Edit2, Trash2, X, Loader2, Users } from "lucide-react";
import { toPersianDigits } from "@/lib/format";
import AlertModal from "@/components/AlertModal";

type Interest = {
  id: string;
  name: string;
  icon: string;
  _count?: { users: number };
};

export default function AdminInterestsClient() {
  const [interests, setInterests] = useState<Interest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", icon: "❤️" });
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const fetchInterests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/interests");
      const data = await res.json();
      if (data.interests) setInterests(data.interests);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInterests();
  }, [fetchInterests]);

  function resetForm() {
    setForm({ name: "", icon: "❤️" });
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(i: Interest) {
    setForm({ name: i.name, icon: i.icon });
    setEditingId(i.id);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const method = editingId ? "PUT" : "POST";
      const body = editingId ? { id: editingId, ...form } : form;
      const res = await fetch("/api/admin/interests", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        resetForm();
        fetchInterests();
      } else {
        const data = await res.json();
        setAlertMsg(data.error || "خطا در ذخیره");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/admin/interests?id=${id}`, { method: "DELETE" });
    if (res.ok) fetchInterests();
    else setAlertMsg("خطا در حذف علاقه");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="lux-card p-5">
          <h1 className="text-lg font-black text-[#e8e8e8] flex items-center gap-2">
            <Heart className="w-5 h-5 text-[#d4af37]" />
            مدیریت علایق
          </h1>
          <p className="text-[#888] mt-1 text-xs">
            {toPersianDigits(interests.length)} علاقه تعریف شده
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl lux-btn-gold text-xs font-bold transition-all"
        >
          <Plus className="w-4 h-4" />
          علاقه جدید
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="lux-card p-4 space-y-3 animate-fade-in-up">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-[#e8e8e8]">
              {editingId ? "ویرایش علاقه" : "علاقه جدید"}
            </h3>
            <button type="button" onClick={resetForm} className="text-[#888] hover:text-[#d4af37]">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-[#888] mb-1 block">نام علاقه</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                placeholder="موسیقی"
                className="w-full px-3 py-2 rounded-lg border border-[rgba(212,175,55,0.15)] bg-[#0d0d0d] text-[#e8e8e8] text-sm focus:outline-none focus:border-[rgba(212,175,55,0.4)]"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#888] mb-1 block">آیکن (اموجی)</label>
              <input
                type="text"
                value={form.icon}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
                required
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
              {editingId ? "ذخیره" : "افزودن"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-[#d4af37]" />
        </div>
      ) : interests.length === 0 ? (
        <div className="text-center py-20">
          <Heart className="w-12 h-12 text-[rgba(212,175,55,0.2)] mx-auto mb-3" />
          <p className="text-sm text-[#666]">هنوز علاقه ای تعریف نشده است</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {interests.map((i, idx) => (
            <div key={i.id} className="lux-card p-3 flex items-center justify-between animate-fade-in-up" style={{ animationDelay: `${Math.min(idx * 0.03, 0.3)}s` }}>
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xl shrink-0">{i.icon}</span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#e8e8e8] truncate">{i.name}</p>
                  {i._count && (
                    <p className="text-[10px] text-[#888] inline-flex items-center gap-0.5">
                      <Users className="w-2.5 h-2.5" />
                      {toPersianDigits(i._count.users)}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => startEdit(i)} className="p-1.5 rounded-lg hover:bg-[rgba(212,175,55,0.08)] text-[#888] hover:text-[#d4af37]">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setConfirmDeleteId(i.id)} className="p-1.5 rounded-lg hover:bg-[rgba(239,68,68,0.08)] text-[#888] hover:text-[#f87171]">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* مودال هشدار عمومی */}
      <AlertModal
        open={alertMsg !== null}
        message={alertMsg ?? ""}
        variant="error"
        onClose={() => setAlertMsg(null)}
      />

      {/* مودال تایید حذف */}
      <AlertModal
        open={confirmDeleteId !== null}
        message="آیا از حذف این علاقه مطمئن هستید؟"
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
