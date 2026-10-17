// API لایک و سوپر لایک + دریافت لیست لایک های دریافتی
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth";
import { getBrandSettings } from "@/lib/brandSettings";
import { parseBrandFromUA } from "@/lib/brands";
import { notifyUser } from "@/lib/notifications";
import { incrementMissionProgress } from "@/lib/missions";
import { rateLimitUser } from "@/lib/rate-limit";

const likeSchema = z.object({
  receiverId: z.string().min(1),
  type: z.enum(["LIKE", "SUPER_LIKE"]).default("LIKE"),
  useCoins: z.boolean().default(false), // سوپر لایک با سکه
});

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    // سقف لایک/سوپرلایک ارسالی: ۱۰۰ در ساعت — جلوگیری از بات لایک
    const limited = await rateLimitUser(
      user.id,
      "like-send",
      { windowMs: 60 * 60 * 1000, maxRequests: 100 },
      "به سقف ارسال لایک در هر ساعت رسیدید؛ لطفا بعدا تلاش کنید"
    );
    if (limited) return limited;
    const body = await request.json();
    const parsed = likeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "اطلاعات نامعتبر است" }, { status: 400 });
    }

    const { receiverId, type, useCoins } = parsed.data;
    if (receiverId === user.id) {
      return NextResponse.json({ error: "نمی توانید خودتان را لایک کنید" }, { status: 400 });
    }

    // بررسی بلاک
    const blocked = await prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: user.id, blockedId: receiverId },
          { blockerId: receiverId, blockedId: user.id },
        ],
      },
    });
    if (blocked) {
      return NextResponse.json({ error: "امکان لایک این کاربر وجود ندارد" }, { status: 403 });
    }

    // بررسی تکراری نبودن
    const existing = await prisma.like.findUnique({
      where: {
        senderId_receiverId_type: { senderId: user.id, receiverId, type },
      },
    });
    if (existing) {
      return NextResponse.json({ error: "قبلا لایک کرده اید" }, { status: 400 });
    }

    // شرط تکمیل پروفایل حذف شد — مثل گفتگو، لایک با هر پروفایلی آزاد است
    const settings = await getBrandSettings(parseBrandFromUA(request.headers.get("user-agent")).brandId);
    const now = new Date();

    // بررسی محدودیت روزانه
    if (type === "LIKE") {
      // ریست روزانه
      const resetTime = new Date(user.dailyLikesReset);
      const isSameDay = resetTime.toDateString() === now.toDateString();
      const usedToday = isSameDay ? user.dailyLikesUsed : 0;
      if (usedToday >= settings.dailyLikeLimit) {
        return NextResponse.json({ error: `محدودیت روزانه لایک (${settings.dailyLikeLimit}) تکمیل شد` }, { status: 429 });
      }
      await prisma.user.update({
        where: { id: user.id },
        data: {
          dailyLikesUsed: isSameDay ? { increment: 1 } : 1,
          dailyLikesReset: isSameDay ? user.dailyLikesReset : now,
        },
      });
    } else {
      // سوپر لایک
      const resetTime = new Date(user.dailySuperLikeReset);
      const isSameDay = resetTime.toDateString() === now.toDateString();
      if (isSameDay && user.dailySuperLikeUsed && !useCoins) {
        return NextResponse.json({ error: "محدودیت روزانه سوپر لایک تکمیل شد — با ۱۰ سکه سوپر لایک اضافی بخرید", status: 429 }, { status: 429 });
      }

      if (useCoins) {
        // سوپر لایک با سکه
        const SUPER_LIKE_COIN_COST = 10;
        const { ensureWallet } = await import("@/lib/finance");
        await ensureWallet(user.id);
        const wallet = await prisma.wallet.findUnique({ where: { userId: user.id } });
        if (!wallet || wallet.balance < SUPER_LIKE_COIN_COST) {
          return NextResponse.json({ error: "موجودی سکه کافی نیست (۱۰ سکه لازم است)" }, { status: 400 });
        }
        await prisma.$transaction([
          prisma.wallet.update({
            where: { userId: user.id },
            data: { balance: { decrement: SUPER_LIKE_COIN_COST } },
          }),
          prisma.transaction.create({
            data: {
              userId: user.id,
              type: "BOOST_PURCHASE",
              coins: -SUPER_LIKE_COIN_COST,
              amountToman: SUPER_LIKE_COIN_COST * settings.coinValue,
              status: "COMPLETED",
              description: "سوپر لایک اضافی",
            },
          }),
        ]);
      } else {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            dailySuperLikeUsed: true,
            dailySuperLikeReset: now,
          },
        });
      }
    }

    // ثبت لایک
    const newLike = await prisma.like.create({
      data: { senderId: user.id, receiverId, type },
    });

    // بررسی لایک متقابل — آیا receiver هم sender را لایک کرده؟
    const reverseLike = await prisma.like.findUnique({
      where: {
        senderId_receiverId_type: { senderId: receiverId, receiverId: user.id, type },
      },
    });

    let isMatch = false;
    if (reverseLike) {
      isMatch = true;
      // به روز رسانی هر دو لایک به عنوان matched
      await prisma.like.update({
        where: { id: newLike.id },
        data: { isMatched: true },
      });
      await prisma.like.update({
        where: { id: reverseLike.id },
        data: { isMatched: true },
      });

      // ایجاد رکورد match (userA = نفر کوچکتر، userB = نفر بزرگتر برای یکتایی)
      const [userAId, userBId] = user.id < receiverId ? [user.id, receiverId] : [receiverId, user.id];
      await prisma.match.upsert({
        where: { userAId_userBId: { userAId, userBId } },
        update: {},
        create: { userAId, userBId },
      });

      // username طرف مقابل برای لینک مستقیم اعلان به پروفایل
      const receiverUser = await prisma.user.findUnique({
        where: { id: receiverId },
        select: { username: true },
      });

      // نوتیفیکیشن match برای هر دو کاربر
      await notifyUser(receiverId, "MATCH", "مچ جدید!", `شما و ${user.firstName} همدیگر را لایک کردید`, {
        data: JSON.stringify({ matchUserId: user.id, senderUsername: user.username }),
        url: "/dashboard/chat",
      });
      await notifyUser(user.id, "MATCH", "مچ جدید!", "شما و این کاربر همدیگر را لایک کردید", {
        data: JSON.stringify({ matchUserId: receiverId, senderUsername: receiverUser?.username }),
        url: "/dashboard/chat",
      });

      console.log(`[likes] MATCH created: ${user.id} <-> ${receiverId}`);
    }

    // نوتیفیکیشن لایک (فقط اگر match نباشد) — با دعوت به شروع گفتگو
    if (!isMatch) {
      await notifyUser(
        receiverId,
        type === "SUPER_LIKE" ? "SUPER_LIKE" : "LIKE",
        type === "SUPER_LIKE" ? "سوپر لایک جدید" : "لایک جدید",
        type === "SUPER_LIKE"
          ? `${user.firstName} شما را سوپر لایک کرد — میخواید گفتگو رو شروع کنید؟`
          : `${user.firstName} از شما خوشش آمده و پروفایل شما را لایک کرده — میخواید گفتگو رو شروع کنید؟`,
        { data: JSON.stringify({ senderId: user.id, senderUsername: user.username }), url: "/dashboard/notifications" }
      );
    }

    // ماموریت ارسال لایک
    void incrementMissionProgress(user.id, "daily_likes");

    console.log(`[likes] user ${user.id} ${type} -> ${receiverId}${isMatch ? " (MATCH!)" : ""}`);
    return NextResponse.json({ ok: true, type, isMatch });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[likes] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

// لایک غیرقابل بازگشت است — برداشتن لایک بی صدا نادیده گرفته می شود
export async function DELETE() {
  try {
    await requireUser();
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[likes DELETE] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || undefined;

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("pageSize") || "30", 10)));

    const [likes, total] = await Promise.all([
      prisma.like.findMany({
        where: { receiverId: user.id, ...(type ? { type } : {}) },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              age: true,
              city: true,
              isVerified: true,
              isOnline: true,
            },
          },
        },
      }),
      prisma.like.count({
        where: { receiverId: user.id, ...(type ? { type } : {}) },
      }),
    ]);

    return NextResponse.json({
      likes,
      total,
      page,
      totalPages: Math.ceil(total / pageSize),
      hasMore: page * pageSize < total,
    });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[likes GET] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
