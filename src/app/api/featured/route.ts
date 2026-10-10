// API درخواست قرار گرفتن در بخش ویژه: خرید با سکه، لیست انتظار، بدون امکان لغو توسط کاربر
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth";
import { ensureWallet } from "@/lib/finance";
import { FEATURED_COST } from "@/lib/featured";

export async function GET() {
  try {
    const user = await requireUser();
    const listing = await prisma.featuredListing.findFirst({
      where: { userId: user.id, status: { in: ["PENDING", "APPROVED"] } },
      orderBy: { createdAt: "desc" },
      select: { status: true, createdAt: true, approvedAt: true },
    });
    return NextResponse.json({ listing, cost: FEATURED_COST });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[featured GET] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

export async function POST() {
  try {
    const user = await requireUser();
    await ensureWallet(user.id);

    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.featuredListing.findFirst({
        where: { userId: user.id, status: { in: ["PENDING", "APPROVED"] } },
      });
      if (existing) return { error: "درخواست شما قبلا ثبت شده است" };

      // کسر اتمی سکه: فقط اگر موجودی کافی باشد
      const dec = await tx.wallet.updateMany({
        where: { userId: user.id, balance: { gte: FEATURED_COST } },
        data: { balance: { decrement: FEATURED_COST } },
      });
      if (dec.count === 0) return { error: "موجودی سکه کافی نیست" };

      const listing = await tx.featuredListing.create({
        data: { userId: user.id, costCoins: FEATURED_COST },
        select: { status: true, createdAt: true },
      });
      await tx.transaction.create({
        data: {
          userId: user.id,
          type: "FEATURED_PURCHASE",
          coins: -FEATURED_COST,
          amountToman: 0,
          status: "COMPLETED",
          description: "درخواست قرار گرفتن در بخش ویژه",
        },
      });
      await tx.notification.create({
        data: {
          userId: user.id,
          type: "FEATURED_PENDING",
          title: "درخواست بخش ویژه ثبت شد",
          body: "درخواست شما در لیست انتظار است و پس از تایید مدیر در بخش ویژه نمایش داده می شود",
        },
      });
      return { listing };
    });

    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
    console.log(`[featured] user ${user.id} joined featured waitlist`);
    return NextResponse.json({ ok: true, listing: result.listing });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[featured POST] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
