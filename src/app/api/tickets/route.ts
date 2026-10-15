// API تیکت پشتیبانی — لیست و ساخت تیکت
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth";
import { sanitizeSubject, sanitizeTicketContent } from "@/lib/sanitize";
import { rateLimitUser } from "@/lib/rate-limit";

const CATEGORIES = ["عمومی", "مالی", "فنی", "امنیت", "حساب کاربری"];

export async function GET() {
  try {
    const user = await requireUser();
    const tickets = await prisma.ticket.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });
    return NextResponse.json({ tickets });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[tickets GET] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    // سقف ساخت تیکت جدید: ۵ در روز
    const limited = await rateLimitUser(
      user.id,
      "ticket-create",
      { windowMs: 24 * 60 * 60 * 1000, maxRequests: 5 },
      "به سقف ثبت تیکت در هر روز رسیدید (۵ تیکت)؛ لطفا فردا تلاش کنید"
    );
    if (limited) return limited;
    const body = await req.json();
    const { subject, category, content } = body;

    if (!subject || !subject.trim() || !content || !content.trim()) {
      return NextResponse.json({ error: "موضوع و متن پیام الزامی است" }, { status: 400 });
    }

    if (category && !CATEGORIES.includes(category)) {
      return NextResponse.json({ error: "دسته بندی نامعتبر" }, { status: 400 });
    }

    const ticket = await prisma.ticket.create({
      data: {
        userId: user.id,
        subject: sanitizeSubject(subject),
        category: category || null,
        messages: {
          create: {
            senderId: user.id,
            content: sanitizeTicketContent(content),
            isFromAdmin: false,
          },
        },
      },
      include: { messages: true },
    });

    return NextResponse.json({ ticket });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[tickets POST] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
