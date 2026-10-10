// API نوتیفیکیشن ها — دریافت و علامت گذاری خوانده شده
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth";
import { getActiveSubscription } from "@/lib/finance";
import { toPersianDigits } from "@/lib/format";

// اگر اشتراک کمتر از ۳ روز مانده باشد و قبلا اعلانش نیامده، اعلان بساز
async function maybeNotifySubscriptionEnding(userId: string) {
  try {
    const sub = await getActiveSubscription(userId);
    if (!sub) return;
    const msLeft = sub.endsAt.getTime() - Date.now();
    const daysLeft = Math.ceil(msLeft / (24 * 60 * 60 * 1000));
    if (daysLeft <= 0 || daysLeft > 3) return;
    const exists = await prisma.notification.findFirst({
      where: { userId, type: "SUBSCRIPTION_ENDING", data: { contains: sub.id } },
      select: { id: true },
    });
    if (exists) return;
    await prisma.notification.create({
      data: {
        userId,
        type: "SUBSCRIPTION_ENDING",
        title: "اشتراک رو به اتمام",
        body: `فقط ${toPersianDigits(daysLeft)} روز از اشتراک شما باقی مانده — برای قطع نشدن گفتگوها تمدید کنید`,
        data: JSON.stringify({ subscriptionId: sub.id }),
      },
    });
  } catch (err) {
    console.error("[notifications] sub-ending check failed:", err);
  }
}

export async function GET() {
  try {
    const user = await requireUser();
    await maybeNotifySubscriptionEnding(user.id);
    const [notifications, unreadCount, unreadConversations] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.notification.count({
        where: { userId: user.id, isRead: false },
      }),
      // تعداد گفتگوهایی که پیام نخوانده از طرف مقابل دارند
      prisma.message.findMany({
        where: {
          isRead: false,
          senderId: { not: user.id },
          conversation: {
            OR: [
              { userAId: user.id },
              { userBId: user.id },
            ],
          },
        },
        select: { conversationId: true },
        distinct: ["conversationId"],
      }),
    ]);

    return NextResponse.json({
      notifications,
      unreadCount,
      unreadConversations: unreadConversations.length,
    });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[notifications] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const all = searchParams.get("all");

    if (all === "true") {
      await prisma.notification.updateMany({
        where: { userId: user.id, isRead: false },
        data: { isRead: true },
      });
      return NextResponse.json({ ok: true });
    }

    const body = await request.json();
    const { id } = body as { id: string };
    if (!id) {
      return NextResponse.json({ error: "شناسه نوتیفیکیشن لازم است" }, { status: 400 });
    }
    await prisma.notification.updateMany({
      where: { id, userId: user.id },
      data: { isRead: true },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[notifications PATCH] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
