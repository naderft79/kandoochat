// رسیدگی به برداشت ها: سبک اینستاگرام
import { Banknote } from "lucide-react";
import { prisma } from "@/lib/prisma";
import {
  formatCoins,
  formatToman,
  formatDateTime,
  toPersianDigits,
} from "@/lib/format";
import WithdrawActions from "@/components/admin/WithdrawActions";
import UserLink from "@/components/admin/user-modal/UserLink";

const statusLabels: Record<string, { text: string; cls: string }> = {
  PENDING: { text: "در انتظار", cls: "text-[#888]" },
  APPROVED: { text: "پرداخت شده", cls: "text-[#34d399]" },
  REJECTED: { text: "رد شده", cls: "text-[#f87171]" },
};

export default async function AdminWithdrawalsPage() {
  const requests = await prisma.withdrawRequest.findMany({
    include: {
      user: { select: { id: true, firstName: true, lastName: true, phone: true } },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 100,
  });

  const pending = requests.filter((r) => r.status === "PENDING");

  return (
    <div className="space-y-6">
      <div className="lux-card p-5">
        <h1 className="text-lg font-black text-[#e8e8e8] flex items-center gap-2">
          <Banknote className="w-5 h-5 text-[#d4af37]" />
          برداشت ها
        </h1>
        <p className="text-[#888] mt-1 text-xs">
          {toPersianDigits(pending.length)} درخواست در انتظار
        </p>
      </div>

      {requests.length === 0 ? (
        <p className="text-center text-[#888] py-10">هنوز درخواستی ثبت نشده است</p>
      ) : (
        <div className="space-y-2">
          {requests.map((r) => (
            <div
              key={r.id}
              className={`lux-card p-4 flex flex-col lg:flex-row lg:items-center gap-3 ${
                r.status === "PENDING" ? "border-[rgba(212,175,55,0.3)]" : ""
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[#e8e8e8] text-sm">
                  <UserLink userId={r.user.id}>{r.user.firstName} {r.user.lastName}</UserLink>
                  <span className="text-[#888] font-normal mr-2" dir="ltr">
                    {r.user.phone}
                  </span>
                </p>
                <p className="text-xs text-[#888] mt-1">
                  {formatCoins(r.coins)} معادل{" "}
                  <span className="font-bold text-[#d4af37]">{formatToman(r.amountToman)}</span> —
                  کارت: <span dir="ltr">{r.cardNumber}</span>
                </p>
                <p className="text-xs text-[#888] mt-1">
                  ثبت: {formatDateTime(r.createdAt)}
                  {r.processedAt && ` — رسیدگی: ${formatDateTime(r.processedAt)}`}
                  {r.adminNote && ` — یادداشت: ${r.adminNote}`}
                </p>
              </div>
              <div className="shrink-0">
                {r.status === "PENDING" ? (
                  <WithdrawActions requestId={r.id} />
                ) : (
                  <span className={`text-xs font-bold ${statusLabels[r.status]?.cls ?? ""}`}>
                    {statusLabels[r.status]?.text ?? r.status}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
