// API پیام ها: دریافت (polling) و ارسال با قفل اشتراک
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth";
import { hasActiveSubscription } from "@/lib/finance";
import { broadcastNewMessage, broadcastNewPhoto } from "@/lib/liveChatEvents";
import { sanitizeMessage } from "@/lib/sanitize";
import { isHaniUser, generateHaniReply } from "@/lib/aiCompanion";
import { sendPushToUser } from "@/lib/push";
import { publishToConversation } from "@/lib/chatEvents";
import { incrementMissionProgress } from "@/lib/missions";
import { getTransferStatuses } from "@/lib/transferStatus";
import { rateLimitUser } from "@/lib/rate-limit";

// بررسی عضویت کاربر در گفتگو
async function getConversationForUser(conversationId: string, userId: string) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
  });
  if (!conversation) return null;
  if (conversation.userAId !== userId && conversation.userBId !== userId)
    return null;
  return conversation;
}

// دریافت پیام های جدید
export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId") ?? "";
    const after = searchParams.get("after");
    const before = searchParams.get("before");
    const includeReadStatus = searchParams.get("includeReadStatus") === "true";

    const conversation = await getConversationForUser(conversationId, user.id);
    if (!conversation) {
      return NextResponse.json({ error: "گفتگو یافت نشد" }, { status: 404 });
    }

    const otherUserId =
      conversation.userAId === user.id
        ? conversation.userBId
        : conversation.userAId;

    // پیام های خوانده نشده طرف مقابل — برای اطلاع رسانی read receipt
    const unreadFromOther = await prisma.message.findMany({
      where: { conversationId, senderId: { not: user.id }, isRead: false },
      select: { id: true },
    });
    const unreadIds = unreadFromOther.map((m) => m.id);

    // اجرای همزمان query ها برای کاهش زمان کل
    // before: صفحه بندی پیام های قدیمی تر (desc گرفته و asc برمی گردانیم)
    const [rawMessages, , readMessages, otherUser] = await Promise.all([
      prisma.message.findMany({
        where: {
          conversationId,
          ...(after ? { createdAt: { gt: new Date(after) } } : {}),
          ...(before ? { createdAt: { lt: new Date(before) } } : {}),
        },
        orderBy: { createdAt: before ? "desc" : "asc" },
        take: before ? 51 : 100,
        include: {
          replyTo: { select: { id: true, content: true, type: true, senderId: true } },
        },
      }),
      // علامت گذاری پیام های طرف مقابل به عنوان خوانده شده
      unreadIds.length
        ? prisma.message.updateMany({
            where: { id: { in: unreadIds } },
            data: { isRead: true },
          })
        : Promise.resolve({ count: 0 }),
      // پیام های خودمان که خوانده شده اند
      includeReadStatus
        ? prisma.message.findMany({
            where: { conversationId, senderId: user.id, isRead: true },
            select: { id: true },
            take: 50,
            orderBy: { createdAt: "desc" },
          })
        : Promise.resolve([]),
      // بررسی وضعیت تایپ طرف مقابل
      prisma.user.findUnique({
        where: { id: otherUserId },
        select: { isTyping: true, typingConversationId: true },
      }),
    ]);

    // اطلاع رسانی read receipt به SSE listener ها
    if (unreadIds.length) {
      publishToConversation(conversationId, "read", { messageIds: unreadIds, byUserId: user.id });
    }

    const hasMore = before ? rawMessages.length > 50 : false;
    const messages = before ? rawMessages.slice(0, 50).reverse() : rawMessages;
    const readMessageIds = readMessages.map((m) => m.id);
    const otherTyping = !!(otherUser?.isTyping && otherUser?.typingConversationId === conversationId);
    // وضعیت فعلی درخواست های سکه — تا کارت های درخواست بعد از لود درست نمایش داده شوند
    const transferStatuses = await getTransferStatuses(messages);

    return NextResponse.json({ messages, hasMore, readMessageIds, otherTyping, transferStatuses });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[messages GET] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

const sendSchema = z.object({
  conversationId: z.string().min(1),
  content: z.string().min(1, "پیام خالی است").max(2000),
  type: z.enum(["TEXT", "IMAGE", "VOICE", "VIDEO", "STICKER"]).default("TEXT"),
  mediaUrl: z.string().optional(),
  duration: z.number().int().optional(),
  replyToId: z.string().optional(),
  isPriority: z.boolean().default(false),
  clientTag: z.string().max(64).optional(),
});

