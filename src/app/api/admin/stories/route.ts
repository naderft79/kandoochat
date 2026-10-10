// API ادمین: مدیریت استوری ها — لیست استوری های در انتظار + تایید/رد
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, AuthError } from "@/lib/auth";
import { logAction } from "@/lib/audit";
import { sendAdminMessage } from "@/lib/adminProfile";

// GET — لیست استوری های در انتظار تایید
export async function GET(request: Request) {
  try {
    const admin = await requireAdmin();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") ?? "pending";
    const now = new Date();

    const where = {
      ...(status === "pending" ? { isApproved: false, isRejected: false, isDeletedByUser: false } : {}),
      ...(status === "approved" ? { isApproved: true, isDeletedByUser: false } : {}),
      ...(status === "rejected" ? { isRejected: true, isDeletedByUser: false } : {}),
      ...(status === "deleted" ? { isDeletedByUser: true } : {}),
      ...(status === "expired" ? { expiresAt: { lt: now }, isDeletedByUser: false } : {}),
      ...(status === "all" ? { isDeletedByUser: false } : {}),
      ...(status !== "expired" ? { expiresAt: { gt: now } } : {}),
    };

    // اجرای همزمان: استوری ها + آمار
    const [stories, total, pending, approved, rejected, deleted, expired] = await Promise.all([
      prisma.story.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true, firstName: true, lastName: true, username: true, phone: true,
              isVerified: true, gender: true,
              photos: { select: { url: true, order: true, isProfile: true }, where: { isDeletedByUser: false }, orderBy: { order: "asc" }, take: 1 },
            },
          },
          _count: { select: { views: true, likes: true, replies: true } },
        },
        take: 100,
      }),
      prisma.story.count({ where: { expiresAt: { gt: now }, isDeletedByUser: false } }),
      prisma.story.count({ where: { expiresAt: { gt: now }, isApproved: false, isRejected: false, isDeletedByUser: false } }),
      prisma.story.count({ where: { expiresAt: { gt: now }, isApproved: true, isDeletedByUser: false } }),
      prisma.story.count({ where: { expiresAt: { gt: now }, isRejected: true, isDeletedByUser: false } }),
      prisma.story.count({ where: { isDeletedByUser: true } }),
      prisma.story.count({ where: { expiresAt: { lt: now }, isDeletedByUser: false } }),
    ]);

    return NextResponse.json({
      stories,
      stats: { total, pending, approved, rejected, deleted, expired },
    });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[admin stories GET] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

// PATCH — تایید یا رد استوری
export async function PATCH(request: Request) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const { storyId, action, reason } = body as { storyId: string; action: "approve" | "reject"; reason?: string };

    if (!storyId || !action) {
      return NextResponse.json({ error: "پارامترهای نامعتبر" }, { status: 400 });
    }

    const story = await prisma.story.findUnique({ where: { id: storyId } });
    if (!story) {
      return NextResponse.json({ error: "استوری یافت نشد" }, { status: 404 });
    }

    if (action === "approve") {
      await prisma.story.update({ where: { id: storyId }, data: { isApproved: true } });
      await logAction(admin.id, "APPROVE_STORY", "STORY", storyId, `Story approved for user ${story.userId}`);
      return NextResponse.json({ ok: true, approved: true });
    } else {
      // رد استوری — حذف نمی شود، فقط علامت گذاری می شود
      await prisma.story.update({ where: { id: storyId }, data: { isRejected: true, rejectReason: reason ?? null } });
      await logAction(admin.id, "REJECT_STORY", "STORY", storyId, `Story rejected for user ${story.userId}`);

      // ارسال پیام مدیریتی به کاربر با دلیل رد
      if (reason) {
        const adminMsg = `سلام،\n\nاستوری شما در سایت کندو بررسی شد و متاسفانه تایید نشد.\n\nدلیل رد شدن:\n${reason}\n\nلطفا با رعایت قوانین سایت، استوری جدید و بدون مشکل منتشر کنید تا تایید شود. در صورت داشتن سوال می توانید با پشتیبانی در ارتباط باشید.\n\nبا احترام،\nتیم مدیریت کندو`;
        await sendAdminMessage(story.userId, adminMsg);
      }

      return NextResponse.json({ ok: true, rejected: true });
    }
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[admin stories PATCH] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
