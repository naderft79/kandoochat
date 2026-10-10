"use client";

// صفحه بکاپ و بازیابی دیتابیس
import { useState } from "react";
import { Download, Upload, Database, Loader2, AlertTriangle } from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import { toPersianDigits } from "@/lib/format";

export default function AdminBackupPage() {
  const { toast } = useToast();
  const [downloading, setDownloading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  async function downloadBackup() {
    setDownloading(true);
    try {
      const res = await fetch("/api/admin/backup");
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `kandoo-backup-${new Date().toISOString().split("T")[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast("بکاپ دانلود شد", "success");
      } else {
        toast("خطا در دانلود بکاپ", "error");
      }
    } finally {
      setDownloading(false);
    }
  }

  async function restoreBackup(file: File) {
    setRestoring(true);
    try {
      const text = await file.text();
      const backup = JSON.parse(text);
      if (!backup.meta || !backup.data) {
        toast("فایل بکاپ نامعتبر است", "error");
        return;
      }
      // ارسال به API restore
      const res = await fetch("/api/admin/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(backup),
      });
      const data = await res.json();
      if (res.ok) {
        toast("بازیابی با موفقیت انجام شد", "success");
      } else {
        toast(data.error ?? "خطا در بازیابی", "error");
      }
    } catch {
      toast("فایل نامعتبر است", "error");
    } finally {
      setRestoring(false);
      setShowConfirm(false);
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl lux-btn-gold flex items-center justify-center">
          <Database className="w-5 h-5 text-[#0d0d0d]" />
        </div>
        <div>
          <h1 className="text-lg font-black text-[#e8e8e8]">بکاپ و بازیابی</h1>
          <p className="text-xs text-[#888]">دانلود و بازیابی دیتابیس</p>
        </div>
      </div>

      {/* دانلود بکاپ */}
      <div className="lux-card p-5 mb-4">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[rgba(212,175,55,0.08)] flex items-center justify-center shrink-0">
            <Download className="w-5 h-5 text-[#d4af37]" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-[#e8e8e8]">دانلود بکاپ کامل</p>
            <p className="text-xs text-[#888] leading-5 mt-1">
              تمام داده های دیتابیس در یک فایل JSON دانلود می شود
            </p>
          </div>
        </div>
        <button
          onClick={downloadBackup}
          disabled={downloading}
          className="w-full py-2.5 rounded-xl lux-btn-gold text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          دانلود بکاپ
        </button>
      </div>

      {/* بازیابی بکاپ */}
      <div className="lux-card p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[rgba(245,158,11,0.1)] flex items-center justify-center shrink-0">
            <Upload className="w-5 h-5 text-[#f59e0b]" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-[#e8e8e8]">بازیابی از بکاپ</p>
            <p className="text-xs text-[#888] leading-5 mt-1">
              داده های فعلی جایگزین می شوند. این عمل قابل بازگشت نیست!
            </p>
          </div>
        </div>

        {showConfirm ? (
          <div className="bg-[rgba(239,68,68,0.06)] border border-[rgba(239,68,68,0.2)] rounded-xl p-3 mb-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-[#f87171]" />
              <p className="text-xs font-bold text-[#f87171]">هشدار</p>
            </div>
            <p className="text-xs text-[#f87171] leading-5 mb-3">
              با ادامه این عمل، تمام داده های فعلی حذف و با داده های فایل بکاپ جایگزین می شوند. آیا مطمئن هستید؟
            </p>
            <div className="flex gap-2">
              <label className="flex-1 py-2 rounded-lg bg-[#f87171] text-white text-xs font-bold text-center cursor-pointer hover:bg-[#ef4444] transition-colors">
                {restoring ? (
                  <span className="flex items-center justify-center gap-1">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> در حال بازیابی...
                  </span>
                ) : (
                  <span>بله، بازیابی کن</span>
                )}
                <input
                  type="file"
                  accept="application/json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) restoreBackup(file);
                  }}
                  disabled={restoring}
                />
              </label>
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 rounded-lg bg-[rgba(255,255,255,0.05)] text-[#888] text-xs font-bold hover:bg-[rgba(255,255,255,0.1)] transition-colors"
              >
                لغو
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowConfirm(true)}
            className="w-full py-2.5 rounded-xl bg-[rgba(245,158,11,0.1)] text-[#f59e0b] border border-[rgba(245,158,11,0.2)] text-sm font-bold hover:bg-[rgba(245,158,11,0.15)] transition-colors flex items-center justify-center gap-2"
          >
            <Upload className="w-4 h-4" />
            بازیابی از فایل
          </button>
        )}
      </div>
    </div>
  );
}
