"use client";

// کامپوننت تایید/رد درخواست احراز هویت در پنل ادمین
import { useState } from "react";
import { Check, X, Loader2 } from "lucide-react";

export default function VerifyReviewClient({ requestId }: { requestId: string }) {
  const [loading, setLoading] = useState<null | "APPROVE" | "REJECT">(null);

  async function handleAction(action: "APPROVE" | "REJECT") {
    setLoading(action);
    try {
      await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action }),
      });
      window.location.reload();
    } catch {
      setLoading(null);
    }
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => handleAction("APPROVE")}
        disabled={loading !== null}
        className="flex-1 py-2 rounded-lg lux-btn-gold text-xs font-bold disabled:opacity-40 transition-all flex items-center justify-center gap-1.5"
      >
        {loading === "APPROVE" ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Check className="w-3.5 h-3.5" />
        )}
        تایید
      </button>
      <button
        onClick={() => handleAction("REJECT")}
        disabled={loading !== null}
        className="flex-1 py-2 rounded-lg bg-[rgba(239,68,68,0.1)] text-[#f87171] border border-[rgba(239,68,68,0.2)] text-xs font-bold hover:bg-[rgba(239,68,68,0.15)] disabled:opacity-40 transition-all flex items-center justify-center gap-1.5"
      >
        {loading === "REJECT" ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <X className="w-3.5 h-3.5" />
        )}
        رد
      </button>
    </div>
  );
}
