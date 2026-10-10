"use client";

// پنل مالی ادمین با 4 تب: خریدها، برداشت‌ها، انتقالی‌ها، تراکنش‌ها
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Wallet, ShoppingCart, Banknote, ArrowLeftRight, ReceiptText, Check, X, Loader2, Download } from "lucide-react";
import { formatCoins, formatToman, formatDateTime } from "@/lib/format";

type Transaction = {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  phone: string;
  type: string;
  coins: number;
  amountToman: number;
  status: string;
  description: string | null;
  createdAt: string;
};

type WithdrawRequest = {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  phone: string;
  coins: number;
  amountToman: number;
  cardNumber: string;
  status: string;
  adminNote: string | null;
  createdAt: string;
  processedAt: string | null;
};

type CoinTransfer = {
  id: string;
  senderId: string;
  senderFirstName: string;
  senderLastName: string;
  senderPhone: string;
  receiverId: string;
  receiverFirstName: string;
  receiverLastName: string;
  receiverPhone: string;
  coins: number;
  fee: number;
  type: string;
  status: string;
  message: string | null;
  createdAt: string;
};

type Props = {
  transactions: Transaction[];
  withdrawRequests: WithdrawRequest[];
  coinTransfers: CoinTransfer[];
};

type Tab = "purchases" | "withdrawals" | "transfers" | "all";

const transactionTypeLabels: Record<string, string> = {
  COIN_PURCHASE: "خرید سکه",
  SUBSCRIPTION: "خرید اشتراک",
  WITHDRAW: "برداشت",
  ADMIN_ADJUST: "تغییر توسط مدیر",
  COIN_TRANSFER_OUT: "انتقال سکه (ارسالی)",
  COIN_TRANSFER_IN: "انتقال سکه (دریافتی)",
  COIN_TRANSFER_FEE: "کارمزد انتقال",
  BOOST_PURCHASE: "خرید بوست",
  GOLDEN_STORY: "استوری طلایی",
  FEATURED_PURCHASE: "بخش ویژه",
  REFERRAL_REWARD: "پاداش دعوت",
  STREAK_REWARD: "پاداش استریک",
};

const statusLabels: Record<string, { text: string; cls: string }> = {
  PENDING: { text: "در انتظار", cls: "text-[#d4af37]" },
  COMPLETED: { text: "موفق", cls: "text-[#34d399]" },
  REJECTED: { text: "رد شده", cls: "text-[#f87171]" },
  APPROVED: { text: "پرداخت شده", cls: "text-[#34d399]" },
};

const transferTypeLabels: Record<string, string> = {
  GIFT: "هدیه",
  REQUEST: "درخواست",
  REQUEST_APPROVED: "تایید درخواست",
  REQUEST_REJECTED: "رد درخواست",
};

