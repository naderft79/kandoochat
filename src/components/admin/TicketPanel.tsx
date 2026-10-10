"use client";

// پنل مدیریت تیکت — پاسخ ادمین به تیکت
import { useState, useEffect, useRef, useCallback } from "react";
import { Send, Image as ImageIcon, Headphones, AlertTriangle } from "lucide-react";
import { formatTime, toPersianDigits, formatDateTime } from "@/lib/format";
import { useToast } from "@/components/ToastProvider";

type TicketMessage = {
  id: string;
  senderId: string;
  content: string;
  attachments: string | null;
  isFromAdmin: boolean;
  createdAt: string;
};

type Ticket = {
  id: string;
  subject: string;
  status: string;
  priority: string;
  category: string | null;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    username: string | null;
    phone: string;
    photos: { url: string }[];
  };
  messages: TicketMessage[];
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  OPEN: { label: "باز", color: "#3b82f6" },
  ANSWERED: { label: "پاسخ داده شده", color: "#10b981" },
  CLOSED: { label: "بسته شده", color: "#64748b" },
};

const PRIORITY_LABELS: Record<string, { label: string; color: string }> = {
  LOW: { label: "کم", color: "#64748b" },
  MEDIUM: { label: "متوسط", color: "#f59e0b" },
  HIGH: { label: "زیاد", color: "#ef4444" },
};

