"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { ScrollText, Loader2, RefreshCw, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { toPersianDigits } from "@/lib/format";

type BotLog = {
  id: string;
  botType: string;
  senderId: string | null;
  targetId: string | null;
  templateId: string | null;
  category: string | null;
  status: string;
  detail: string | null;
  createdAt: string;
};

const BOT_TYPE_LABELS: Record<string, string> = {
  MESSAGE: "پیام",
  LIKE: "لایک",
  PROFILE_VIEW: "بازدید پروفایل",
  STORY_VIEW: "بازدید استوری",
  GIFT: "هدیه",
  MATCH: "مچ",
  AUTO_REPLY: "پاسخ خودکار",
  CONVERSATION: "گفتگوی چندمرحله‌ای",
};

const STATUS_COLORS: Record<string, string> = {
  SENT: "#4ade80",
  SKIPPED: "#fbbf24",
  FAILED: "#ef4444",
  ANSWERED: "#60a5fa",
};

const inputClass = "w-full px-3 py-2 rounded-lg bg-[#0d0d0d] border border-[rgba(212,175,55,0.15)] text-[#e8e8e8] text-sm focus:outline-none focus:border-[rgba(212,175,55,0.4)]";

export default function LogsPage() {
  const [logs, setLogs] = useState<BotLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filterBotType, setFilterBotType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  const fetchLogs = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: "20" });
      if (filterBotType) params.set("botType", filterBotType);
      if (filterStatus) params.set("status", filterStatus);
      if (filterFrom) params.set("from", filterFrom);
      if (filterTo) params.set("to", filterTo);
      const res = await fetch(`/api/admin/bot/logs?${params}`);
      const data = await res.json();
      if (res.ok) {
        setLogs(data.logs);
        setTotal(data.total);
        setTotalPages(data.totalPages);
        setPage(data.page);
      }
    } catch { /* */ } finally { setLoading(false); }
  }, [filterBotType, filterStatus, filterFrom, filterTo]);

  useEffect(() => { fetchLogs(1); }, [fetchLogs]);

  return (
    <div className="space-y-4">
      {/* هدر */}
      <div className="lux-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-black text-[#e8e8e8] flex items-center gap-2">
              <ScrollText className="w-5 h-5 text-[#d4af37]" />
              لاگ ربات
            </h1>
            <p className="text-[#888] mt-1 text-xs">تاریخچه تمام عملیات ربات ({toPersianDigits(total)} رکورد)</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                const params = new URLSearchParams();
                if (filterBotType) params.set("botType", filterBotType);
                if (filterFrom) params.set("from", filterFrom);
                if (filterTo) params.set("to", filterTo);
                window.open(`/api/admin/bot/logs/export?${params}`, "_blank");
              }}
              className="px-3 py-2 rounded-xl lux-card text-xs font-bold text-[#888] hover:text-[#d4af37] flex items-center gap-1.5 transition-all"
              title="خروجی CSV"
            >
              <Download className="w-4 h-4" />
            </button>
            <button onClick={() => fetchLogs(page)} className="px-3 py-2 rounded-xl lux-card text-xs font-bold text-[#888] hover:text-[#d4af37] flex items-center gap-1.5 transition-all">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* فیلترها */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          <div>
            <select value={filterBotType} onChange={(e) => setFilterBotType(e.target.value)} className={inputClass}>
              <option value="">همه نوع ربات</option>
              {Object.entries(BOT_TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={inputClass}>
              <option value="">همه وضعیت ها</option>
              <option value="SENT">ارسال شده</option>
              <option value="SKIPPED">رد شده</option>
              <option value="FAILED">خطا</option>
              <option value="ANSWERED">پاسخ داده شده</option>
            </select>
          </div>
          <div>
            <input
              type="date"
              value={filterFrom}
              onChange={(e) => setFilterFrom(e.target.value)}
              className={inputClass}
              placeholder="از تاریخ"
            />
          </div>
          <div>
            <input
              type="date"
              value={filterTo}
              onChange={(e) => setFilterTo(e.target.value)}
              className={inputClass}
              placeholder="تا تاریخ"
            />
          </div>
        </div>
      </div>

      {/* لاگ‌ها */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#d4af37] animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <div className="lux-card p-10 text-center text-[#666] text-sm">لاگی وجود ندارد</div>
      ) : (
        <div className="space-y-2">
          {logs.map((log, i) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.02 }}
              className="lux-card p-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full" style={{ background: STATUS_COLORS[log.status] ?? "#888" }} />
                <div>
                  <p className="text-xs font-bold text-[#e8e8e8]">{BOT_TYPE_LABELS[log.botType] ?? log.botType}</p>
                  <p className="text-[10px] text-[#888]">
                    {log.detail && <span>{log.detail} • </span>}
                    {new Date(log.createdAt).toLocaleString("fa-IR")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {log.targetId && <span className="text-[9px] text-[#666]">هدف: {log.targetId.substring(0, 8)}...</span>}
                <span className="text-[10px] font-bold" style={{ color: STATUS_COLORS[log.status] ?? "#888" }}>{log.status}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* صفحه بندی */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => fetchLogs(page - 1)}
            disabled={page <= 1}
            className="px-3 py-2 rounded-xl lux-card text-xs font-bold text-[#888] hover:text-[#d4af37] disabled:opacity-30 transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <span className="text-xs text-[#888]">{toPersianDigits(page)} از {toPersianDigits(totalPages)}</span>
          <button
            onClick={() => fetchLogs(page + 1)}
            disabled={page >= totalPages}
            className="px-3 py-2 rounded-xl lux-card text-xs font-bold text-[#888] hover:text-[#d4af37] disabled:opacity-30 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
