"use client";

// کامپوننت تایید/رد درخواست احراز هویت در پنل ادمین — رد فقط با دلیل معتبر ممکن است
import { useState } from "react";
import { Check, X, Loader2 } from "lucide-react";
import { REJECT_REASONS, MAX_REJECT_NOTE_LENGTH, type RejectReasonId } from "@/lib/verification-reasons";
import { useToast } from "@/components/ToastProvider";

export default function VerifyReviewClient({ requestId }: { requestId: string }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState<null | "APPROVE" | "REJECT">(null);
  const [rejecting, setRejecting] = useState(false);
  const [reasonId, setReasonId] = useState<RejectReasonId | "">("");
  const [note, setNote] = useState("");

  async function send(action: "APPROVE" | "REJECT") {
    if (action === "REJECT" && !reasonId) {
      toast("یک دلیل رد انتخاب کنید", "error");
      return;
    }
    if (action === "REJECT" && reasonId === "OTHER" && !note.trim()) {
      toast("برای سایر موارد توضیح بنویسید", "error");
      return;
    }
    setLoading(action);
    try {
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action, reasonId, note }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast(data.error ?? "خطا در ثبت تصمیم", "error");
        setLoading(null);
        return;
      }
      window.location.reload();
    } catch {
      toast("خطا در ارتباط با سرور", "error");
      setLoading(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button
          onClick={() => send("APPROVE")}
          disabled={loading !== null}
          className="flex-1 py-2 rounded-lg lux-btn-gold text-xs font-bold disabled:opacity-40 transition-all flex items-center justify-center gap-1.5"
        >
          {loading === "APPROVE" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          تایید
        </button>
        <button
          onClick={() => setRejecting((v) => !v)}
          disabled={loading !== null}
          aria-expanded={rejecting}
          className="flex-1 py-2 rounded-lg bg-[rgba(239,68,68,0.1)] text-[#f87171] border border-[rgba(239,68,68,0.2)] text-xs font-bold hover:bg-[rgba(239,68,68,0.15)] disabled:opacity-40 transition-all flex items-center justify-center gap-1.5"
        >
          <X className="w-3.5 h-3.5" />
          رد با دلیل
        </button>
      </div>

      {rejecting && (
        <div className="rounded-xl border border-[rgba(239,68,68,0.2)] p-3 space-y-3">
          <p className="text-xs font-bold text-[#e8e8e8]">دلیل رد (الزامی)</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {REJECT_REASONS.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setReasonId(r.id)}
                aria-pressed={reasonId === r.id}
                className={`text-right px-3 py-2 rounded-lg text-xs transition-all border ${
                  reasonId === r.id
                    ? "border-[#d4af37] bg-[rgba(212,175,55,0.12)] text-[#d4af37] font-bold"
                    : "border-[rgba(212,175,55,0.12)] text-[#bbb] hover:border-[rgba(212,175,55,0.3)]"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, MAX_REJECT_NOTE_LENGTH))}
            placeholder="توضیح تکمیلی (اختیاری؛ برای «سایر موارد» الزامی)"
            rows={2}
            className="w-full px-3 py-2 rounded-lg bg-[#0d0b14] border border-[rgba(212,175,55,0.15)] text-xs text-[#e8e8e8] outline-none focus:border-[rgba(212,175,55,0.4)]"
          />
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] text-[#666]">
              {note.length.toLocaleString("fa-IR")} / {MAX_REJECT_NOTE_LENGTH}
            </span>
            <button
              onClick={() => send("REJECT")}
              disabled={loading !== null || !reasonId}
              className="px-4 py-2 rounded-lg bg-[#f87171] text-white text-xs font-bold disabled:opacity-40 flex items-center gap-1.5"
            >
              {loading === "REJECT" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              ثبت رد
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
