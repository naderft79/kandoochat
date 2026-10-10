"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, RefreshCw, Plus, Trash2, Edit2, UserPlus, Sparkles, Search } from "lucide-react";
import { toPersianDigits } from "@/lib/format";

interface FakeUser {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  gender: string;
  age: number;
  city: string;
  bio: string;
  isActive: boolean;
  isVerified: boolean;
  job: string | null;
  photos: { id: string; url: string; isProfile: boolean }[];
  createdAt: string;
  stats: { msgSent: number; likesSent: number; giftsSent: number; matches: number };
}

export default function FakeUsersPage() {
  const [users, setUsers] = useState<FakeUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/bot/fake-users?${params}`);
      const data = await res.json();
      setUsers(data.users || []);
      setTotalPages(data.totalPages || 1);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const handleGenerate = async (count: number) => {
    setGenerating(true);
    try {
      await fetch("/api/admin/bot/fake-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate", count }),
      });
      await load();
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/admin/bot/fake-users?id=${id}`, { method: "DELETE" });
      setConfirmDelete(null);
      await load();
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    try {
      await fetch("/api/admin/bot/fake-users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive: !current }),
      });
      await load();
    } catch (err) {
      console.error("Toggle error:", err);
    }
  };

  return (
    <div className="space-y-4">
      {/* هدر */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-sm font-bold text-[#d4af37]">مدیریت کاربران فیک</h3>
        <div className="flex gap-2">
          <button
            onClick={() => handleGenerate(5)}
            disabled={generating}
            className="lux-btn-gold px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5"
          >
            {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            تولید ۵ فیک
          </button>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="lux-card px-3 py-1.5 rounded-xl text-xs font-bold text-[#d4af37] flex items-center gap-1.5 hover:bg-[#d4af37]/10"
          >
            <UserPlus className="w-3.5 h-3.5" />
            افزودن دستی
          </button>
          <button
            onClick={load}
            className="lux-card px-3 py-1.5 rounded-xl text-xs font-bold text-[#888] hover:text-[#d4af37] flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            به‌روزرسانی
          </button>
        </div>
      </div>

      {/* جستجو */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#888]" />
        <input
          type="text"
          placeholder="جستجو با نام، شهر یا username..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="lux-input w-full pr-10 pl-4 py-2 rounded-xl text-xs"
        />
      </div>

      {/* فرم افزودن دستی */}
      {showAdd && <AddFakeForm onDone={() => { setShowAdd(false); load(); }} />}

      {/* لیست فیک‌ها */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-[#d4af37]" />
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-8 text-[#888] text-xs">هیچ کاربر فیک وجود ندارد</div>
      ) : (
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.id} className="lux-card rounded-xl p-3 flex items-center gap-3">
              {/* عکس */}
              <div className="w-10 h-10 rounded-full bg-[#d4af37]/20 flex items-center justify-center text-[#d4af37] text-xs font-bold shrink-0 overflow-hidden">
                {u.photos.find((p) => p.isProfile)?.url ? (
                  <img src={u.photos.find((p) => p.isProfile)?.url} alt={u.firstName} className="w-full h-full object-cover" />
                ) : (
                  u.firstName.charAt(0)
                )}
              </div>

              {/* اطلاعات */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white truncate">{u.firstName} {u.lastName}</span>
                  {u.isVerified && <span className="text-[10px] text-green-400">تایید شده</span>}
                  {!u.isActive && <span className="text-[10px] text-red-400">غیرفعال</span>}
                </div>
                <div className="text-[10px] text-[#888] truncate">
                  {u.gender === "MALE" ? "آقا" : "خانم"} • {toPersianDigits(u.age)} سال • {u.city} • {u.job || "بدون شغل"}
                </div>
                {/* آمار */}
                <div className="flex gap-3 mt-1 text-[10px] text-[#888]">
                  <span>پیام: {toPersianDigits(u.stats.msgSent)}</span>
                  <span>لایک: {toPersianDigits(u.stats.likesSent)}</span>
                  <span>هدیه: {toPersianDigits(u.stats.giftsSent)}</span>
                  <span>مچ: {toPersianDigits(u.stats.matches)}</span>
                </div>
              </div>

              {/* دکمه‌ها */}
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => handleToggleActive(u.id, u.isActive)}
                  className={`p-1.5 rounded-lg text-xs ${u.isActive ? "text-green-400" : "text-red-400"} hover:bg-white/5`}
                  title={u.isActive ? "غیرفعال کردن" : "فعال کردن"}
                >
                  {u.isActive ? "●" : "○"}
                </button>
                {confirmDelete === u.id ? (
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleDelete(u.id)}
                      className="p-1.5 rounded-lg text-xs text-red-400 bg-red-400/10"
                    >
                      بله
                    </button>
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="p-1.5 rounded-lg text-xs text-[#888]"
                    >
                      خیر
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(u.id)}
                    className="p-1.5 rounded-lg text-xs text-red-400 hover:bg-red-400/10"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* صفحه‌بندی */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="lux-card px-3 py-1 rounded-lg text-xs text-[#888] disabled:opacity-30"
          >
            قبلی
          </button>
          <span className="text-xs text-[#888] py-1">{toPersianDigits(page)} / {toPersianDigits(totalPages)}</span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="lux-card px-3 py-1 rounded-lg text-xs text-[#888] disabled:opacity-30"
          >
            بعدی
          </button>
        </div>
      )}
    </div>
  );
}

// فرم افزودن دستی
function AddFakeForm({ onDone }: { onDone: () => void }) {
  const [form, setForm] = useState({
    firstName: "",
    gender: "FEMALE",
    age: "25",
    city: "تهران",
    province: "تهران",
    bio: "",
    job: "",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.firstName) return;
    setSaving(true);
    try {
      await fetch("/api/admin/bot/fake-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, action: "manual" }),
      });
      onDone();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="lux-card rounded-xl p-4 space-y-3">
      <h4 className="text-xs font-bold text-[#d4af37]">افزودن کاربر فیک دستی</h4>
      <div className="grid grid-cols-2 gap-3">
        <input
          placeholder="نام"
          value={form.firstName}
          onChange={(e) => setForm({ ...form, firstName: e.target.value })}
          className="lux-input px-3 py-2 rounded-lg text-xs"
        />
        <select
          value={form.gender}
          onChange={(e) => setForm({ ...form, gender: e.target.value })}
          className="lux-input px-3 py-2 rounded-lg text-xs"
        >
          <option value="FEMALE">خانم</option>
          <option value="MALE">آقا</option>
        </select>
        <input
          placeholder="سن"
          type="number"
          value={form.age}
          onChange={(e) => setForm({ ...form, age: e.target.value })}
          className="lux-input px-3 py-2 rounded-lg text-xs"
        />
        <input
          placeholder="شهر"
          value={form.city}
          onChange={(e) => setForm({ ...form, city: e.target.value, province: e.target.value })}
          className="lux-input px-3 py-2 rounded-lg text-xs"
        />
        <input
          placeholder="شغل (اختیاری)"
          value={form.job}
          onChange={(e) => setForm({ ...form, job: e.target.value })}
          className="lux-input px-3 py-2 rounded-lg text-xs"
        />
        <input
          placeholder="بیوگرافی (اختیاری)"
          value={form.bio}
          onChange={(e) => setForm({ ...form, bio: e.target.value })}
          className="lux-input px-3 py-2 rounded-lg text-xs"
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={saving || !form.firstName}
          className="lux-btn-gold px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
          افزودن
        </button>
        <button
          onClick={onDone}
          className="lux-card px-4 py-2 rounded-lg text-xs text-[#888]"
        >
          انصراف
        </button>
      </div>
    </div>
  );
}
