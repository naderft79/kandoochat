// API خروجی CSV برای پنل ادمین
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, AuthError } from "@/lib/auth";
import { generateCSV, csvToBlob } from "@/lib/export";

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "users";

    let csv = "";
    let filename = "";

    if (type === "users") {
      const users = await prisma.user.findMany({
        where: { role: "USER" },
        include: { wallet: true },
        orderBy: { createdAt: "desc" },
      });
      csv = generateCSV(
        [
          { key: "username", label: "نام کاربری" },
          { key: "firstName", label: "نام" },
          { key: "lastName", label: "نام خانوادگی" },
          { key: "phone", label: "شماره" },
          { key: "gender", label: "جنسیت" },
          { key: "age", label: "سن" },
          { key: "city", label: "شهر" },
          { key: "province", label: "استان" },
          { key: "isVerified", label: "تایید شده" },
          { key: "isActive", label: "فعال" },
          { key: "isSpecial", label: "ویژه" },
          { key: "balance", label: "سکه" },
          { key: "createdAt", label: "تاریخ عضویت" },
        ],
        users.map((u) => ({
          username: u.username,
          firstName: u.firstName,
          lastName: u.lastName,
          phone: u.phone,
          gender: u.gender === "MALE" ? "مرد" : "زن",
          age: u.age,
          city: u.city,
          province: u.province,
          isVerified: u.isVerified ? "بله" : "خیر",
          isActive: u.isActive ? "بله" : "خیر",
          isSpecial: u.isSpecial ? "بله" : "خیر",
          balance: u.wallet?.balance ?? 0,
          createdAt: new Date(u.createdAt).toLocaleDateString("fa-IR"),
        }))
      );
      filename = `users-${Date.now()}.csv`;
    } else if (type === "transactions") {
      const transactions = await prisma.transaction.findMany({
        include: { user: { select: { firstName: true, lastName: true, phone: true } } },
        orderBy: { createdAt: "desc" },
      });
      csv = generateCSV(
        [
          { key: "name", label: "نام" },
          { key: "phone", label: "شماره" },
          { key: "type", label: "نوع" },
          { key: "coins", label: "سکه" },
          { key: "amountToman", label: "مبلغ (تومان)" },
          { key: "status", label: "وضعیت" },
          { key: "description", label: "توضیحات" },
          { key: "createdAt", label: "تاریخ" },
        ],
        transactions.map((t) => ({
          name: `${t.user.firstName} ${t.user.lastName}`,
          phone: t.user.phone,
          type: t.type,
          coins: t.coins ?? "",
          amountToman: t.amountToman ?? "",
          status: t.status,
          description: t.description ?? "",
          createdAt: new Date(t.createdAt).toLocaleDateString("fa-IR"),
        }))
      );
      filename = `transactions-${Date.now()}.csv`;
    } else if (type === "reports") {
      const reports = await prisma.report.findMany({
        include: {
          reporter: { select: { firstName: true, lastName: true } },
          reported: { select: { firstName: true, lastName: true } },
        },
        orderBy: { createdAt: "desc" },
      });
      csv = generateCSV(
        [
          { key: "reporter", label: "گزارش دهنده" },
          { key: "reported", label: "گزارش شده" },
          { key: "reason", label: "دلیل" },
          { key: "status", label: "وضعیت" },
          { key: "details", label: "جزئیات" },
          { key: "createdAt", label: "تاریخ" },
        ],
        reports.map((r) => ({
          reporter: `${r.reporter.firstName} ${r.reporter.lastName}`,
          reported: `${r.reported.firstName} ${r.reported.lastName}`,
          reason: r.reason,
          status: r.status,
          details: r.details ?? "",
          createdAt: new Date(r.createdAt).toLocaleDateString("fa-IR"),
        }))
      );
      filename = `reports-${Date.now()}.csv`;
    } else if (type === "withdrawals") {
      const withdrawals = await prisma.withdrawRequest.findMany({
        include: { user: { select: { firstName: true, lastName: true, phone: true } } },
        orderBy: { createdAt: "desc" },
      });
      csv = generateCSV(
        [
          { key: "name", label: "نام" },
          { key: "phone", label: "شماره" },
          { key: "coins", label: "سکه" },
          { key: "amountToman", label: "مبلغ (تومان)" },
          { key: "cardNumber", label: "شماره کارت" },
          { key: "status", label: "وضعیت" },
          { key: "createdAt", label: "تاریخ" },
        ],
        withdrawals.map((w) => ({
          name: `${w.user.firstName} ${w.user.lastName}`,
          phone: w.user.phone,
          coins: w.coins,
          amountToman: w.amountToman,
          cardNumber: w.cardNumber,
          status: w.status,
          createdAt: new Date(w.createdAt).toLocaleDateString("fa-IR"),
        }))
      );
      filename = `withdrawals-${Date.now()}.csv`;
    } else {
      return NextResponse.json({ error: "نوع خروجی نامعتبر" }, { status: 400 });
    }

    const blob = csvToBlob(csv);
    const buffer = await blob.arrayBuffer();
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "text/csv;charset=utf-8;",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[admin export] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
