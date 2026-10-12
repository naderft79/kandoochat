"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Ban, Loader2, RefreshCw, Plus, Trash2, CheckCircle, Search } from "lucide-react";
import { toPersianDigits } from "@/lib/format";
import { useToast } from "@/components/ToastProvider";
import UserLink from "@/components/admin/user-modal/UserLink";

type ListItem = {
  id: string;
  userId: string;
  reason: string | null;
  addedBy: string;
  createdAt: string;
};

const inputClass = "w-full px-3 py-2 rounded-lg bg-[#0d0d0d] border border-[rgba(212,175,55,0.15)] text-[#e8e8e8] text-sm focus:outline-none focus:border-[rgba(212,175,55,0.4)]";
const labelClass = "text-[10px] text-[#888] mb-1 block";

export default function BlacklistPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"blacklist" | "whitelist">("blacklist");
  const [showAdd, setShowAdd] = useState(false);
  const [newUserId, setNewUserId] = useState("");
  const [newReason, setNewReason] = useState("");
  const [useWhitelist, setUseWhitelist] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{ id: string; firstName: string; username: string; phone: string; city: string; gender: string; age: number; photos: { url: string }[] }>>([]);
  const [searching, setSearching] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/bot/blacklist?type=${mode}`);
      const data = await res.json();
      if (res.ok) setItems(data.items);
    } catch { /* */ } finally { setLoading(false); }
  }, [mode]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  async function searchUsers(query: string) {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/admin/bot/blacklist?search=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (res.ok && data.searchResults) {
        setSearchResults(data.searchResults);
      }
    } catch { /* */ } finally { setSearching(false); }
  }

  async function addItem() {
    if (!newUserId.trim()) {
      toast("شناسه کاربر الزامی است", "error");
      return;
    }
    try {
      const res = await fetch("/api/admin/bot/blacklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: newUserId, reason: newReason, type: mode }),
      });
      const data = await res.json();
      if (res.ok) {
        toast("اضافه شد", "success");
        setNewUserId("");
        setNewReason("");
        setShowAdd(false);
        fetchItems();
      } else {
        toast(data.error ?? "خطا", "error");
      }
    } catch { toast("خطا در ارتباط", "error"); }
  }

  async function deleteItem(id: string) {
    try {
      const res = await fetch(`/api/admin/bot/blacklist?id=${id}&type=${mode}`, { method: "DELETE" });
      if (res.ok) {
        toast("حذف شد", "success");
        fetchItems();
      }
    } catch { toast("خطا", "error"); }
  }

  async function toggleWhitelist() {
    const newVal = !useWhitelist;
    setUseWhitelist(newVal);
    try {
      await fetch("/api/admin/bot/blacklist", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ useWhitelist: newVal }),
      });
      toast(newVal ? "لیست سفید فعال شد" : "لیست سفید غیرفعال شد", "success");
    } catch { toast("خطا", "error"); }
  }

  return (
    <div className="space-y-4">
      {/* هدر */}
      <div className="lux-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-black text-[#e8e8e8] flex items-center gap-2">
              <Ban className="w-5 h-5 text-[#d4af37]" />
              لیست سیاه / سفید
            </h1>
            <p className="text-[#888] mt-1 text-xs">مدیریت کاربران مستثنی از ربات</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => fetchItems()} className="px-3 py-2 rounded-xl lux-card text-xs font-bold text-[#888] hover:text-[#d4af37] flex items-center gap-1.5 transition-all">
              <RefreshCw className="w-4 h-4" />
            </button>
            <button onClick={() => setShowAdd(!showAdd)} className="px-3 py-2 rounded-xl lux-btn-gold text-xs font-bold flex items-center gap-1.5 transition-all">
              <Plus className="w-4 h-4" />
              افزودن
            </button>
          </div>
        </div>

        {/* انتخاب حالت */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setMode("blacklist")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${mode === "blacklist" ? "lux-btn-gold" : "lux-card text-[#888]"}`}
          >
            لیست سیاه ({toPersianDigits(items.length)})
          </button>
          <button
            onClick={() => setMode("whitelist")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${mode === "whitelist" ? "lux-btn-gold" : "lux-card text-[#888]"}`}
          >
            لیست سفید
          </button>
        </div>

        {/* فعال‌سازی لیست سفید */}
        {mode === "whitelist" && (
          <div className="flex items-center justify-between mt-3 p-3 rounded-lg bg-[#0d0d0d] border border-[rgba(212,175,55,0.1)]">
            <span className="text-xs text-[#e8e8e8]">فعال سازی لیست سفید (ربات فقط به این کاربران پیام می‌دهد)</span>
            <button
              onClick={toggleWhitelist}
              className={`relative w-12 h-6 rounded-full transition-colors ${useWhitelist ? "bg-[#d4af37]" : "bg-[#333]"}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${useWhitelist ? "left-0.5" : "right-0.5"}`} />
            </button>
          </div>
        )}
      </div>

      {/* فرم افزودن */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="lux-card p-5 space-y-3">
              <h2 className="text-sm font-black text-[#d4af37]">افزودن به {mode === "blacklist" ? "لیست سیاه" : "لیست سفید"}</h2>
              {/* جستجوی کاربر */}
              <div className="relative">
                <label className={labelClass}>جستجوی کاربر (نام، username یا phone)</label>
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#888]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      searchUsers(e.target.value);
                    }}
                    placeholder="جستجو..."
                    className={inputClass + " pr-10"}
                  />
                  {searching && <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#d4af37] animate-spin" />}
                </div>
                {/* نتایج جستجو */}
                {searchResults.length > 0 && (
                  <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                    {searchResults.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => {
                          setNewUserId(u.id);
                          setSearchQuery(`${u.firstName} (${u.username})`);
                          setSearchResults([]);
                        }}
                        className="w-full text-right p-2 rounded-lg bg-[#0d0d0d] border border-[rgba(212,175,55,0.1)] hover:border-[rgba(212,175,55,0.3)] transition-all flex items-center gap-2"
                      >
                        <div className="w-8 h-8 rounded-full bg-[#d4af37]/20 overflow-hidden shrink-0">
                          {u.photos[0]?.url ? <img src={u.photos[0].url} alt={u.firstName} className="w-full h-full object-cover" /> : null}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-[#e8e8e8] truncate"><UserLink userId={u.id}>{u.firstName}</UserLink></p>
                          <p className="text-[10px] text-[#888] truncate">{u.username} • {u.city} • {u.gender === "MALE" ? "آقا" : "خانم"} • {toPersianDigits(u.age)} سال</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className={labelClass}>شناسه کاربر انتخاب شده</label>
                <input type="text" value={newUserId} onChange={(e) => setNewUserId(e.target.value)} placeholder="User ID" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>دلیل (اختیاری)</label>
                <input type="text" value={newReason} onChange={(e) => setNewReason(e.target.value)} placeholder="دلیل استثنا" className={inputClass} />
              </div>
              <button onClick={addItem} className="px-4 py-2 rounded-xl lux-btn-gold text-xs font-bold flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4" />
                تایید
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* لیست */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#d4af37] animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="lux-card p-10 text-center text-[#666] text-sm">موردی وجود ندارد</div>
      ) : (
        <div className="space-y-2">
          {items.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.02 }}
              className="lux-card p-3 flex items-center justify-between"
            >
              <div>
                <p className="text-xs font-bold text-[#e8e8e8]">{item.userId.substring(0, 16)}...</p>
                <p className="text-[10px] text-[#888]">
                  {item.reason && <span>{item.reason} • </span>}
                  {item.addedBy} • {new Date(item.createdAt).toLocaleString("fa-IR")}
                </p>
              </div>
              <button
                onClick={() => deleteItem(item.id)}
                className="p-2 rounded-lg text-[#ef4444] hover:bg-[rgba(239,68,68,0.1)] transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
