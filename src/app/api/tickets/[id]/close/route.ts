// API بستن تیکت توسط کاربر
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const ticket = await prisma.ticket.findUnique({ where: { id } });
    if (!ticket || ticket.userId !== user.id) {
      return NextResponse.json({ error: "تیکت یافت نشد" }, { status: 404 });
    }

    await prisma.ticket.update({
      where: { id },
      data: { status: "CLOSED" },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[ticket close] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
