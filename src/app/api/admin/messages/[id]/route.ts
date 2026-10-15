// API حذف پیام توسط ادمین
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, AuthError } from "@/lib/auth";
import { unlink } from "fs/promises";
import path from "path";
import { localKeyFromUrl } from "@/lib/storage";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const message = await prisma.message.findUnique({ where: { id } });
    if (!message) {
      return NextResponse.json({ error: "پیام یافت نشد" }, { status: 404 });
    }

    // حذف فایل از سرور در صورت وجود — هر دو قالب URL محلی
    const localKey = message.mediaUrl ? localKeyFromUrl(message.mediaUrl) : null;
    if (localKey) {
      const filePath = path.join(process.cwd(), "public", "uploads", localKey);
      try {
        await unlink(filePath);
      } catch {
        // فایل ممکن است وجود نداشته باشد
      }
    }

    await prisma.message.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    }
    console.error("[admin/messages DELETE] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
