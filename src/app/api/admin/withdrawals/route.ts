// API رسیدگی به درخواست های برداشت توسط مدیر
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, AuthError } from "@/lib/auth";

const actionSchema = z.object({
  requestId: z.string().min(1),
  action: z.enum(["approve", "reject"]),
  adminNote: z.string().max(300).optional(),
});

export async function PATCH(request: Request) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const parsed = actionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "درخواست نامعتبر" }, { status: 400 });
    }
    const { requestId, action, adminNote } = parsed.data;

    const withdrawRequest = await prisma.withdrawRequest.findUnique({
      where: { id: requestId },
    });
    if (!withdrawRequest || withdrawRequest.status !== "PENDING") {
      return NextResponse.json(
        { error: "درخواست یافت نشد یا قبلا رسیدگی شده" },
        { status: 404 }
      );
    }

    if (action === "approve") {
      // تایید: سکه قبلا کسر شده، فقط وضعیت به روز می شود (واریز تومان خارج از سیستم انجام می شود)
      await prisma.$transaction([
        prisma.withdrawRequest.update({
          where: { id: requestId },
          data: { status: "APPROVED", adminNote, processedAt: new Date() },
        }),
        prisma.transaction.updateMany({
          where: {
            userId: withdrawRequest.userId,
            type: "WITHDRAW",
            status: "PENDING",
            coins: -withdrawRequest.coins,
          },
          data: { status: "COMPLETED" },
        }),
      ]);
    } else {
      // رد: سکه به کیف پول کاربر برمی گردد
      await prisma.$transaction([
        prisma.withdrawRequest.update({
          where: { id: requestId },
          data: { status: "REJECTED", adminNote, processedAt: new Date() },
        }),
        prisma.wallet.update({
          where: { userId: withdrawRequest.userId },
          data: { balance: { increment: withdrawRequest.coins } },
        }),
        prisma.transaction.updateMany({
          where: {
            userId: withdrawRequest.userId,
            type: "WITHDRAW",
            status: "PENDING",
            coins: -withdrawRequest.coins,
          },
          data: { status: "REJECTED" },
        }),
      ]);
    }

    console.log(`[admin] ${admin.id} ${action}ed withdraw request ${requestId}`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    console.error("[admin/withdrawals] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
