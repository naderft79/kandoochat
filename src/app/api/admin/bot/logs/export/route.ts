// API خروجی CSV از لاگ‌های ربات
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, AuthError } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    throw e;
  }

  const { searchParams } = new URL(request.url);
  const botType = searchParams.get("botType");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: Record<string, unknown> = {};
  if (botType) where.botType = botType;
  if (from || to) {
    const dateFilter: Record<string, Date> = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) dateFilter.lte = new Date(to);
    where.createdAt = dateFilter;
  }

  const logs = await prisma.botLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 5000,
  });

  // ساخت CSV
  const headers = ["id", "botType", "senderId", "targetId", "templateId", "category", "status", "detail", "conversationStep", "engagementScore", "createdAt"];
  const rows = logs.map((l) =>
    [l.id, l.botType, l.senderId ?? "", l.targetId ?? "", l.templateId ?? "", l.category ?? "", l.status, l.detail ?? "", l.conversationStep ?? "", l.engagementScore ?? "", l.createdAt.toISOString()]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",")
  );

  const csv = [headers.join(","), ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="bot-logs-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
