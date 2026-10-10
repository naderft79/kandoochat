// API پیام گروهی ادمین (broadcast)
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, AuthError } from "@/lib/auth";
import { sanitizeString } from "@/lib/sanitize";

const broadcastSchema = z.object({
  title: z.string().min(1).max(100),
  body: z.string().min(1).max(500),
});

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const parsed = broadcastSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "اطلاعات نامعتبر است" }, { status: 400 });
    }

    const { title, body: messageBody } = parsed.data;
    const cleanTitle = sanitizeString(title, 100);
    const cleanBody = sanitizeString(messageBody, 500);

    // دریافت همه کاربران فعال
    const users = await prisma.user.findMany({
      where: { isActive: true, role: "USER" },
      select: { id: true },
    });

    // ساخت نوتیفیکیشن برای همه
    await prisma.notification.createMany({
      data: users.map((u) => ({
        userId: u.id,
        type: "ADMIN_BROADCAST",
        title: cleanTitle,
        body: cleanBody,
      })),
    });

    console.log(`[admin/broadcast] admin ${admin.id} sent to ${users.length} users: ${cleanTitle}`);
    return NextResponse.json({ ok: true, sentCount: users.length });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[admin/broadcast] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
