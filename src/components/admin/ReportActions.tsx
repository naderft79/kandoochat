"use client";

// اقدامات مدیریت گزارش تخلف
import { useState } from "react";
import { Check, X, Ban } from "lucide-react";

export default function ReportActions({ reportId, reportedUserId }: { reportId: string; reportedUserId: string }) {
  const [loading, setLoading] = useState("");
  const [done, setDone] = useState(false);

  async function action(act: string) {
    setLoading(act);
    try {
      await fetch("/api/admin/reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId, action: act, reportedUserId }),
      });
      setDone(true);
    } finally {
      setLoading("");
    }
  }

  if (done) return <p className="text-xs text-[#34d399] font-bold mt-2">انجام شد</p>;

  return (
    <div className="flex gap-2 mt-3">
      <button
        onClick={() => action("RESOLVE")}
        disabled={!!loading}
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[rgba(16,185,129,0.1)] text-[#34d399] border border-[rgba(16,185,129,0.2)] text-xs font-bold hover:bg-[rgba(16,185,129,0.15)] transition-all disabled:opacity-40"
      >
        <Check className="w-3.5 h-3.5" />
        حل شد
      </button>
      <button
        onClick={() => action("DISMISS")}
        disabled={!!loading}
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg lux-btn-outline text-xs font-bold disabled:opacity-40"
      >
        <X className="w-3.5 h-3.5" />
        رد کردن
      </button>
      <button
        onClick={() => action("BAN")}
        disabled={!!loading}
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[rgba(239,68,68,0.1)] text-[#f87171] border border-[rgba(239,68,68,0.2)] text-xs font-bold hover:bg-[rgba(239,68,68,0.15)] transition-all disabled:opacity-40"
      >
        <Ban className="w-3.5 h-3.5" />
        مسدود کردن کاربر
      </button>
    </div>
  );
}
