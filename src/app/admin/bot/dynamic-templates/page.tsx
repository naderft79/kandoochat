"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Loader2, RefreshCw, Plus, Trash2, Edit, Save, X, Eye, Download, Upload } from "lucide-react";
import { toPersianDigits } from "@/lib/format";
import { useToast } from "@/components/ToastProvider";
import AlertModal from "@/components/AlertModal";

type DynamicTemplate = {
  id: string;
  text: string;
  category: string;
  senderGender: string;
  targetGender: string;
  isActive: boolean;
  weight: number;
  sendCount: number;
  answerCount: number;
  createdAt: string;
};

const CATEGORIES = [
  { value: "CHAT_START", label: "شروع گفتگو" },
  { value: "FLIRTY", label: "شیطنت آمیز" },
  { value: "CASUAL", label: "راحت و دوستانه" },
  { value: "COMPLIMENT", label: "تعریف و تمجید" },
  { value: "CURIOSITY", label: "کنجکاوی" },
  { value: "PLAYFUL", label: "شوخ طبعانه" },
  { value: "WARM", label: "گرم و صمیمی" },
];

const inputClass = "w-full px-3 py-2 rounded-lg bg-[#0d0d0d] border border-[rgba(212,175,55,0.15)] text-[#e8e8e8] text-sm focus:outline-none focus:border-[rgba(212,175,55,0.4)]";
const labelClass = "text-[10px] text-[#888] mb-1 block";

