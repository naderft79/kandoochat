// API هدیه سکه از استوری (بدون نیاز به conversationId و بدون نیاز به اشتراک)
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth";
import { ensureWallet } from "@/lib/finance";
import { getAllSettings } from "@/lib/settings";

const giftSchema = z.object({
  receiverId: z.string().min(1),
  coins: z.coerce.number().int().min(1).max(100_000),
  message: z.string().max(200).optional(),
});

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const parsed = giftSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "اطلاعات نامعتبر است" }, { status: 400 });
    }

    const { receiverId, coins, message } = parsed.data;

    if (receiverId === user.id) {
      return NextResponse.json({ error: "نمی توانید به خودتان سکه هدیه دهید" }, { status: 400 });
    }

    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      select: { id: true, isSpecial: true, isActive: true, firstName: true },
    });
    if (!receiver || !receiver.isActive) {
      return NextResponse.json({ error: "کاربر یافت نشد" }, { status: 404 });
    }

    // هدیه سکه بدون نیاز به اشتراک — پیدا کردن یا ایجاد گفتگو
    const [userAId, userBId] = [user.id, receiverId].sort();
    let conversation = await prisma.conversation.findUnique({
      where: { userAId_userBId: { userAId, userBId } },
    });
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: { userAId, userBId, startedBy: user.id },
      });
    }

    const settings = await getAllSettings();
    const fee = Math.ceil((coins * settings.transferFeePercent) / 100);
    const totalDeduct = coins + fee;
    const bonus = receiver.isSpecial ? Math.ceil((coins * 20) / 100) : 0;
    const receiverCoins = coins + bonus;

    await ensureWallet(user.id);
    await ensureWallet(receiverId);

    const senderWallet = await prisma.wallet.findUnique({ where: { userId: user.id } });
    if (!senderWallet || senderWallet.balance < totalDeduct) {
      return NextResponse.json({ error: "موجودی سکه کافی نیست" }, { status: 400 });
    }

    const coinValue = settings.coinValue;
    const senderName = user.firstName;
    const receiverName = receiver.firstName;

    await prisma.$transaction([
      // کسر از فرستنده
      prisma.wallet.update({
        where: { userId: user.id },
        data: { balance: { decrement: totalDeduct } },
      }),
      // اضافه به گیرنده
      prisma.wallet.update({
        where: { userId: receiverId },
        data: { balance: { increment: receiverCoins } },
      }),
      // ثبت انتقال
      prisma.coinTransfer.create({
        data: {
          conversationId: conversation.id,
          senderId: user.id,
          receiverId,
          coins,
          fee,
          type: "GIFT",
          status: "COMPLETED",
          message: message ?? null,
        },
      }),
      // تراکنش فرستنده
      prisma.transaction.create({
        data: {
          userId: user.id,
          type: "COIN_TRANSFER_OUT",
          coins: -totalDeduct,
          amountToman: totalDeduct * coinValue,
          status: "COMPLETED",
          description: `هدیه ${coins} سکه + کارمزد ${fee}`,
        },
      }),
      // تراکنش گیرنده
      prisma.transaction.create({
        data: {
          userId: receiverId,
          type: "COIN_TRANSFER_IN",
          coins: receiverCoins,
          amountToman: receiverCoins * coinValue,
          status: "COMPLETED",
          description: bonus > 0 ? `دریافت ${receiverCoins} سکه هدیه (${coins} + ${bonus} پاداش ویژه)` : `دریافت ${coins} سکه هدیه`,
        },
      }),
      // پیام سیستمی در چت — نمایش هدیه برای هر دو طرف
      prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderId: user.id,
          content: JSON.stringify({
            type: "GIFT",
            coins: receiverCoins,
            fee,
            bonus,
            message: message ?? "",
            senderName,
            receiverName,
          }),
          type: "SYSTEM",
        },
      }),
      // نوتیفیکیشن برای گیرنده
      prisma.notification.create({
        data: {
          userId: receiverId,
          type: "GIFT_RECEIVED",
          title: "هدیه سکه دریافتی",
          body: `${senderName} ${receiverCoins} سکه به شما هدیه داد${bonus > 0 ? " (شامل پاداش ویژه)" : ""}`,
          data: JSON.stringify({ coins, senderId: user.id, conversationId: conversation.id }),
        },
      }),
    ]);

    console.log(`[transfer/gift] user ${user.id} sent ${coins} coins (+${fee} fee) to ${receiverId}, receiver got ${receiverCoins}`);
    return NextResponse.json({ ok: true, coins: receiverCoins, fee, bonus, conversationId: conversation.id });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[transfer/gift] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