// ارسال پیام (شروع کننده گفتگو باید اشتراک فعال داشته باشد)
export async function POST(request: Request) {
  try {
    const user = await requireUser();
    // سقف ارسال پیام — مجموع همه گفتگوها: ۲۰ پیام در دقیقه
    const limited = await rateLimitUser(
      user.id,
      "msg-send",
      { windowMs: 60 * 1000, maxRequests: 20 },
      "به سقف ارسال پیام رسیدید (۲۰ پیام در هر دقیقه)؛ لطفا یک دقیقه صبر کنید و دوباره تلاش کنید"
    );
    if (limited) return limited;
    const body = await request.json();
    const parsed = sendSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "پیام نامعتبر است" }, { status: 400 });
    }

    // پیام صوتی فعلا غیرفعال است
    if (parsed.data.type === "VOICE") {
      return NextResponse.json({ error: "پیام صوتی به زودی فعال می شود" }, { status: 400 });
    }

    const conversation = await getConversationForUser(
      parsed.data.conversationId,
      user.id
    );
    if (!conversation) {
      return NextResponse.json({ error: "گفتگو یافت نشد" }, { status: 404 });
    }

    const otherUserId =
      conversation.userAId === user.id
        ? conversation.userBId
        : conversation.userAId;

    // بررسی اینکه آیا طرف مقابل هانی (هوش مصنوعی) است
    const otherIsHani = await isHaniUser(otherUserId);

    // هانی و آقای زنبور فعلا غیرفعال هستند — ارسال پیام به آن ها ممکن نیست
    if (otherIsHani) {
      return NextResponse.json(
        { error: "این قابلیت بزودی فعال می شود" },
        { status: 403 }
      );
    }

    // جلوگیری از ارسال پیام در گفتگو مدیریتی (به جز هانی)
    if (!otherIsHani) {
      const otherUser = await prisma.user.findUnique({
        where: { id: otherUserId },
        select: { isAdminProfile: true, deletedAt: true },
      });
      // کاربر حذف شده — امکان ارسال پیام نیست
      if (otherUser?.deletedAt) {
        return NextResponse.json(
          { error: "کاربر اکانت خود را حذف کرده و امکان گفتگو نیست" },
          { status: 403 }
        );
      }
      if (otherUser?.isAdminProfile) {
        return NextResponse.json(
          { error: "این گفتگو مدیریتی است و غیرقابل پاسخ است" },
          { status: 403 }
        );
      }
    }

    // قفل اشتراک: گفتگو فقط وقتی باز است که شروع کننده اشتراک فعال داشته باشد (هانی مستثنی است).
    // اگر اشتراک شروع کننده تمام شده باشد، گفتگو بسته است و فقط کسی که اشتراک دارد می تواند آن را دوباره آغاز کند
    if (!otherIsHani) {
      const starterSub = await hasActiveSubscription(conversation.startedBy);
      if (!starterSub) {
        const senderSub = await hasActiveSubscription(user.id);
        if (!senderSub) {
          return NextResponse.json({ error: "SUBSCRIPTION_REQUIRED" }, { status: 402 });
        }
        await prisma.conversation.update({ where: { id: conversation.id }, data: { startedBy: user.id } });
      }
    }

    // بررسی قفل ارسال پیام توسط ادمین
    if (user.messageLockUntil && new Date(user.messageLockUntil) > new Date()) {
      return NextResponse.json(
        { error: "MESSAGE_LOCKED", reason: user.messageLockReason ?? "", until: user.messageLockUntil },
        { status: 403 }
      );
    }

    // پیام اولویت دار — کسر 5 سکه
    let priorityCoins = 0;
    if (parsed.data.isPriority) {
      priorityCoins = 5;
      const { ensureWallet } = await import("@/lib/finance");
      await ensureWallet(user.id);
      const wallet = await prisma.wallet.findUnique({ where: { userId: user.id } });
      if (!wallet || wallet.balance < priorityCoins) {
        return NextResponse.json({ error: "موجودی سکه کافی نیست (۵ سکه برای پیام اولویت دار)" }, { status: 400 });
      }
    }

    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: user.id,
        content: sanitizeMessage(parsed.data.content),
        type: parsed.data.type,
        isPriority: parsed.data.isPriority,
        ...(parsed.data.mediaUrl ? { mediaUrl: parsed.data.mediaUrl } : {}),
        ...(parsed.data.duration ? { duration: parsed.data.duration } : {}),
        ...(parsed.data.replyToId ? { replyToId: parsed.data.replyToId } : {}),
      },
      include: {
        replyTo: { select: { id: true, content: true, type: true, senderId: true } },
      },
    });

    // پیشرفت ماموریت های روزانه — منطق مشابه ماموریت های ویژه
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const prevTodayMsgs = await prisma.message.count({
      where: {
        conversationId: conversation.id,
        senderId: user.id,
        createdAt: { gte: startOfToday },
        id: { not: message.id },
      },
    });
    // اولین پیام امروز در این گفتگو — گفتگوی ساخته شده امروز «جدید» و بقیه «قدیمی» محسوب می شود
    if (prevTodayMsgs === 0) {
      void incrementMissionProgress(
        user.id,
        conversation.createdAt >= startOfToday ? "daily_new_chats" : "daily_old_chats"
      );
    }
    // عکس فقط یک بار در هر چت در روز به حساب می آید (ویس فعلا غیرفعال است)
    if (parsed.data.type === "IMAGE") {
      const prevSameType = await prisma.message.count({
        where: {
          conversationId: conversation.id,
          senderId: user.id,
          type: parsed.data.type,
          createdAt: { gte: startOfToday },
          id: { not: message.id },
        },
      });
      if (prevSameType === 0) {
        void incrementMissionProgress(user.id, "daily_photo");
      }
    }

    // کسر سکه پیام اولویت دار
    if (priorityCoins > 0) {
      await import("@/lib/finance");
      const { getAllSettings } = await import("@/lib/settings");
      const settings = await getAllSettings();
      await prisma.$transaction([
        prisma.wallet.update({
          where: { userId: user.id },
          data: { balance: { decrement: priorityCoins } },
        }),
        prisma.transaction.create({
          data: {
            userId: user.id,
            type: "BOOST_PURCHASE",
            coins: -priorityCoins,
            amountToman: priorityCoins * settings.coinValue,
            status: "COMPLETED",
            description: "پیام اولویت دار",
          },
        }),
      ]);
    }

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });

    // انتشار پیام جدید به SSE listener های گفتگو — clientTag برای تعویض پیام موقت فرستنده
    publishToConversation(conversation.id, "message", {
      ...message,
      ...(parsed.data.clientTag ? { clientTag: parsed.data.clientTag } : {}),
    });

    // broadcast برای چت زنده ادمین (غیرهمزمان — مسیر اصلی را کند نمی کند)
    prisma.message.findUnique({
      where: { id: message.id },
      include: {
        sender: {
          select: {
            id: true, firstName: true, lastName: true, username: true, gender: true,
            photos: { select: { url: true }, where: { isVerified: true, isRejected: false, isDeletedByUser: false, isProfile: true }, take: 1 },
          },
        },
        conversation: {
          select: {
            id: true, userAId: true, userBId: true,
            userA: { select: { id: true, firstName: true, lastName: true, username: true, photos: { select: { url: true }, where: { isVerified: true, isRejected: false, isDeletedByUser: false, isProfile: true }, take: 1 } } },
            userB: { select: { id: true, firstName: true, lastName: true, username: true, photos: { select: { url: true }, where: { isVerified: true, isRejected: false, isDeletedByUser: false, isProfile: true }, take: 1 } } },
          },
        },
      },
    }).then((fullMessage) => {
      if (!fullMessage) return;
      if (fullMessage.type === "TEXT") broadcastNewMessage(fullMessage);
      if (fullMessage.type === "IMAGE") broadcastNewPhoto(fullMessage);
    }).catch(() => {});

    // ارسال push notification به طرف مقابل (غیرهمزمان)
    if (!otherIsHani) {
      const pushBody = parsed.data.type === "TEXT"
        ? sanitizeMessage(parsed.data.content).slice(0, 100)
        : "رسانه جدید";
      sendPushToUser(otherUserId, {
        title: `${user.firstName} ${user.lastName}`,
        body: pushBody,
        url: `/dashboard/chat/${conversation.id}`,
      }).catch(() => {});
    }

    // اگر طرف مقابل هانی است، پاسخ هوش مصنوعی تولید کن (غیرهمزمان)
    if (otherIsHani && parsed.data.type === "TEXT") {
      generateHaniReply(conversation.id, otherUserId, parsed.data.content).catch((err) => {
        console.error("[messages POST] hani reply error:", err);
      });
    }

    return NextResponse.json({ ok: true, message });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[messages POST] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
