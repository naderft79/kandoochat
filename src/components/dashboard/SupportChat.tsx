"use client";

// چت پشتیبانی — شبیه ChatRoom اما ساده تر برای تیکت ها
import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowRight, Send, Image as ImageIcon, X, Headphones } from "lucide-react";
import { formatTime, toPersianDigits } from "@/lib/format";
import { useToast } from "@/components/ToastProvider";

type TicketMessage = {
  id: string;
  senderId: string;
  content: string;
  attachments: string | null;
  isFromAdmin: boolean;
  createdAt: string;
};

type Props = {
  ticketId: string;
  currentUserId: string;
  ticketStatus: string;
  initialMessages: TicketMessage[];
};

export default function SupportChat({
  ticketId,
  currentUserId,
  ticketStatus,
  initialMessages,
}: Props) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<TicketMessage[]>(initialMessages);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastDateRef = useRef<string | null>(
    initialMessages.length
      ? initialMessages[initialMessages.length - 1].createdAt
      : null
  );

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, scrollToBottom]);

  // polling پیام های جدید هر ۱۰ ثانیه
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const params = new URLSearchParams();
        if (lastDateRef.current) params.set("after", lastDateRef.current);
        const res = await fetch(`/api/tickets/${ticketId}?${params}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.ticket?.messages?.length) {
          setMessages((prev) => {
            const existing = new Set(prev.map((m) => m.id));
            const fresh = data.ticket.messages.filter(
              (m: TicketMessage) => !existing.has(m.id)
            );
            if (!fresh.length) return prev;
            lastDateRef.current = fresh[fresh.length - 1].createdAt;
            return [...prev, ...fresh];
          });
        }
      } catch {
        // خطای شبکه
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [ticketId]);

  async function sendMessage() {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast(data.error || "خطا در ارسال پیام");
        return;
      }
      const data = await res.json();
      setMessages((prev) => [...prev, data.message]);
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
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        toast("خطا در آپلود فایل");
        return;
      }
      const data = await res.json();
      const attachments = [data.url];
      const msgRes = await fetch(`/api/tickets/${ticketId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "📎 فایل ضمیمه", attachments }),
      });
      if (msgRes.ok) {
        const msgData = await msgRes.json();
        setMessages((prev) => [...prev, msgData.message]);
        lastDateRef.current = msgData.message.createdAt;
      }
    } catch {
      toast("خطای شبکه");
    } finally {
      setUploading(false);
    }
  }

  const isClosed = ticketStatus === "CLOSED";

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] lg:h-[calc(100vh-6rem)]">
      {/* پیام ها */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 thin-scroll">
        {messages.length === 0 && (
          <div className="text-center py-10">
            <Headphones className="w-10 h-10 text-ig-gray mx-auto mb-2" strokeWidth={1.5} />
            <p className="text-sm text-ig-gray">پیامی وجود ندارد</p>
          </div>
        )}
        {messages.map((msg) => {
          const isMine = msg.senderId === currentUserId && !msg.isFromAdmin;
          let attachments: string[] = [];
          try {
            attachments = msg.attachments ? JSON.parse(msg.attachments) : [];
          } catch {
            // ignore
          }
          return (
            <div
              key={msg.id}
              className={`flex ${isMine ? "justify-start" : "justify-end"}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 ${
                  isMine
                    ? "bg-ig-gray-bg text-foreground rounded-bl-md"
                    : "bg-ig-blue text-white rounded-br-md"
                }`}
              >
                {!isMine && (
                  <p className="text-xs font-bold text-white/80 mb-1">پشتیبانی</p>
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
                <p className={`text-xs mt-1 ${isMine ? "text-ig-gray" : "text-white/70"}`}>
                  {formatTime(msg.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* ورودی پیام */}
      {isClosed ? (
        <div className="border-t border-ig-border px-4 py-3 text-center">
          <p className="text-sm text-ig-gray font-bold">این تیکت بسته شده است</p>
        </div>
      ) : (
        <div className="border-t border-ig-border px-3 py-2.5 flex items-center gap-2 bg-white">
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
            className="p-2 rounded-lg hover:bg-ig-gray-bg transition-colors shrink-0"
          >
            {uploading ? (
              <div className="w-5 h-5 border-2 border-ig-gray border-t-transparent rounded-full animate-spin" />
            ) : (
              <ImageIcon className="w-5 h-5 text-ig-gray" strokeWidth={1.5} />
            )}
          </button>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="پیام خود را بنویسید..."
            className="flex-1 px-3 py-2.5 rounded-xl bg-ig-gray-bg text-sm outline-none"
          />
          <button
            onClick={sendMessage}
            disabled={!text.trim() || sending}
            className="p-2.5 rounded-xl bg-ig-blue text-white shrink-0 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
