// API اخطار به کاربر توسط ادمین
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, AuthError } from "@/lib/auth";
import { sanitizeString } from "@/lib/sanitize";

const warnSchema = z.object({
  userId: z.string().min(1),
  reason: z.string().min(1).max(500),
});

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const parsed = warnSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "داده نامعتبر" }, { status: 400 });
    }

    // ثبت اخطار در Transaction
    await prisma.transaction.create({
      data: {
        userId: parsed.data.userId,
        type: "ADMIN_WARNING",
        coins: 0,
        amountToman: 0,
        status: "COMPLETED",
        description: `اخطار ادمین: ${sanitizeString(parsed.data.reason, 500)}`,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    }
    console.error("[admin/warn] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
