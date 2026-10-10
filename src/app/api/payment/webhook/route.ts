// Webhook پرداخت — دریافت نتیجه پرداخت از KandooPay (server-to-server)
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPaymentToken, fulfillPayment, failPayment } from "@/lib/payment";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, status, refId } = body;

    if (!token || !status) {
      return NextResponse.json({ error: "پارامترهای ناقص" }, { status: 400 });
    }

    let payload;
    try {
      payload = await verifyPaymentToken(token);
    } catch {
      return NextResponse.json({ error: "توکن نامعتبر" }, { status: 401 });
    }

    const payment = await prisma.paymentRequest.findUnique({
      where: { id: payload.paymentId },
    });

    if (!payment) {
      return NextResponse.json({ error: "پرداخت یافت نشد" }, { status: 404 });
    }

    if (payment.userId !== payload.userId || payment.amountToman !== payload.amountToman || payment.type !== payload.type) {
      console.error("[payment/webhook] token mismatch", { payload, payment });
      return NextResponse.json({ error: "توکن نامعتبر" }, { status: 401 });
    }

    if (status === "success") {
      await fulfillPayment(payment.id, refId);
    } else {
      const failStatus = status === "canceled" ? "CANCELLED" : "FAILED";
      await failPayment(payment.id, failStatus);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[payment/webhook] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
