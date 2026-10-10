// API تیکت — مشاهده گفتگو و ارسال پیام
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth";
import { sanitizeTicketContent } from "@/lib/sanitize";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!ticket || ticket.userId !== user.id) {
      return NextResponse.json({ error: "تیکت یافت نشد" }, { status: 404 });
    }

    return NextResponse.json({ ticket });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[ticket GET] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = await req.json();
    const { content, attachments } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "متن پیام الزامی است" }, { status: 400 });
    }

    const ticket = await prisma.ticket.findUnique({ where: { id } });
    if (!ticket || ticket.userId !== user.id) {
      return NextResponse.json({ error: "تیکت یافت نشد" }, { status: 404 });
    }

    if (ticket.status === "CLOSED") {
      return NextResponse.json({ error: "تیکت بسته شده است" }, { status: 400 });
    }

    const message = await prisma.ticketMessage.create({
      data: {
        ticketId: id,
        senderId: user.id,
        content: sanitizeTicketContent(content),
        attachments: attachments ? JSON.stringify(attachments) : null,
        isFromAdmin: false,
      },
    });

    // به روز رسانی وضعیت تیکت به OPEN (کاربر پیام جدید فرستاده)
    await prisma.ticket.update({
      where: { id },
      data: { status: "OPEN" },
    });

    return NextResponse.json({ message });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[ticket POST] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
