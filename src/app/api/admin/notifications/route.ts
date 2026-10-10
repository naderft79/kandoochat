// API نوتیفیکیشن های ادمین — لیست با فیلتر و صفحه بندی
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, AuthError } from "@/lib/auth";

const PAGE_SIZE = 20;

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const type = searchParams.get("type") || undefined;
    const userId = searchParams.get("userId") || undefined;
    const isRead = searchParams.get("isRead");

    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (userId) where.userId = userId;
    if (isRead === "true") where.isRead = true;
    if (isRead === "false") where.isRead = false;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
            },
          },
        },
      }),
      prisma.notification.count({ where }),
    ]);

    return NextResponse.json({
      notifications,
      total,
      page,
      totalPages: Math.ceil(total / PAGE_SIZE),
    });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[admin notifications API] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
