// API هدیه سکه از استوری (بدون نیاز به conversationId و بدون نیاز به اشتراک)
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth";
import { ensureWallet, InsufficientFundsError } from "@/lib/finance";
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
    // انتقال سکه بدون کارمزد است
    const fee = 0;
    const totalDeduct = coins;
    const bonus = receiver.isSpecial ? Math.ceil((coins * 20) / 100) : 0;
    const receiverCoins = coins + bonus;

    await ensureWallet(user.id);
    await ensureWallet(receiverId);

    const coinValue = settings.coinValue;
    const senderName = user.firstName;
    const receiverName = receiver.firstName;

    try {
      await prisma.$transaction(async (tx) => {
        // کسر اتمیک از فرستنده — کمبود موجودی کل تراکنش را برمی گرداند
        const deducted = await tx.wallet.updateMany({
          where: { userId: user.id, balance: { gte: totalDeduct } },
          data: { balance: { decrement: totalDeduct } },
        });
        if (deducted.count === 0) throw new InsufficientFundsError();
        // اضافه به گیرنده
        await tx.wallet.update({
          where: { userId: receiverId },
          data: { balance: { increment: receiverCoins } },
        });
        // ثبت انتقال
        await tx.coinTransfer.create({
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
        });
        // تراکنش فرستنده
        await tx.transaction.create({
          data: {
            userId: user.id,
            type: "COIN_TRANSFER_OUT",
            coins: -totalDeduct,
            amountToman: totalDeduct * coinValue,
            status: "COMPLETED",
            description: `هدیه ${coins} سکه`,
          },
        });
        // تراکنش گیرنده
        await tx.transaction.create({
          data: {
            userId: receiverId,
            type: "COIN_TRANSFER_IN",
            coins: receiverCoins,
            amountToman: receiverCoins * coinValue,
            status: "COMPLETED",
            description: bonus > 0 ? `دریافت ${receiverCoins} سکه هدیه (${coins} + ${bonus} پاداش ویژه)` : `دریافت ${coins} سکه هدیه`,
          },
        });
        // پیام سیستمی در چت — نمایش هدیه برای هر دو طرف
        await tx.message.create({
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
        });
        // نوتیفیکیشن برای گیرنده
        await tx.notification.create({
          data: {
            userId: receiverId,
            type: "GIFT_RECEIVED",
            title: "هدیه سکه دریافتی",
            body: `${senderName} ${receiverCoins} سکه به شما هدیه داد${bonus > 0 ? " (شامل پاداش ویژه)" : ""}`,
            data: JSON.stringify({ coins, senderId: user.id, conversationId: conversation.id }),
          },
        });
      });
    } catch (err) {
      if (err instanceof InsufficientFundsError) {
        return NextResponse.json({ error: "موجودی سکه کافی نیست" }, { status: 400 });
      }
      throw err;
    }

    console.log(`[transfer/gift] user ${user.id} sent ${coins} coins to ${receiverId}, receiver got ${receiverCoins}`);
    return NextResponse.json({ ok: true, coins: receiverCoins, fee, bonus, conversationId: conversation.id });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[transfer/gift] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
