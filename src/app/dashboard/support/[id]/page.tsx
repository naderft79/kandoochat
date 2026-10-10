"use client";

// صفحه گفتگو تیکت — نمایش چت تیکت
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle, X } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import SupportChat from "@/components/dashboard/SupportChat";
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
  userId: string;
  messages: TicketMessage[];
};

export default function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { toast } = useToast();
  const router = useRouter();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState("");
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    (async () => {
      const { id } = await params;
      // دریافت اطلاعات کاربر
      const meRes = await fetch("/api/me");
      const meData = await meRes.json();
      if (meData.user?.id) setCurrentUserId(meData.user.id);

      // دریافت تیکت
      const res = await fetch(`/api/tickets/${id}`);
      if (res.ok) {
        const data = await res.json();
        setTicket(data.ticket);
      }
      setLoading(false);
    })();
  }, [params]);

  async function closeTicket() {
    if (!ticket) return;
    setClosing(true);
    try {
      const res = await fetch(`/api/tickets/${ticket.id}/close`, { method: "POST" });
      if (res.ok) {
        setTicket((prev) => prev ? { ...prev, status: "CLOSED" } : null);
        toast("تیکت بسته شد");
      } else {
        toast("خطا در بستن تیکت");
      }
    } catch {
      toast("خطای شبکه");
    } finally {
      setClosing(false);
    }
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="پشتیبانی" right={
          <button onClick={() => router.push("/dashboard/support")} className="p-1.5 rounded-lg hover:bg-ig-gray-bg">
            <ArrowRight className="w-5 h-5" />
          </button>
        } />
        <div className="text-center py-10">
          <p className="text-sm text-ig-gray">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div>
        <PageHeader title="پشتیبانی" right={
          <button onClick={() => router.push("/dashboard/support")} className="p-1.5 rounded-lg hover:bg-ig-gray-bg">
            <ArrowRight className="w-5 h-5" />
          </button>
        } />
        <div className="text-center py-10">
          <p className="text-sm text-ig-gray">تیکت یافت نشد</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={ticket.subject}
        subtitle={ticket.category || undefined}
        right={
          <button
            onClick={() => router.push("/dashboard/support")}
            className="p-1.5 rounded-lg hover:bg-ig-gray-bg"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        }
        left={
          ticket.status !== "CLOSED" ? (
            <button
              onClick={closeTicket}
              disabled={closing}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-ig-gray-bg text-xs font-bold text-ig-gray hover:bg-neutral-200"
            >
              <X className="w-3.5 h-3.5" />
              بستن
            </button>
          ) : (
            <span className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-ig-gray-bg text-xs font-bold text-ig-gray">
              <CheckCircle className="w-3.5 h-3.5" />
              بسته شده
            </span>
          )
        }
      />
      <SupportChat
        ticketId={ticket.id}
        currentUserId={currentUserId}
        ticketStatus={ticket.status}
        initialMessages={ticket.messages}
      />
    </div>
  );
}