export default function AdminFinanceClient({ transactions, withdrawRequests, coinTransfers }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("purchases");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const purchases = useMemo(
    () => transactions.filter((t) => t.type === "COIN_PURCHASE"),
    [transactions]
  );

  const allTransfersAsTransactions = useMemo(() => {
    const result: Transaction[] = [];
    coinTransfers.forEach((tr) => {
      result.push({
        id: `${tr.id}-out`,
        userId: tr.senderId,
        firstName: tr.senderFirstName,
        lastName: tr.senderLastName,
        phone: tr.senderPhone,
        type: "COIN_TRANSFER_OUT",
        coins: -tr.coins,
        amountToman: 0,
        status: tr.status,
        description: `به ${tr.receiverFirstName} ${tr.receiverLastName}${tr.message ? ` — ${tr.message}` : ""}`,
        createdAt: tr.createdAt,
      });
      result.push({
        id: `${tr.id}-in`,
        userId: tr.receiverId,
        firstName: tr.receiverFirstName,
        lastName: tr.receiverLastName,
        phone: tr.receiverPhone,
        type: "COIN_TRANSFER_IN",
        coins: tr.coins,
        amountToman: 0,
        status: tr.status,
        description: `از ${tr.senderFirstName} ${tr.senderLastName}${tr.message ? ` — ${tr.message}` : ""}`,
        createdAt: tr.createdAt,
      });
      if (tr.fee > 0) {
        result.push({
          id: `${tr.id}-fee`,
          userId: tr.senderId,
          firstName: tr.senderFirstName,
          lastName: tr.senderLastName,
          phone: tr.senderPhone,
          type: "COIN_TRANSFER_FEE",
          coins: -tr.fee,
          amountToman: 0,
          status: tr.status,
          description: "کارمزد انتقال",
          createdAt: tr.createdAt,
        });
      }
    });
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [coinTransfers]);

  async function handleWithdrawAction(requestId: string, action: "approve" | "reject") {
    const adminNote = action === "reject" ? prompt("دلیل رد درخواست (اختیاری):") ?? "" : "";
    setProcessingId(requestId);
    try {
      const res = await fetch("/api/admin/withdrawals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action, adminNote }),
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setProcessingId(null);
    }
  }

  const tabs: { key: Tab; label: string; icon: typeof Wallet; count?: number }[] = [
    { key: "purchases", label: "خریدها", icon: ShoppingCart, count: purchases.length },
    { key: "withdrawals", label: "برداشت‌ها", icon: Banknote, count: withdrawRequests.filter((r) => r.status === "PENDING").length },
    { key: "transfers", label: "انتقالی‌ها", icon: ArrowLeftRight, count: coinTransfers.length },
    { key: "all", label: "تراکنش‌ها", icon: ReceiptText, count: transactions.length },
  ];

  function renderTable(rows: Transaction[], showUser = true, showAmount = true) {
    return (
      <div className="lux-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[rgba(212,175,55,0.06)] text-[#d4af37] text-xs">
                {showUser && <th className="p-3 text-right font-bold">کاربر</th>}
                <th className="p-3 text-right font-bold">نوع</th>
                <th className="p-3 text-right font-bold">سکه</th>
                {showAmount && <th className="p-3 text-right font-bold">مبلغ</th>}
                <th className="p-3 text-right font-bold">وضعیت</th>
                <th className="p-3 text-right font-bold">تاریخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(212,175,55,0.08)]">
              {rows.map((t) => (
                <tr key={t.id} className="hover:bg-[rgba(212,175,55,0.04)]">
                  {showUser && (
                    <td className="p-3">
                      <p className="font-bold text-[#e8e8e8] whitespace-nowrap text-sm">
                        {t.firstName} {t.lastName}
                      </p>
                      <p className="text-xs text-[#888]" dir="ltr">
                        {t.phone}
                      </p>
                    </td>
                  )}
                  <td className="p-3 whitespace-nowrap text-[#e8e8e8]">
                    {transactionTypeLabels[t.type] ?? t.type}
                  </td>
                  <td
                    className={`p-3 font-bold whitespace-nowrap ${
                      t.coins >= 0 ? "text-[#34d399]" : "text-[#f87171]"
                    }`}
                  >
                    {t.coins >= 0 ? "+" : ""}
                    {formatCoins(t.coins)}
                  </td>
                  {showAmount && (
                    <td className="p-3 whitespace-nowrap text-[#e8e8e8]">
                      {t.amountToman > 0 ? formatToman(t.amountToman) : "—"}
                    </td>
                  )}
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
        {rows.length === 0 && (
          <p className="text-center text-[#666] py-10">موردی وجود ندارد</p>
        )}
      </div>
    );
  }

  function renderWithdrawals() {
    return (
      <div className="space-y-2">
        {withdrawRequests.map((r) => (
          <div
            key={r.id}
            className={`lux-card p-4 flex flex-col lg:flex-row lg:items-center gap-3 ${
              r.status === "PENDING" ? "border-[rgba(212,175,55,0.25)]" : ""
            }`}
          >
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[#e8e8e8] text-sm">
                {r.firstName} {r.lastName}
                <span className="text-[#888] font-normal mr-2" dir="ltr">
                  {r.phone}
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
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleWithdrawAction(r.id, "approve")}
                    disabled={processingId === r.id}
                    className="px-4 py-2 rounded-lg lux-btn-gold text-xs font-bold disabled:opacity-50 flex items-center gap-1"
                  >
                    {processingId === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    تایید و پرداخت شد
                  </button>
                  <button
                    onClick={() => handleWithdrawAction(r.id, "reject")}
                    disabled={processingId === r.id}
                    className="px-4 py-2 rounded-lg bg-[rgba(239,68,68,0.1)] text-[#f87171] border border-[rgba(239,68,68,0.2)] text-xs font-bold hover:bg-[rgba(239,68,68,0.15)] transition-all disabled:opacity-50 flex items-center gap-1"
                  >
                    <X className="w-4 h-4" />
                    رد و بازگشت سکه
                  </button>
                </div>
              ) : (
                <span className={`text-xs font-bold ${statusLabels[r.status]?.cls ?? ""}`}>
                  {statusLabels[r.status]?.text ?? r.status}
                </span>
              )}
            </div>
          </div>
        ))}
        {withdrawRequests.length === 0 && (
          <p className="text-center text-[#666] py-10">درخواستی وجود ندارد</p>
        )}
      </div>
    );
  }

  function renderTransfers() {
    return (
      <div className="lux-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[rgba(212,175,55,0.06)] text-[#d4af37] text-xs">
                <th className="p-3 text-right font-bold">ارسال کننده</th>
                <th className="p-3 text-right font-bold">دریافت کننده</th>
                <th className="p-3 text-right font-bold">سکه</th>
                <th className="p-3 text-right font-bold">کارمزد</th>
                <th className="p-3 text-right font-bold">نوع</th>
                <th className="p-3 text-right font-bold">وضعیت</th>
                <th className="p-3 text-right font-bold">تاریخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(212,175,55,0.08)]">
              {coinTransfers.map((t) => (
                <tr key={t.id} className="hover:bg-[rgba(212,175,55,0.04)]">
                  <td className="p-3 whitespace-nowrap text-[#e8e8e8] text-xs">
                    {t.senderFirstName} {t.senderLastName}
                    <p className="text-[#888]" dir="ltr">{t.senderPhone}</p>
                  </td>
                  <td className="p-3 whitespace-nowrap text-[#e8e8e8] text-xs">
                    {t.receiverFirstName} {t.receiverLastName}
                    <p className="text-[#888]" dir="ltr">{t.receiverPhone}</p>
                  </td>
                  <td className="p-3 font-bold whitespace-nowrap text-[#34d399]">
                    +{formatCoins(t.coins)}
                  </td>
                  <td className="p-3 font-bold whitespace-nowrap text-[#f87171]">
                    {t.fee > 0 ? formatCoins(t.fee) : "—"}
                  </td>
                  <td className="p-3 whitespace-nowrap text-[#e8e8e8] text-xs">
                    {transferTypeLabels[t.type] ?? t.type}
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
        {coinTransfers.length === 0 && (
          <p className="text-center text-[#666] py-10">انتقالی وجود ندارد</p>
        )}
      </div>
    );
  }

  const pendingWithdrawals = withdrawRequests.filter((r) => r.status === "PENDING").length;
  const completedTransactions = transactions.filter((t) => t.status === "COMPLETED").length;
  const totalRevenue = transactions
    .filter((t) => t.type === "COIN_PURCHASE" && t.status === "COMPLETED")
    .reduce((sum, t) => sum + (t.amountToman || 0), 0);

  const stats = {
    total: transactions.length,
    pending: pendingWithdrawals,
    completed: completedTransactions,
    revenue: totalRevenue,
  };

  return (
    <div className="space-y-4">
      {/* هدر + آمار */}
      <div className="lux-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-black text-[#e8e8e8] flex items-center gap-2">
              <Wallet className="w-5 h-5 text-[#d4af37]" />
              مالی
            </h1>
            <p className="text-[#888] mt-1 text-xs">مدیریت خریدها، برداشت ها، انتقالی ها و تراکنش ها</p>
          </div>
          <div className="hidden sm:flex gap-2">
            <div className="lux-card px-3 py-2 text-center min-w-[80px]">
              <p className="text-[10px] text-[#888]">در انتظار برداشت</p>
              <p className="text-sm font-black text-[#f87171]">{stats.pending}</p>
            </div>
            <div className="lux-card px-3 py-2 text-center min-w-[80px]">
              <p className="text-[10px] text-[#888]">تکمیل شده</p>
              <p className="text-sm font-black text-[#4ade80]">{stats.completed}</p>
            </div>
            <div className="lux-card px-3 py-2 text-center min-w-[80px]">
              <p className="text-[10px] text-[#888]">کل تراکنش ها</p>
              <p className="text-sm font-black text-[#d4af37]">{stats.total}</p>
            </div>
            <div className="flex flex-col gap-1 justify-center">
              <a href="/api/admin/export?type=transactions" className="px-3 py-1.5 rounded-lg lux-btn-outline text-[10px] font-bold flex items-center gap-1">
                <Download className="w-3 h-3" />
                تراکنش ها
              </a>
              <a href="/api/admin/export?type=withdrawals" className="px-3 py-1.5 rounded-lg lux-btn-outline text-[10px] font-bold flex items-center gap-1">
                <Download className="w-3 h-3" />
                برداشت ها
              </a>
            </div>
          </div>
        </div>
        <div className="flex sm:hidden gap-2 mt-3">
          <div className="flex-1 lux-card px-2 py-1.5 text-center">
            <p className="text-[9px] text-[#888]">در انتظار</p>
            <p className="text-xs font-black text-[#f87171]">{stats.pending}</p>
          </div>
          <div className="flex-1 lux-card px-2 py-1.5 text-center">
            <p className="text-[9px] text-[#888]">تکمیل شده</p>
            <p className="text-xs font-black text-[#4ade80]">{stats.completed}</p>
          </div>
          <div className="flex-1 lux-card px-2 py-1.5 text-center">
            <p className="text-[9px] text-[#888]">کل</p>
            <p className="text-xs font-black text-[#d4af37]">{stats.total}</p>
          </div>
        </div>
      </div>

      {/* تب ها */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {tabs.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                active ? "lux-btn-gold border-transparent" : "lux-card text-[#888] hover:text-[#d4af37]"
              }`}
            >
              <t.icon className="w-4 h-4" strokeWidth={2} />
              {t.label}
              {t.count ? (
                <span className="px-1.5 py-0.5 rounded-full bg-[rgba(212,175,55,0.15)] text-[#d4af37] text-[9px]">
                  {t.count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {tab === "purchases" && renderTable(purchases)}
      {tab === "withdrawals" && renderWithdrawals()}
      {tab === "transfers" && renderTransfers()}
      {tab === "all" && renderTable(transactions)}
    </div>
  );
}
