// API مدیریت ریپورت ها (ادمین)
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, AuthError } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;

    const reports = await prisma.report.findMany({
      where: { ...(status ? { status } : {}) },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        reporter: { select: { id: true, firstName: true, lastName: true } },
        reported: { select: { id: true, firstName: true, lastName: true, phone: true, isActive: true } },
      },
    });

    return NextResponse.json({ reports });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[admin/reports GET] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

const actionSchema = z.object({
  reportId: z.string().min(1),
  action: z.enum(["RESOLVE", "DISMISS", "BAN"]),
  reportedUserId: z.string().min(1),
  adminNote: z.string().max(500).optional(),
});

export async function PATCH(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const parsed = actionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "اطلاعات نامعتبر است" }, { status: 400 });
    }

    const { reportId, action, reportedUserId, adminNote } = parsed.data;

    const report = await prisma.report.findUnique({ where: { id: reportId } });
    if (!report) {
      return NextResponse.json({ error: "گزارش یافت نشد" }, { status: 404 });
    }

    const statusMap: Record<string, string> = {
      RESOLVE: "REVIEWED",
      DISMISS: "DISMISSED",
      BAN: "ACTIONED",
    };

    await prisma.$transaction([
      prisma.report.update({
        where: { id: reportId },
        data: { status: statusMap[action], adminNote: adminNote ?? null },
      }),
      ...(action === "BAN"
        ? [prisma.user.update({
            where: { id: reportedUserId },
            data: { isActive: false },
          })]
        : []),
    ]);

    console.log(`[admin/reports] report ${reportId} -> ${action}`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[admin/reports PATCH] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