export default function TicketPanel({ ticketId }: { ticketId: string }) {
  const { toast } = useToast();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastDateRef = useRef<string | null>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/admin/tickets/${ticketId}`);
        if (res.ok) {
          const data = await res.json();
          setTicket(data.ticket);
          if (data.ticket?.messages?.length) {
            lastDateRef.current = data.ticket.messages[data.ticket.messages.length - 1].createdAt;
          }
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [ticketId]);

  useEffect(() => {
    scrollToBottom();
  }, [ticket?.messages.length, scrollToBottom]);

  // polling پیام های جدید
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!ticket) return;
      try {
        const res = await fetch(`/api/admin/tickets/${ticketId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.ticket?.messages?.length) {
          setTicket((prev) => {
            if (!prev) return prev;
            const existing = new Set(prev.messages.map((m) => m.id));
            const fresh = data.ticket.messages.filter((m: TicketMessage) => !existing.has(m.id));
            if (!fresh.length) return prev;
            lastDateRef.current = fresh[fresh.length - 1].createdAt;
            return { ...prev, messages: [...prev.messages, ...fresh], status: data.ticket.status };
          });
        }
      } catch {
        // ignore
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [ticketId, ticket]);

  async function sendReply() {
    if (!text.trim() || sending || !ticket) return;
    setSending(true);
    try {
      const res = await fetch(`/api/admin/tickets/${ticketId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast(data.error || "خطا در ارسال پاسخ");
        return;
      }
      const data = await res.json();
      setTicket((prev) => prev ? {
        ...prev,
        messages: [...prev.messages, data.message],
        status: "ANSWERED",
      } : prev);
      lastDateRef.current = data.message.createdAt;
      setText("");
    } catch {
      toast("خطای شبکه");
    } finally {
      setSending(false);
    }
  }

  async function uploadFile(file: File) {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) {
        toast("خطا در آپلود فایل");
        return;
      }
      const data = await res.json();
      const attachments = [data.url];
      const msgRes = await fetch(`/api/admin/tickets/${ticketId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "📎 فایل ضمیمه", attachments }),
      });
      if (msgRes.ok) {
        const msgData = await msgRes.json();
        setTicket((prev) => prev ? {
          ...prev,
          messages: [...prev.messages, msgData.message],
          status: "ANSWERED",
        } : prev);
        lastDateRef.current = msgData.message.createdAt;
      }
    } catch {
      toast("خطای شبکه");
    } finally {
      setUploading(false);
    }
  }

  async function updateStatus(newStatus: string) {
    try {
      const res = await fetch("/api/admin/tickets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: ticketId, status: newStatus }),
      });
      if (res.ok) {
        setTicket((prev) => prev ? { ...prev, status: newStatus } : prev);
        toast("وضعیت تیکت به روز شد");
      }
    } catch {
      toast("خطای شبکه");
    }
  }

  async function updatePriority(newPriority: string) {
    try {
      const res = await fetch("/api/admin/tickets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: ticketId, priority: newPriority }),
      });
      if (res.ok) {
        setTicket((prev) => prev ? { ...prev, priority: newPriority } : prev);
        toast("اولویت تیکت به روز شد");
      }
    } catch {
      toast("خطای شبکه");
    }
  }

  if (loading) {
    return (
      <div className="text-center py-10">
        <p className="text-sm text-[#888]">در حال بارگذاری...</p>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-10">
        <p className="text-sm text-[#888]">تیکت یافت نشد</p>
      </div>
    );
  }

  const status = STATUS_LABELS[ticket.status] || STATUS_LABELS.OPEN;
  const priority = PRIORITY_LABELS[ticket.priority] || PRIORITY_LABELS.MEDIUM;
  const isClosed = ticket.status === "CLOSED";

  return (
    <div className="space-y-4">
      {/* اطلاعات تیکت */}
      <div className="lux-card p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h2 className="text-base font-bold text-[#e8e8e8]">{ticket.subject}</h2>
            <p className="text-xs text-[#888] mt-1">
              {ticket.user.firstName} {ticket.user.lastName} · @{ticket.user.username || "—"} · {ticket.user.phone}
            </p>
            <p className="text-xs text-[#888] mt-0.5">
              ایجاد: {formatDateTime(ticket.createdAt)}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <span
              className="text-xs font-bold px-2.5 py-1 rounded-full"
              style={{ background: `${status.color}15`, color: status.color }}
            >
              {status.label}
            </span>
            <span
              className="text-xs font-bold px-2.5 py-1 rounded-full"
              style={{ background: `${priority.color}15`, color: priority.color }}
            >
              اولویت: {priority.label}
            </span>
          </div>
        </div>

        {/* کنترل های مدیریت */}
        <div className="flex flex-wrap gap-2 pt-3 border-t border-[rgba(212,175,55,0.1)]">
          <select
            value={ticket.status}
            onChange={(e) => updateStatus(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-[#0d0d0d] border border-[rgba(212,175,55,0.15)] text-[#e8e8e8] text-xs font-bold outline-none focus:border-[rgba(212,175,55,0.4)]"
          >
            <option value="OPEN">باز</option>
            <option value="ANSWERED">پاسخ داده شده</option>
            <option value="CLOSED">بسته شده</option>
          </select>
          <select
            value={ticket.priority}
            onChange={(e) => updatePriority(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-[#0d0d0d] border border-[rgba(212,175,55,0.15)] text-[#e8e8e8] text-xs font-bold outline-none focus:border-[rgba(212,175,55,0.4)]"
          >
            <option value="LOW">اولویت: کم</option>
            <option value="MEDIUM">اولویت: متوسط</option>
            <option value="HIGH">اولویت: زیاد</option>
          </select>
          {ticket.category && (
            <span className="px-3 py-1.5 rounded-lg bg-[rgba(212,175,55,0.06)] border border-[rgba(212,175,55,0.1)] text-xs font-bold text-[#d4af37]">
              {ticket.category}
            </span>
          )}
        </div>
      </div>

      {/* چت تیکت */}
      <div className="lux-card overflow-hidden">
        <div className="max-h-[50vh] overflow-y-auto px-4 py-4 space-y-3 thin-scroll">
          {ticket.messages.length === 0 && (
            <div className="text-center py-8">
              <Headphones className="w-8 h-8 text-[rgba(212,175,55,0.3)] mx-auto mb-2" strokeWidth={1.5} />
              <p className="text-sm text-[#666]">پیامی وجود ندارد</p>
            </div>
          )}
          {ticket.messages.map((msg) => {
            const isAdmin = msg.isFromAdmin;
            let attachments: string[] = [];
            try {
              attachments = msg.attachments ? JSON.parse(msg.attachments) : [];
            } catch {
              // ignore
            }
            return (
              <div key={msg.id} className={`flex ${isAdmin ? "justify-start" : "justify-end"}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 ${
                    isAdmin
                      ? "lux-btn-gold rounded-bl-md"
                      : "bg-[rgba(212,175,55,0.06)] border border-[rgba(212,175,55,0.1)] text-[#e8e8e8] rounded-br-md"
                  }`}
                >
                  {isAdmin && (
                    <p className="text-[10px] font-bold text-[#0d0d0d]/70 mb-1">ادمین</p>
                  )}
                  <p className="text-sm leading-6 whitespace-pre-wrap break-words">{msg.content}</p>
                  {attachments.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {attachments.map((url, i) => (
                        <a
                          key={i}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-xs underline"
                        >
                          فایل ضمیمه {toPersianDigits(i + 1)}
                        </a>
                      ))}
                    </div>
                  )}
                  <p className={`text-[10px] mt-1 ${isAdmin ? "text-[#0d0d0d]/60" : "text-[#888]"}`}>
                    {formatTime(msg.createdAt)}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* ورودی پاسخ */}
        {isClosed ? (
          <div className="border-t border-[rgba(212,175,55,0.1)] px-4 py-3 text-center">
            <p className="text-sm text-[#888] font-bold">این تیکت بسته شده است</p>
            <button
              onClick={() => updateStatus("OPEN")}
              className="mt-2 text-xs text-[#d4af37] font-bold underline"
            >
              باز کردن مجدد
            </button>
          </div>
        ) : (
          <div className="border-t border-[rgba(212,175,55,0.1)] px-3 py-2.5 flex items-center gap-2 bg-[#141414]">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadFile(file);
                e.target.value = "";
              }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="p-2 rounded-lg hover:bg-[rgba(212,175,55,0.08)] transition-colors shrink-0"
            >
              {uploading ? (
                <div className="w-5 h-5 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin" />
              ) : (
                <ImageIcon className="w-5 h-5 text-[#888]" strokeWidth={1.5} />
              )}
            </button>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendReply();
                }
              }}
              placeholder="پاسخ به کاربر..."
              className="flex-1 px-3 py-2.5 rounded-xl bg-[#0d0d0d] border border-[rgba(212,175,55,0.15)] text-[#e8e8e8] text-sm outline-none focus:border-[rgba(212,175,55,0.4)]"
            />
            <button
              onClick={sendReply}
              disabled={!text.trim() || sending}
              className="p-2.5 rounded-xl lux-btn-gold shrink-0 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
