// صفحه مدیریت گزارش های تخلف
import { prisma } from "@/lib/prisma";
import { formatDateTime, toPersianDigits } from "@/lib/format";
import { Flag } from "lucide-react";
import ReportActions from "@/components/admin/ReportActions";
import AdminPagination from "@/components/admin/AdminPagination";
import ExportButton from "@/components/admin/ExportButton";

const PAGE_SIZE = 20;

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10) || 1);

  const [reports, total] = await Promise.all([
    prisma.report.findMany({
      include: {
        reporter: { select: { id: true, firstName: true, lastName: true } },
        reported: { select: { id: true, firstName: true, lastName: true, isActive: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.report.count(),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const pending = reports.filter((r) => r.status === "PENDING");
  const resolved = reports.filter((r) => r.status !== "PENDING");

  return (
    <div className="space-y-6">
      <div className="lux-card p-5">
        <h1 className="text-lg font-black text-[#e8e8e8] flex items-center gap-2">
          <Flag className="w-5 h-5 text-[#d4af37]" />
          گزارش های تخلف
        </h1>
        <p className="text-[#888] mt-1 text-xs">
          {toPersianDigits(pending.length)} گزارش در انتظار رسیدگی
        </p>
        <div className="mt-2 flex justify-end">
          <ExportButton type="reports" label="خروجی CSV گزارش ها" />
        </div>
      </div>

      {pending.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-[#d4af37]">در انتظار رسیدگی</h2>
          {pending.map((r) => (
            <div key={r.id} className="lux-card p-4 animate-fade-in-up">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-bold text-[#e8e8e8]">
                    {r.reporter.firstName} {r.reporter.lastName}
                    <span className="text-[#888] font-normal"> → گزارش داد </span>
                    {r.reported.firstName} {r.reported.lastName}
                  </p>
                  <p className="text-xs text-[#888] mt-1">
                    نوع: {r.reason} · {formatDateTime(r.createdAt)}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                  r.reported.isActive ? "bg-[rgba(16,185,129,0.1)] text-[#34d399]" : "bg-[rgba(239,68,68,0.1)] text-[#f87171]"
                }`}>
                  {r.reported.isActive ? "فعال" : "غیرفعال"}
                </span>
              </div>
              {r.details && (
                <p className="text-sm text-[#e8e8e8] bg-[rgba(212,175,55,0.04)] border border-[rgba(212,175,55,0.08)] rounded-lg p-3 mt-2">
                  {r.details}
                </p>
              )}
              <ReportActions reportId={r.id} reportedUserId={r.reported.id} />
            </div>
          ))}
        </div>
      )}

      {resolved.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-[#d4af37]">رسیدگی شده</h2>
          {resolved.slice(0, 20).map((r) => (
            <div key={r.id} className="lux-card p-4 opacity-70">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-[#e8e8e8]">
                  {r.reporter.firstName} → {r.reported.firstName}
                </p>
                <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                  r.status === "RESOLVED" ? "bg-[rgba(16,185,129,0.1)] text-[#34d399]" :
                  r.status === "DISMISSED" ? "bg-[rgba(212,175,55,0.08)] text-[#888]" :
                  "bg-[rgba(239,68,68,0.1)] text-[#f87171]"
                }`}>
                  {r.status === "RESOLVED" ? "حل شد" : r.status === "DISMISSED" ? "رد شد" : "مسدود شد"}
                </span>
              </div>
              <p className="text-xs text-[#888] mt-1">{formatDateTime(r.createdAt)}</p>
            </div>
          ))}
        </div>
      )}

      {reports.length === 0 && (
        <div className="text-center py-20">
          <Flag className="w-12 h-12 text-[rgba(212,175,55,0.2)] mx-auto mb-3" />
          <p className="text-sm text-[#666]">هیچ گزارشی وجود ندارد</p>
        </div>
      )}

      <AdminPagination currentPage={page} totalPages={totalPages} totalItems={total} pageSize={PAGE_SIZE} />
    </div>
  );
}
