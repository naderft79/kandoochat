// API ادمین — مشاهده تیکت و پاسخ ادمین
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, AuthError } from "@/lib/auth";
import { sanitizeTicketContent } from "@/lib/sanitize";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            phone: true,
            photos: { where: { isProfile: true, isDeletedByUser: false }, select: { url: true }, take: 1 },
          },
        },
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: "تیکت یافت نشد" }, { status: 404 });
    }

    // ثبت لاگ مشاهده
    await prisma.auditLog.create({
      data: {
        adminId: admin.id,
        action: "TICKET_VIEW",
        targetType: "TICKET",
        targetId: id,
      },
    });

    return NextResponse.json({ ticket });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[admin ticket GET] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const { content, attachments } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "متن پاسخ الزامی است" }, { status: 400 });
    }

    const ticket = await prisma.ticket.findUnique({ where: { id } });
    if (!ticket) {
      return NextResponse.json({ error: "تیکت یافت نشد" }, { status: 404 });
    }

    if (ticket.status === "CLOSED") {
      return NextResponse.json({ error: "تیکت بسته شده است" }, { status: 400 });
    }

    const message = await prisma.ticketMessage.create({
      data: {
        ticketId: id,
        senderId: admin.id,
        content: sanitizeTicketContent(content),
        attachments: attachments ? JSON.stringify(attachments) : null,
        isFromAdmin: true,
      },
    });

    // تغییر وضعیت به ANSWERED
    await prisma.ticket.update({
      where: { id },
      data: { status: "ANSWERED" },
    });

    // ثبت لاگ
    await prisma.auditLog.create({
      data: {
        adminId: admin.id,
        action: "TICKET_REPLY",
        targetType: "TICKET",
        targetId: id,
      },
    });

    // ارسال نوتیفیکیشن به کاربر
    await prisma.notification.create({
      data: {
        userId: ticket.userId,
        type: "ADMIN_BROADCAST",
        title: "پاسخ تیکت پشتیبانی",
        body: `پاسخ جدید به تیکت «${ticket.subject}» دریافت کردید`,
        data: JSON.stringify({ ticketId: id }),
      },
    });

    return NextResponse.json({ message });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[admin ticket POST] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
