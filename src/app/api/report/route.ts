// API گزارش تخلف کاربر
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth";
import { sanitizeString } from "@/lib/sanitize";

const reportSchema = z.object({
  reportedId: z.string().min(1),
  reason: z.enum(["HARASSMENT", "FAKE_PROFILE", "INAPPROPRIATE_CONTENT", "SCAM", "OTHER"]),
  details: z.string().max(500).optional(),
  messageId: z.string().min(1).optional(),
});

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const parsed = reportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "اطلاعات نامعتبر است" }, { status: 400 });
    }

    const { reportedId, reason, details, messageId } = parsed.data;
    if (reportedId === user.id) {
      return NextResponse.json({ error: "نمی توانید خودتان را گزارش کنید" }, { status: 400 });
    }

    const report = await prisma.report.create({
      data: {
        reporterId: user.id,
        reportedId,
        reason,
        details: details ? sanitizeString(details, 500) : null,
        messageId: messageId ?? null,
      },
    });

    console.log(`[report] user ${user.id} reported ${reportedId}: ${reason}`);
    return NextResponse.json({ ok: true, reportId: report.id });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[report] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
