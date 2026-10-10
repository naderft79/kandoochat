// صفحه مدیریت تیکت های پشتیبانی — پنل ادمین
import { prisma } from "@/lib/prisma";
import { formatDateTime, toPersianDigits } from "@/lib/format";
import { Ticket as TicketIcon, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import Link from "next/link";
import AdminPagination from "@/components/admin/AdminPagination";

const PAGE_SIZE = 20;

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

export default async function AdminTicketsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    status?: string;
    priority?: string;
    search?: string;
  }>;
}) {
  const { page: pageStr, status, priority, search } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10) || 1);

  const where: Record<string, unknown> = {};
  if (status && status !== "ALL") where.status = status;
  if (priority && priority !== "ALL") where.priority = priority;
  if (search) {
    where.OR = [
      { subject: { contains: search } },
      { user: { firstName: { contains: search } } },
      { user: { lastName: { contains: search } } },
      { user: { username: { contains: search } } },
    ];
  }

  const [tickets, total, openCount, answeredCount, closedCount, highPriorityCount] = await Promise.all([
    prisma.ticket.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            photos: { where: { isProfile: true, isDeletedByUser: false }, select: { url: true }, take: 1 },
          },
        },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    }),
    prisma.ticket.count({ where }),
    prisma.ticket.count({ where: { status: "OPEN" } }),
    prisma.ticket.count({ where: { status: "ANSWERED" } }),
    prisma.ticket.count({ where: { status: "CLOSED" } }),
    prisma.ticket.count({ where: { priority: "HIGH", status: { not: "CLOSED" } } }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="lux-card p-5">
        <h1 className="text-lg font-black text-[#e8e8e8] flex items-center gap-2">
          <TicketIcon className="w-5 h-5 text-[#d4af37]" />
          تیکت های پشتیبانی
        </h1>
        <p className="text-[#888] mt-1 text-xs">
          {toPersianDigits(openCount)} تیکت باز · {toPersianDigits(highPriorityCount)} اولویت بالا
        </p>
      </div>

      {/* آمار */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="lux-card p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "#3b82f615" }}>
            <Clock className="w-4 h-4" style={{ color: "#3b82f6" }} />
          </div>
          <div>
            <p className="text-lg font-bold text-[#e8e8e8]">{toPersianDigits(openCount)}</p>
            <p className="text-[10px] text-[#888]">تیکت باز</p>
          </div>
        </div>
        <div className="lux-card p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "#10b98115" }}>
            <CheckCircle className="w-4 h-4" style={{ color: "#10b981" }} />
          </div>
          <div>
            <p className="text-lg font-bold text-[#e8e8e8]">{toPersianDigits(answeredCount)}</p>
            <p className="text-[10px] text-[#888]">پاسخ داده شده</p>
          </div>
        </div>
        <div className="lux-card p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "#64748b15" }}>
            <CheckCircle className="w-4 h-4" style={{ color: "#64748b" }} />
          </div>
          <div>
            <p className="text-lg font-bold text-[#e8e8e8]">{toPersianDigits(closedCount)}</p>
            <p className="text-[10px] text-[#888]">بسته شده</p>
          </div>
        </div>
        <div className="lux-card p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "#ef444415" }}>
            <AlertTriangle className="w-4 h-4" style={{ color: "#ef4444" }} />
          </div>
          <div>
            <p className="text-lg font-bold text-[#e8e8e8]">{toPersianDigits(highPriorityCount)}</p>
            <p className="text-[10px] text-[#888]">اولویت بالا</p>
          </div>
        </div>
      </div>

      {/* فیلتر */}
      <div className="flex flex-wrap gap-2">
        <form method="GET" className="flex flex-wrap gap-2">
          <input type="hidden" name="page" value="1" />
          <select name="status" defaultValue={status || "ALL"} className="px-3 py-1.5 rounded-lg bg-[#0d0d0d] border border-[rgba(212,175,55,0.15)] text-[#e8e8e8] text-xs font-bold outline-none focus:border-[rgba(212,175,55,0.4)]">
            <option value="ALL">همه وضعیت ها</option>
            <option value="OPEN">باز</option>
            <option value="ANSWERED">پاسخ داده شده</option>
            <option value="CLOSED">بسته شده</option>
          </select>
          <select name="priority" defaultValue={priority || "ALL"} className="px-3 py-1.5 rounded-lg bg-[#0d0d0d] border border-[rgba(212,175,55,0.15)] text-[#e8e8e8] text-xs font-bold outline-none focus:border-[rgba(212,175,55,0.4)]">
            <option value="ALL">همه اولویت ها</option>
            <option value="LOW">کم</option>
            <option value="MEDIUM">متوسط</option>
            <option value="HIGH">زیاد</option>
          </select>
          <input
            type="text"
            name="search"
            defaultValue={search || ""}
            placeholder="جستجو..."
            className="px-3 py-1.5 rounded-lg bg-[#0d0d0d] border border-[rgba(212,175,55,0.15)] text-[#e8e8e8] text-xs outline-none w-40 focus:border-[rgba(212,175,55,0.4)]"
          />
          <button type="submit" className="px-4 py-1.5 rounded-lg lux-btn-gold text-xs font-bold">
            فیلتر
          </button>
        </form>
      </div>

      {/* لیست تیکت ها */}
      {tickets.length === 0 ? (
        <div className="text-center py-20">
          <TicketIcon className="w-12 h-12 text-[rgba(212,175,55,0.2)] mx-auto mb-3" />
          <p className="text-sm text-[#666]">تیکتی وجود ندارد</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tickets.map((ticket) => {
            const st = STATUS_LABELS[ticket.status] || STATUS_LABELS.OPEN;
            const pr = PRIORITY_LABELS[ticket.priority] || PRIORITY_LABELS.MEDIUM;
            const lastMsg = ticket.messages[0];
            return (
              <Link
                key={ticket.id}
                href={`/admin/tickets/${ticket.id}`}
                className="block lux-card p-4 hover:border-[rgba(212,175,55,0.3)] transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-bold text-[#e8e8e8] truncate">{ticket.subject}</span>
                    {ticket.priority === "HIGH" && ticket.status !== "CLOSED" && (
                      <AlertTriangle className="w-3.5 h-3.5 text-[#f87171] shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: `${st.color}15`, color: st.color }}
                    >
                      {st.label}
                    </span>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: `${pr.color}15`, color: pr.color }}
                    >
                      {pr.label}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    {ticket.user.photos?.[0]?.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={ticket.user.photos[0].url} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-[rgba(212,175,55,0.06)] shrink-0" />
                    )}
                    <span className="text-xs text-[#888] truncate">
                      {ticket.user.firstName} {ticket.user.lastName}
                    </span>
                    {ticket.category && (
                      <span className="text-[10px] text-[#d4af37] bg-[rgba(212,175,55,0.06)] px-2 py-0.5 rounded-full shrink-0">
                        {ticket.category}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-[#888] shrink-0">
                    {lastMsg ? formatDateTime(ticket.updatedAt) : formatDateTime(ticket.createdAt)}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <AdminPagination currentPage={page} totalPages={totalPages} totalItems={total} pageSize={PAGE_SIZE} />
    </div>
  );
}
