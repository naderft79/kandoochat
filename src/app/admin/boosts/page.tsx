// صفحه مدیریت بوست ها
import { prisma } from "@/lib/prisma";
import { formatDateTime, toPersianDigits } from "@/lib/format";
import { Rocket } from "lucide-react";
import AdminPagination from "@/components/admin/AdminPagination";
import UserLink from "@/components/admin/user-modal/UserLink";

const PAGE_SIZE = 20;

export default async function AdminBoostsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10) || 1);
  const now = new Date();
  const [activeBoosts, allBoosts, total] = await Promise.all([
    prisma.boost.findMany({
      where: { endsAt: { gt: now } },
      include: { user: { select: { id: true, firstName: true, lastName: true, city: true } } },
      orderBy: { endsAt: "asc" },
    }),
    prisma.boost.findMany({
      include: { user: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { startsAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.boost.count(),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="lux-card p-5">
        <h1 className="text-lg font-black text-[#e8e8e8] flex items-center gap-2">
          <Rocket className="w-5 h-5 text-[#d4af37]" />
          بوست های پروفایل
        </h1>
        <p className="text-[#888] mt-1 text-xs">
          {toPersianDigits(activeBoosts.length)} بوست فعال
        </p>
      </div>

      {activeBoosts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-[#d4af37]">بوست های فعال</h2>
          {activeBoosts.map((b) => {
            const remaining = Math.max(0, b.endsAt.getTime() - now.getTime());
            const minutes = Math.floor(remaining / 60000);
            return (
              <div key={b.id} className="lux-card p-4 border-[rgba(212,175,55,0.2)]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-[#e8e8e8]">
                      <UserLink userId={b.user.id}>{b.user.firstName} {b.user.lastName}</UserLink>
                    </p>
                    <p className="text-xs text-[#888]">{b.user.city}</p>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-[#d4af37]">
                      {toPersianDigits(minutes)} دقیقه باقی مانده
                    </p>
                    <p className="text-xs text-[#888]">{formatDateTime(b.endsAt)}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-sm font-bold text-[#d4af37]">تاریخچه بوست ها</h2>
        {allBoosts.map((b) => (
          <div key={b.id} className="lux-card p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-[#e8e8e8]">
                <UserLink userId={b.user.id}>{b.user.firstName} {b.user.lastName}</UserLink>
              </p>
              <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                b.endsAt > now ? "bg-[rgba(16,185,129,0.1)] text-[#34d399]" : "bg-[rgba(212,175,55,0.08)] text-[#888]"
              }`}>
                {b.endsAt > now ? "فعال" : "منقضی"}
              </span>
            </div>
            <p className="text-xs text-[#888] mt-1">
              شروع: {formatDateTime(b.startsAt)} · پایان: {formatDateTime(b.endsAt)}
            </p>
          </div>
        ))}
      </div>

      <AdminPagination currentPage={page} totalPages={totalPages} totalItems={total} pageSize={PAGE_SIZE} />
    </div>
  );
}
