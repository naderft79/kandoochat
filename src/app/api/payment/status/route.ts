// API وضعیت پرداخت — برای polling وضعیت پرداخت کاربر
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get("paymentId");

    if (!paymentId) {
      return NextResponse.json({ error: "paymentId الزامی است" }, { status: 400 });
    }

    const payment = await prisma.paymentRequest.findUnique({
      where: { id: paymentId },
      select: {
        id: true,
        userId: true,
        type: true,
        status: true,
        amountToman: true,
        coins: true,
        authority: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!payment || payment.userId !== user.id) {
      return NextResponse.json({ error: "یافت نشد" }, { status: 404 });
    }

    return NextResponse.json({ payment });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[payment/status] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
