"use client";

// صفحه پشتیبانی — لیست تیکت های کاربر
import { useEffect, useState } from "react";
import Link from "next/link";
import { Headphones, Plus, X, MessageCircle, CheckCircle, Clock } from "lucide-react";
import { toPersianDigits, formatDateTime } from "@/lib/format";
import { useToast } from "@/components/ToastProvider";

type Ticket = {
  id: string;
  subject: string;
  status: string;
  priority: string;
  category: string | null;
  createdAt: string;
  updatedAt: string;
  messages: { content: string; createdAt: string }[];
};

const STATUS_MAP: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  OPEN: { label: "باز", color: "#3b82f6", icon: Clock },
  ANSWERED: { label: "پاسخ داده شده", color: "#10b981", icon: CheckCircle },
  CLOSED: { label: "بسته شده", color: "#64748b", icon: CheckCircle },
};

const CATEGORIES = ["عمومی", "مالی", "فنی", "امنیت", "حساب کاربری"];

export default function SupportPage() {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("عمومی");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/tickets")
      .then((r) => r.json())
      .then((data) => {
        if (data.tickets) setTickets(data.tickets);
      })
      .finally(() => setLoading(false));
  }, []);

  async function createTicket() {
    if (!subject.trim() || !content.trim()) {
      toast("موضوع و متن پیام الزامی است");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, category, content }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast(data.error || "خطا در ایجاد تیکت");
        return;
      }
      const data = await res.json();
      setTickets((prev) => [data.ticket, ...prev]);
      setShowNew(false);
      setSubject("");
      setContent("");
      setCategory("عمومی");
      toast("تیکت با موفقیت ایجاد شد");
    } catch {
      toast("خطای شبکه");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-6 md:py-10">
      {/* هدر */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-ig-gray-bg flex items-center justify-center">
            <Headphones className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">پشتیبانی</h1>
            <p className="text-xs text-ig-gray">تیکت های پشتیبانی شما</p>
          </div>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-ig-blue text-white text-sm font-bold"
        >
          <Plus className="w-4 h-4" />
          تیکت جدید
        </button>
      </div>

      {/* لیست تیکت ها */}
      {loading ? (
        <div className="text-center py-10">
          <p className="text-sm text-ig-gray">در حال بارگذاری...</p>
        </div>
      ) : tickets.length === 0 ? (
        <div className="bg-surface border border-ig-border rounded-2xl p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-ig-gray-bg flex items-center justify-center mx-auto mb-3">
            <MessageCircle className="w-8 h-8 text-ig-gray" strokeWidth={1.5} />
          </div>
          <p className="text-sm font-bold text-foreground mb-1">تیکتی وجود ندارد</p>
          <p className="text-xs text-ig-gray leading-5">
            برای ارتباط با تیم پشتیبانی تیکت جدید ایجاد کنید
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => {
            const status = STATUS_MAP[ticket.status] || STATUS_MAP.OPEN;
            const StatusIcon = status.icon;
            const lastMsg = ticket.messages[0];
            return (
              <Link
                key={ticket.id}
                href={`/dashboard/support/${ticket.id}`}
                className="block bg-surface border border-ig-border rounded-2xl p-4 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-foreground line-clamp-1">{ticket.subject}</span>
                  <span
                    className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full shrink-0"
                    style={{ background: `${status.color}15`, color: status.color }}
                  >
                    <StatusIcon className="w-3 h-3" />
                    {status.label}
                  </span>
                </div>
                {lastMsg && (
                  <p className="text-xs text-ig-gray line-clamp-1 mb-2">{lastMsg.content}</p>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {ticket.category && (
                      <span className="text-xs text-ig-gray bg-ig-gray-bg px-2 py-0.5 rounded-full">
                        {ticket.category}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-ig-gray">
                    {formatDateTime(ticket.updatedAt)}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* مودال تیکت جدید */}
      {showNew && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => setShowNew(false)}
        >
          <div
            className="bg-surface rounded-2xl w-full max-w-md p-5 ig-modal-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-foreground">تیکت جدید</h2>
              <button onClick={() => setShowNew(false)} className="p-1 hover:bg-ig-gray-bg rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-ig-gray mb-1 block">موضوع</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="موضوع تیکت..."
                  className="w-full px-3 py-2.5 rounded-xl bg-ig-gray-bg text-sm outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-ig-gray mb-1 block">دسته بندی</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                        category === cat
                          ? "bg-ig-blue text-white"
                          : "bg-ig-gray-bg text-foreground hover:bg-neutral-200"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-ig-gray mb-1 block">پیام</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="پیام خود را بنویسید..."
                  rows={4}
                  className="w-full px-3 py-2.5 rounded-xl bg-ig-gray-bg text-sm outline-none resize-none"
                />
              </div>
              <button
                onClick={createTicket}
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-ig-blue text-white text-sm font-bold disabled:opacity-50"
              >
                {submitting ? "در حال ارسال..." : "ارسال تیکت"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
