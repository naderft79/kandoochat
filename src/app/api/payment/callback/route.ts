// API کال بک پرداخت — دریافت تایید از KandooPay و اعطای سکه/اشتراک
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPaymentToken, fulfillPayment, failPayment, sanitizeReturnPath } from "@/lib/payment";
import { SITE_URL } from "@/lib/site";

function redirectUrl(path: string, query?: Record<string, string>): string {
  const baseUrl = (process.env.KANDOO_PUBLIC_URL || SITE_URL).replace(/\/$/, "");
  const url = new URL(path, baseUrl);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null) url.searchParams.set(key, value);
    }
  }
  return url.toString();
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    const status = searchParams.get("status"); // success | failed | canceled
    const refId = searchParams.get("refId") || searchParams.get("trackId") || searchParams.get("Authority");

    if (!token) {
      return NextResponse.redirect(redirectUrl("/dashboard", { payment: "invalid" }));
    }

    let payload;
    try {
      payload = await verifyPaymentToken(token);
    } catch {
      return NextResponse.redirect(redirectUrl("/dashboard", { payment: "invalid" }));
    }

    const payment = await prisma.paymentRequest.findUnique({
      where: { id: payload.paymentId },
    });

    if (!payment) {
      return NextResponse.redirect(redirectUrl("/dashboard", { payment: "invalid" }));
    }

    if (payment.userId !== payload.userId || payment.amountToman !== payload.amountToman || payment.type !== payload.type) {
      console.error("[payment/callback] token mismatch", { payload, payment });
      return NextResponse.redirect(redirectUrl("/dashboard", { payment: "invalid" }));
    }

    const returnPath = sanitizeReturnPath(payload.returnPath);

    if (payment.status === "PAID") {
      return NextResponse.redirect(redirectUrl(returnPath, { payment: "already", type: payment.type }));
    }

    if (payment.status !== "PENDING") {
      return NextResponse.redirect(redirectUrl(returnPath, { payment: "failed", type: payment.type }));
    }

    if (status !== "success") {
      const failStatus = status === "canceled" ? "CANCELLED" : "FAILED";
      await failPayment(payment.id, failStatus);
      return NextResponse.redirect(redirectUrl(returnPath, { payment: "failed", type: payment.type }));
    }

    await fulfillPayment(payment.id, refId);
    return NextResponse.redirect(redirectUrl(returnPath, { payment: "success", type: payment.type, refId: refId ?? "" }));
  } catch (err) {
    console.error("[payment/callback] error:", err);
    return NextResponse.redirect(redirectUrl("/dashboard", { payment: "error" }));
  }
}
