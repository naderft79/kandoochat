"use client";

// فرم تماس با ما — ارسال پیام به پشتیبانی
import { useState } from "react";
import { Loader2, Check } from "lucide-react";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError("لطفا همه فیلدها را پر کنید");
      return;
    }
    setLoading(true);
    try {
      // ذخیره پیام به عنوان تیکت پشتیبانی
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      if (!res.ok) {
        setError("خطا در ارسال پیام");
        return;
      }
      setSent(true);
      setName("");
      setEmail("");
      setMessage("");
      setTimeout(() => setSent(false), 3000);
    } catch {
      setError("خطای شبکه");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-2 py-6">
        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
          <Check className="w-6 h-6 text-emerald-600" />
        </div>
        <p className="text-sm font-bold text-emerald-600">پیام شما با موفقیت ارسال شد</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="نام و نام خانوادگی"
        className="w-full px-4 py-3 rounded-xl bg-ig-gray-bg text-sm outline-none border border-transparent focus:border-ig-border transition-colors"
      />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="ایمیل"
        dir="ltr"
        className="w-full px-4 py-3 rounded-xl bg-ig-gray-bg text-sm outline-none border border-transparent focus:border-ig-border transition-colors text-left"
      />
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="پیام شما"
        rows={4}
        className="w-full px-4 py-3 rounded-xl bg-ig-gray-bg text-sm outline-none border border-transparent focus:border-ig-border transition-colors resize-none"
      />
      {error && <p className="text-xs text-ig-red">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-xl ig-gradient text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            در حال ارسال...
          </>
        ) : (
          "ارسال پیام"
        )}
      </button>
    </form>
  );
}