export default function DynamicTemplatesPage() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<DynamicTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editWeight, setEditWeight] = useState(1);
  const [editActive, setEditActive] = useState(true);
  const [newText, setNewText] = useState("");
  const [newCategory, setNewCategory] = useState("CHAT_START");
  const [newWeight, setNewWeight] = useState(1);
  const [previewing, setPreviewing] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [importMode, setImportMode] = useState<"merge" | "replace">("merge");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/bot/templates");
      const data = await res.json();
      if (res.ok) setTemplates(data.templates);
    } catch { /* */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  async function addTemplate() {
    if (!newText.trim()) { toast("متن الزامی است", "error"); return; }
    try {
      const res = await fetch("/api/admin/bot/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newText, category: newCategory, weight: newWeight, senderGender: "FEMALE", targetGender: "MALE" }),
      });
      if (res.ok) {
        toast("قالب اضافه شد", "success");
        setNewText(""); setNewWeight(1); setShowAdd(false);
        fetchTemplates();
      }
    } catch { toast("خطا", "error"); }
  }

  async function saveEdit(id: string) {
    try {
      const res = await fetch("/api/admin/bot/templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, text: editText, category: editCategory, weight: editWeight, isActive: editActive }),
      });
      if (res.ok) {
        toast("ذخیره شد", "success");
        setEditing(null);
        fetchTemplates();
      }
    } catch { toast("خطا", "error"); }
  }

  async function deleteTemplate(id: string) {
    try {
      const res = await fetch(`/api/admin/bot/templates?id=${id}`, { method: "DELETE" });
      if (res.ok) { toast("حذف شد", "success"); fetchTemplates(); }
    } catch { toast("خطا", "error"); }
  }

  function startEdit(t: DynamicTemplate) {
    setEditing(t.id);
    setEditText(t.text);
    setEditCategory(t.category);
    setEditWeight(t.weight);
    setEditActive(t.isActive);
  }

  return (
    <div className="space-y-4">
      {/* هدر */}
      <div className="lux-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-black text-[#e8e8e8] flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#d4af37]" />
              قالب های داینامیک
            </h1>
            <p className="text-[#888] mt-1 text-xs">قالب‌های قابل ویرایش در دیتابیس ({toPersianDigits(templates.length)} قالب)</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => fetchTemplates()} className="px-3 py-2 rounded-xl lux-card text-xs font-bold text-[#888] hover:text-[#d4af37] flex items-center gap-1.5 transition-all">
              <RefreshCw className="w-4 h-4" />
            </button>
            <button onClick={() => setShowAdd(!showAdd)} className="px-3 py-2 rounded-xl lux-btn-gold text-xs font-bold flex items-center gap-1.5 transition-all">
              <Plus className="w-4 h-4" />
              قالب جدید
            </button>
            <button
              onClick={() => {
                fetch("/api/admin/bot/templates/import-export")
                  .then((r) => r.json())
                  .then((data) => {
                    const blob = new Blob([JSON.stringify(data.templates, null, 2)], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const a = window.document.createElement("a");
                    a.href = url;
                    a.download = `bot-templates-${new Date().toISOString().split("T")[0]}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  });
              }}
              className="px-3 py-2 rounded-xl lux-card text-xs font-bold text-[#888] hover:text-[#d4af37] flex items-center gap-1.5 transition-all"
              title="خروجی JSON"
            >
              <Download className="w-4 h-4" />
            </button>
            <button onClick={() => setShowImport(!showImport)} className="px-3 py-2 rounded-xl lux-card text-xs font-bold text-[#888] hover:text-[#d4af37] flex items-center gap-1.5 transition-all" title="ورودی JSON">
              <Upload className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* راهنمای متغیرها */}
        <div className="mt-3 p-3 rounded-lg bg-[#0d0d0d] border border-[rgba(212,175,55,0.1)]">
          <p className="text-[10px] text-[#888]">متغیرهای قابل استفاده در متن قالب:</p>
          <div className="flex gap-3 mt-1 flex-wrap">
            <code className="text-[10px] text-[#d4af37]">{"{name}"}</code>
            <code className="text-[10px] text-[#d4af37]">{"{city}"}</code>
            <code className="text-[10px] text-[#d4af37]">{"{age}"}</code>
            <code className="text-[10px] text-[#d4af37]">{"{job}"}</code>
          </div>
        </div>
      </div>

      {/* فرم افزودن */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="lux-card p-5 space-y-3">
              <h2 className="text-sm font-black text-[#d4af37]">قالب جدید</h2>
              <div>
                <label className={labelClass}>متن پیام</label>
                <textarea value={newText} onChange={(e) => setNewText(e.target.value)} rows={3} placeholder="سلام {name}، از {city} هستی؟" className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>دسته</label>
                  <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className={inputClass}>
                    {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>وزن (اولویت)</label>
                  <input type="number" value={newWeight} onChange={(e) => setNewWeight(parseInt(e.target.value) || 1)} className={inputClass} />
                </div>
              </div>
              <button onClick={addTemplate} className="px-4 py-2 rounded-xl lux-btn-gold text-xs font-bold flex items-center gap-1.5">
                <Save className="w-4 h-4" />
                ذخیره
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* فرم import */}
      <AnimatePresence>
        {showImport && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="lux-card p-5 space-y-3">
              <h2 className="text-sm font-black text-[#d4af37]">ورودی قالب‌ها از JSON</h2>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                rows={6}
                placeholder='[{"text":"سلام {name}","category":"CHAT_START","weight":1,"isActive":true}]'
                className={inputClass + " font-mono text-[10px]"}
              />
              <div className="flex items-center gap-3">
                <select value={importMode} onChange={(e) => setImportMode(e.target.value as "merge" | "replace")} className={inputClass + " w-auto"}>
                  <option value="merge">ادغام (افزودن به موجود)</option>
                  <option value="replace">جایگزینی (حذف و افزودن)</option>
                </select>
                <button
                  onClick={async () => {
                    try {
                      const templates = JSON.parse(importText);
                      const res = await fetch("/api/admin/bot/templates/import-export", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ templates, mode: importMode }),
                      });
                      const data = await res.json();
                      if (res.ok) {
                        toast(`${toPersianDigits(data.imported)} قالب وارد شد`, "success");
                        setShowImport(false);
                        setImportText("");
                        fetchTemplates();
                      } else {
                        toast(data.error ?? "خطا", "error");
                      }
                    } catch {
                      toast("JSON نامعتبر", "error");
                    }
                  }}
                  className="px-4 py-2 rounded-xl lux-btn-gold text-xs font-bold flex items-center gap-1.5"
                >
                  <Upload className="w-4 h-4" />
                  وارد کردن
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* لیست قالب‌ها */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#d4af37] animate-spin" />
        </div>
      ) : templates.length === 0 ? (
        <div className="lux-card p-10 text-center text-[#666] text-sm">قالب داینامیکی وجود ندارد</div>
      ) : (
        <div className="space-y-2">
          {templates.map((t, i) => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }} className="lux-card p-4">
              {editing === t.id ? (
                <div className="space-y-3">
                  <textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={2} className={inputClass} />
                  <div className="grid grid-cols-3 gap-3">
                    <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className={inputClass}>
                      {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                    <input type="number" value={editWeight} onChange={(e) => setEditWeight(parseInt(e.target.value) || 1)} className={inputClass} placeholder="وزن" />
                    <button onClick={() => setEditActive(!editActive)} className={`px-3 py-2 rounded-lg text-xs font-bold ${editActive ? "bg-[#d4af37] text-black" : "bg-[#333] text-[#888]"}`}>
                      {editActive ? "فعال" : "غیرفعال"}
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => saveEdit(t.id)} className="px-3 py-1.5 rounded-lg lux-btn-gold text-xs font-bold flex items-center gap-1"><Save className="w-3 h-3" />ذخیره</button>
                    <button onClick={() => setEditing(null)} className="px-3 py-1.5 rounded-lg lux-card text-xs font-bold text-[#888] flex items-center gap-1"><X className="w-3 h-3" />انصراف</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-xs text-[#e8e8e8] leading-5">{t.text}</p>
                    {previewing === t.id && (
                      <div className="mt-2 p-2 rounded-lg bg-[#0d0d0d] border border-[rgba(212,175,55,0.2)]">
                        <p className="text-[10px] text-[#888] mb-1">پیش‌نمایش:</p>
                        <p className="text-xs text-[#d4af37] leading-5">
                          {t.text
                            .replace(/\{name\}/g, "مریم")
                            .replace(/\{city\}/g, "تهران")
                            .replace(/\{age\}/g, "۲۵")
                            .replace(/\{job\}/g, "طراح")}
                        </p>
                      </div>
                    )}
                    <div className="flex gap-3 mt-2 flex-wrap">
                      <span className="text-[9px] text-[#d4af37]">{CATEGORIES.find((c) => c.value === t.category)?.label ?? t.category}</span>
                      <span className="text-[9px] text-[#888]">ارسال: {toPersianDigits(t.sendCount)}</span>
                      <span className="text-[9px] text-[#888]">پاسخ: {toPersianDigits(t.answerCount)}</span>
                      <span className="text-[9px] text-[#888]">وزن: {toPersianDigits(t.weight)}</span>
                      <span className={`text-[9px] ${t.isActive ? "text-[#4ade80]" : "text-[#ef4444]"}`}>{t.isActive ? "فعال" : "غیرفعال"}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => setPreviewing(previewing === t.id ? null : t.id)} className="p-1.5 rounded-lg text-[#888] hover:text-[#d4af37] hover:bg-[rgba(212,175,55,0.1)] transition-all" title="پیش‌نمایش"><Eye className="w-3.5 h-3.5" /></button>
                    <button onClick={() => startEdit(t)} className="p-1.5 rounded-lg text-[#888] hover:text-[#d4af37] hover:bg-[rgba(212,175,55,0.1)] transition-all"><Edit className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setConfirmDeleteId(t.id)} className="p-1.5 rounded-lg text-[#ef4444] hover:bg-[rgba(239,68,68,0.1)] transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* مودال تایید حذف */}
      <AlertModal
        open={confirmDeleteId !== null}
        message="آیا از حذف این قالب مطمئن هستید؟"
        variant="error"
        confirmLabel="حذف"
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={() => {
          if (confirmDeleteId) deleteTemplate(confirmDeleteId);
          setConfirmDeleteId(null);
        }}
      />
    </div>
  );
}
