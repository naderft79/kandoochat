// صفحه مدیریت مالی: خریدها، برداشت‌ها، انتقالی‌ها، تراکنش‌ها
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, SUPER_ADMIN_ROLE } from "@/lib/auth";
import AdminFinanceClient from "@/components/admin/AdminFinanceClient";

export const dynamic = "force-dynamic";

export default async function AdminFinancePage() {
  const user = await getCurrentUser();
  if (!user || user.role !== SUPER_ADMIN_ROLE) redirect("/dashboard");

  const [transactions, withdrawRequests, coinTransfers] = await Promise.all([
    prisma.transaction.findMany({
      include: {
        user: { select: { id: true, firstName: true, lastName: true, phone: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.withdrawRequest.findMany({
      include: {
        user: { select: { id: true, firstName: true, lastName: true, phone: true } },
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 100,
    }),
    prisma.coinTransfer.findMany({
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, phone: true } },
        receiver: { select: { id: true, firstName: true, lastName: true, phone: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
  ]);

  const serializedTransactions = transactions.map((t) => ({
    id: t.id,
    userId: t.userId,
    firstName: t.user.firstName,
    lastName: t.user.lastName,
    phone: t.user.phone,
    type: t.type,
    coins: t.coins,
    amountToman: t.amountToman,
    status: t.status,
    description: t.description,
    createdAt: t.createdAt.toISOString(),
  }));

  const serializedWithdrawRequests = withdrawRequests.map((r) => ({
    id: r.id,
    userId: r.userId,
    firstName: r.user.firstName,
    lastName: r.user.lastName,
    phone: r.user.phone,
    coins: r.coins,
    amountToman: r.amountToman,
    cardNumber: r.cardNumber,
    status: r.status,
    adminNote: r.adminNote,
    createdAt: r.createdAt.toISOString(),
    processedAt: r.processedAt ? r.processedAt.toISOString() : null,
  }));

  const serializedCoinTransfers = coinTransfers.map((t) => ({
    id: t.id,
    senderId: t.senderId,
    senderFirstName: t.sender.firstName,
    senderLastName: t.sender.lastName,
    senderPhone: t.sender.phone,
    receiverId: t.receiverId,
    receiverFirstName: t.receiver.firstName,
    receiverLastName: t.receiver.lastName,
    receiverPhone: t.receiver.phone,
    coins: t.coins,
    fee: t.fee,
    type: t.type,
    status: t.status,
    message: t.message,
    createdAt: t.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-4">
      <AdminFinanceClient
        transactions={serializedTransactions}
        withdrawRequests={serializedWithdrawRequests}
        coinTransfers={serializedCoinTransfers}
      />
    </div>
  );
}
