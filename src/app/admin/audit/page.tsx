// صفحه مشاهده لاگ اقدامات ادمین
import { prisma } from "@/lib/prisma";
import { toPersianDigits, formatDate } from "@/lib/format";
import { ScrollText } from "lucide-react";
import AdminPagination from "@/components/admin/AdminPagination";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 30;

const ACTION_LABELS: Record<string, string> = {
  VERIFY_PHONE: "تایید موبایل",
  UNVERIFY_PHONE: "لغو تایید موبایل",
  VERIFY_BADGE: "تیک آبی",
  UNVERIFY_BADGE: "لغو تیک آبی",
  ACTIVATE: "فعال سازی کاربر",
  DEACTIVATE: "مسدودسازی کاربر",
  MAKE_SPECIAL: "کاربر ویژه",
  UNMAKE_SPECIAL: "لغو ویژه",
  ADJUST_COINS: "تغییر سکه",
  RESET_PASSWORD: "ریست رمز عبور",
  APPROVE_PHOTO: "تایید عکس",
  REJECT_PHOTO: "رد عکس",
  IMPERSONATE: "ورود به پنل کاربر",
  UPDATE_REPORT: "بروزرسانی گزارش",
  UPDATE_SETTINGS: "تغییر تنظیمات",
};

const TARGET_LABELS: Record<string, string> = {
  USER: "کاربر",
  PHOTO: "عکس",
  REPORT: "گزارش",
  SETTING: "تنظیمات",
};

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10) || 1);

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      include: {
        admin: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.auditLog.count(),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="lux-card p-5">
        <h1 className="text-lg font-black text-[#e8e8e8] flex items-center gap-2">
          <ScrollText className="w-5 h-5 text-[#d4af37]" />
          لاگ اقدامات
        </h1>
        <p className="text-[#888] mt-1 text-xs">
          {toPersianDigits(total)} اقدام ثبت شده
        </p>
      </div>

      <div className="lux-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[rgba(212,175,55,0.04)] border-b border-[rgba(212,175,55,0.1)] text-right">
                <th className="px-4 py-3 font-bold text-[#888]">زمان</th>
                <th className="px-4 py-3 font-bold text-[#888]">ادمین</th>
                <th className="px-4 py-3 font-bold text-[#888]">اقدام</th>
                <th className="px-4 py-3 font-bold text-[#888]">نوع هدف</th>
                <th className="px-4 py-3 font-bold text-[#888]">شناسه هدف</th>
                <th className="px-4 py-3 font-bold text-[#888]">جزئیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(212,175,55,0.06)]">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-[#888]">
                    هنوز اقدامی ثبت نشده است
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[rgba(212,175,55,0.03)]">
                    <td className="px-4 py-2.5 text-[#e8e8e8] whitespace-nowrap">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="px-4 py-2.5 text-[#e8e8e8] whitespace-nowrap">
                      {log.admin.firstName} {log.admin.lastName}
                      <span className="text-[#888] block text-[10px]">@{log.admin.username}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[rgba(212,175,55,0.06)] text-[#d4af37] font-bold">
                        {ACTION_LABELS[log.action] ?? log.action}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-[#e8e8e8]">
                      {TARGET_LABELS[log.targetType] ?? log.targetType}
                    </td>
                    <td className="px-4 py-2.5 text-[#888] font-mono text-[10px]" dir="ltr">
                      {log.targetId ?? "-"}
                    </td>
                    <td className="px-4 py-2.5 text-[#888] max-w-xs truncate">
                      {log.details ?? "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AdminPagination currentPage={page} totalPages={totalPages} totalItems={total} pageSize={PAGE_SIZE} />
    </div>
  );
}
