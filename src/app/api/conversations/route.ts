// API شروع گفتگو با یک کاربر دیگر
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth";
import { hasActiveSubscription } from "@/lib/finance";
import { incrementMissionProgress } from "@/lib/missions";
import { rateLimitUser } from "@/lib/rate-limit";

const startSchema = z.object({
  targetUserId: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const parsed = startSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "درخواست نامعتبر" }, { status: 400 });
    }

    const target = await prisma.user.findUnique({
      where: { id: parsed.data.targetUserId },
    });
    if (!target || !target.isActive || target.role !== "USER") {
      return NextResponse.json({ error: "کاربر یافت نشد" }, { status: 404 });
    }
    if (target.id === user.id) {
      return NextResponse.json({ error: "درخواست نامعتبر" }, { status: 400 });
    }
    // فقط جنس مخالف و هم شهر
    if (target.gender === user.gender) {
      return NextResponse.json({ error: "امکان گفتگو وجود ندارد" }, { status: 403 });
    }

    // آی دی ها مرتب می شوند تا گفتگوی تکراری ساخته نشود
    const [userAId, userBId] = [user.id, target.id].sort();

    // اگر گفتگو از قبل وجود دارد، همان برگردانده می شود — بدون مصرف سهمیه محدودیت
    const existing = await prisma.conversation.findUnique({
      where: { userAId_userBId: { userAId, userBId } },
    });
    if (existing) {
      return NextResponse.json({ ok: true, conversationId: existing.id });
    }

    // سقف ساخت گفتگوی جدید: ۱۰۰ در ساعت
    const limited = await rateLimitUser(
      user.id,
      "conv-new",
      { windowMs: 60 * 60 * 1000, maxRequests: 100 },
      "به سقف ساخت گفتگوی جدید در هر ساعت رسیدید؛ لطفا بعدا تلاش کنید"
    );
    if (limited) return limited;

    // شرط تکمیل پروفایل حذف شد — گفتگو با هر پروفایلی آزاد است
    // فقط شروع کننده گفتگو باید اشتراک فعال داشته باشد
    const meSub = await hasActiveSubscription(user.id);
    if (!meSub) {
      return NextResponse.json(
        { error: "SUBSCRIPTION_REQUIRED" },
        { status: 402 }
      );
    }

    const conversation = await prisma.conversation.create({
      data: { userAId, userBId, startedBy: user.id },
    });

    // ماموریت اولین چت روز
    void incrementMissionProgress(user.id, "start_chat");

    return NextResponse.json({ ok: true, conversationId: conversation.id });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[conversations] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

// حذف گفتگو (soft delete — فقط علامت گذاری کاربر)
export async function DELETE(request: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId");
    if (!conversationId) {
      return NextResponse.json({ error: "شناسه گفتگو لازم است" }, { status: 400 });
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) {
      return NextResponse.json({ error: "گفتگو یافت نشد" }, { status: 404 });
    }
    if (conversation.userAId !== user.id && conversation.userBId !== user.id) {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    }

    const isUserA = conversation.userAId === user.id;
    const otherId = isUserA ? conversation.userBId : conversation.userAId;

    // گفتگو با پروفایل مدیریتی (پشتیبانی/اعلان های مدیر) قابل حذف نیست
    const other = await prisma.user.findUnique({
      where: { id: otherId },
      select: { isAdminProfile: true },
    });
    if (other?.isAdminProfile) {
      return NextResponse.json({ error: "گفتگو با مدیریت قابل حذف نیست" }, { status: 403 });
    }

    // علامت گذاری حذف برای این کاربر
    await prisma.conversation.update({
      where: { id: conversationId },
      data: isUserA ? { deletedByA: true } : { deletedByB: true },
    });

    // اگر هردو طرف حذف کرده باشند، حذف فیزیکی
    const updated = await prisma.conversation.findUnique({ where: { id: conversationId } });
    if (updated && updated.deletedByA && updated.deletedByB) {
      await prisma.message.deleteMany({ where: { conversationId } });
      await prisma.conversation.delete({ where: { id: conversationId } });
      console.log(`[conversations DELETE] both users deleted — physical delete: ${conversationId}`);
    } else {
      console.log(`[conversations DELETE] user ${user.id} soft-deleted conversation ${conversationId}`);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[conversations DELETE] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
