"use client";

// فرم ارسال پیام گروهی
import { useState } from "react";
import { Megaphone, Loader2 } from "lucide-react";

export default function BroadcastForm() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function send() {
    if (!title.trim() || !body.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        setTitle("");
        setBody("");
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(data.error || "خطا");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="lux-card p-4 space-y-3">
      <h2 className="text-sm font-bold text-[#e8e8e8]">ارسال پیام جدید</h2>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="عنوان پیام"
        maxLength={100}
        className="w-full px-3 py-2.5 rounded-lg border border-[rgba(212,175,55,0.15)] bg-[#0d0d0d] text-[#e8e8e8] focus:border-[rgba(212,175,55,0.4)] outline-none text-sm"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="متن پیام..."
        maxLength={500}
        rows={3}
        className="w-full px-3 py-2.5 rounded-lg border border-[rgba(212,175,55,0.15)] bg-[#0d0d0d] text-[#e8e8e8] focus:border-[rgba(212,175,55,0.4)] outline-none text-sm resize-none"
      />
      <button
        onClick={send}
        disabled={loading || !title.trim() || !body.trim()}
        className="flex items-center gap-2 px-4 py-2.5 rounded-lg lux-btn-gold text-sm font-bold disabled:opacity-40"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Megaphone className="w-4 h-4" />}
        ارسال به همه کاربران
      </button>
      {success && <p className="text-xs text-[#34d399] font-bold">پیام ارسال شد</p>}
      {error && <p className="text-xs text-[#f87171]">{error}</p>}
    </div>
  );
}
