// API مدیریت بخش ویژه (ادمین): تایید یا رد درخواست ها، حذف از بخش ویژه
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, AuthError } from "@/lib/auth";
import { logAction } from "@/lib/audit";

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const { id, action } = await request.json();
    if (typeof id !== "string" || !["APPROVE", "REJECT", "REMOVE"].includes(action)) {
      return NextResponse.json({ error: "پارامتر نامعتبر" }, { status: 400 });
    }

    const listing = await prisma.featuredListing.findUnique({ where: { id } });
    if (!listing) return NextResponse.json({ error: "درخواست پیدا نشد" }, { status: 404 });

    if (action === "APPROVE") {
      if (listing.status !== "PENDING") return NextResponse.json({ error: "فقط درخواست در انتظار قابل تایید است" }, { status: 400 });
      await prisma.$transaction([
        prisma.featuredListing.update({ where: { id }, data: { status: "APPROVED", approvedAt: new Date() } }),
        prisma.notification.create({
          data: {
            userId: listing.userId,
            type: "FEATURED_APPROVED",
            title: "شما در بخش ویژه قرار گرفتید",
            body: "درخواست شما تایید شد و پروفایل شما اکنون در بخش ویژه نمایش داده می شود",
          },
        }),
      ]);
    } else {
      // رد درخواست در انتظار: سکه به کاربر برگردانده می شود. حذف تاییدشده بدون بازگشت سکه است
      const refund = action === "REJECT" && listing.status === "PENDING";
      if (action === "REJECT" && !refund) return NextResponse.json({ error: "فقط درخواست در انتظار قابل رد است" }, { status: 400 });
      await prisma.$transaction([
        prisma.featuredListing.update({ where: { id }, data: { status: "REJECTED" } }),
        ...(refund
          ? [
              prisma.wallet.update({ where: { userId: listing.userId }, data: { balance: { increment: listing.costCoins } } }),
              prisma.transaction.create({
                data: {
                  userId: listing.userId,
                  type: "ADMIN_ADJUST",
                  coins: listing.costCoins,
                  amountToman: 0,
                  status: "COMPLETED",
                  description: "بازگشت سکه درخواست بخش ویژه",
                },
              }),
            ]
          : []),
        prisma.notification.create({
          data: {
            userId: listing.userId,
            type: "FEATURED_REJECTED",
            title: refund ? "درخواست بخش ویژه رد شد" : "پروفایل شما از بخش ویژه خارج شد",
            body: refund ? "سکه پرداختی شما به کیف پول بازگردانده شد" : "پروفایل شما دیگر در بخش ویژه نمایش داده نمی شود",
          },
        }),
      ]);
    }

    await logAction(admin.id, `FEATURED_${action}`, "USER", listing.userId);
    console.log(`[admin/featured] admin ${admin.id} ${action} listing ${id}`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[admin/featured POST] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
