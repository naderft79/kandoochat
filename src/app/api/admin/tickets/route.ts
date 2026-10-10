// API ادمین — لیست تیکت ها با فیلتر و تغییر وضعیت
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, AuthError } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;
    const priority = searchParams.get("priority") || undefined;
    const category = searchParams.get("category") || undefined;
    const search = searchParams.get("search") || undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");

    const where: Record<string, unknown> = {};
    if (status && status !== "ALL") where.status = status;
    if (priority && priority !== "ALL") where.priority = priority;
    if (category && category !== "ALL") where.category = category;
    if (search) {
      where.OR = [
        { subject: { contains: search } },
        { user: { firstName: { contains: search } } },
        { user: { lastName: { contains: search } } },
        { user: { username: { contains: search } } },
      ];
    }

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
              photos: { where: { isProfile: true, isDeletedByUser: false }, select: { url: true }, take: 1 },
            },
          },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      }),
      prisma.ticket.count({ where }),
    ]);

    // آمار
    const [openCount, answeredCount, closedCount, highPriorityCount] = await Promise.all([
      prisma.ticket.count({ where: { status: "OPEN" } }),
      prisma.ticket.count({ where: { status: "ANSWERED" } }),
      prisma.ticket.count({ where: { status: "CLOSED" } }),
      prisma.ticket.count({ where: { priority: "HIGH", status: { not: "CLOSED" } } }),
    ]);

    return NextResponse.json({
      tickets,
      total,
      page,
      pageSize,
      stats: { openCount, answeredCount, closedCount, highPriorityCount },
    });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[admin tickets GET] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const { id, status, priority, category } = body;

    if (!id) {
      return NextResponse.json({ error: "شناسه تیکت الزامی است" }, { status: 400 });
    }

    const ticket = await prisma.ticket.findUnique({ where: { id } });
    if (!ticket) {
      return NextResponse.json({ error: "تیکت یافت نشد" }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    if (status) data.status = status;
    if (priority) data.priority = priority;
    if (category !== undefined) data.category = category;

    const updated = await prisma.ticket.update({
      where: { id },
      data,
    });

    // ثبت لاگ
    await prisma.auditLog.create({
      data: {
        adminId: admin.id,
        action: "TICKET_UPDATE",
        targetType: "TICKET",
        targetId: id,
        details: JSON.stringify({ status, priority, category }),
      },
    });

    return NextResponse.json({ ticket: updated });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[admin tickets PUT] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
