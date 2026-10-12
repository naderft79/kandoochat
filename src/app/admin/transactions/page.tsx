// تراکنش های مالی: سبک اینستاگرام
import { ReceiptText } from "lucide-react";
import { prisma } from "@/lib/prisma";
import UserLink from "@/components/admin/user-modal/UserLink";
import {
  formatCoins,
  formatToman,
  formatDateTime,
  toPersianDigits,
} from "@/lib/format";

const typeLabels: Record<string, string> = {
  COIN_PURCHASE: "خرید سکه",
  SUBSCRIPTION: "خرید اشتراک",
  WITHDRAW: "برداشت",
  ADMIN_ADJUST: "تغییر توسط مدیر",
};

const statusLabels: Record<string, { text: string; cls: string }> = {
  PENDING: { text: "در انتظار", cls: "text-[#888]" },
  COMPLETED: { text: "موفق", cls: "text-[#34d399]" },
  REJECTED: { text: "رد شده", cls: "text-[#f87171]" },
};

export default async function AdminTransactionsPage() {
  const transactions = await prisma.transaction.findMany({
    include: {
      user: { select: { id: true, firstName: true, lastName: true, phone: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-6">
      <div className="lux-card p-5">
        <h1 className="text-lg font-black text-[#e8e8e8] flex items-center gap-2">
          <ReceiptText className="w-5 h-5 text-[#d4af37]" />
          تراکنش ها
        </h1>
        <p className="text-[#888] mt-1 text-xs">
          {toPersianDigits(transactions.length)} تراکنش اخیر
        </p>
      </div>

      <div className="lux-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[rgba(212,175,55,0.04)] text-[#888] text-xs">
                <th className="p-3 text-right font-bold">کاربر</th>
                <th className="p-3 text-right font-bold">نوع</th>
                <th className="p-3 text-right font-bold">سکه</th>
                <th className="p-3 text-right font-bold">مبلغ</th>
                <th className="p-3 text-right font-bold">وضعیت</th>
                <th className="p-3 text-right font-bold">تاریخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(212,175,55,0.08)]">
              {transactions.map((t) => (
                <tr key={t.id} className="hover:bg-[rgba(212,175,55,0.03)]">
                  <td className="p-3">
                    <p className="font-bold text-[#e8e8e8] whitespace-nowrap text-sm">
                      <UserLink userId={t.user.id}>{t.user.firstName} {t.user.lastName}</UserLink>
                    </p>
                    <p className="text-xs text-[#888]" dir="ltr">
                      {t.user.phone}
                    </p>
                  </td>
                  <td className="p-3 whitespace-nowrap text-[#e8e8e8]">
                    {typeLabels[t.type] ?? t.type}
                  </td>
                  <td
                    className={`p-3 font-bold whitespace-nowrap ${
                      t.coins >= 0 ? "text-[#34d399]" : "text-[#f87171]"
                    }`}
                  >
                    {t.coins >= 0 ? "+" : ""}
                    {formatCoins(t.coins)}
                  </td>
                  <td className="p-3 whitespace-nowrap text-[#e8e8e8]">
                    {t.amountToman > 0 ? formatToman(t.amountToman) : "—"}
                  </td>
                  <td className="p-3">
                    <span className={`text-xs font-bold ${statusLabels[t.status]?.cls ?? ""}`}>
                      {statusLabels[t.status]?.text ?? t.status}
                    </span>
                  </td>
                  <td className="p-3 text-xs text-[#888] whitespace-nowrap">
                    {formatDateTime(t.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {transactions.length === 0 && (
          <p className="text-center text-[#888] py-10">تراکنشی وجود ندارد</p>
        )}
      </div>
    </div>
  );
}
