// API انتقال سکه (هدیه) در چت
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth";
import { ensureWallet } from "@/lib/finance";
import { getAllSettings } from "@/lib/settings";
import { sanitizeString } from "@/lib/sanitize";
import { isHaniUser } from "@/lib/aiCompanion";

const transferSchema = z.object({
  conversationId: z.string().min(1),
  receiverId: z.string().min(1),
  coins: z.coerce.number().int().min(1).max(100_000),
  message: z.string().max(200).optional(),
});

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const parsed = transferSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "اطلاعات نامعتبر است" }, { status: 400 });
    }

    const { conversationId, receiverId, coins, message } = parsed.data;

    // بررسی عضویت در گفتگو
    const conv = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conv || (conv.userAId !== user.id && conv.userBId !== user.id)) {
      return NextResponse.json({ error: "گفتگو یافت نشد" }, { status: 404 });
    }
    if (conv.userAId !== receiverId && conv.userBId !== receiverId) {
      return NextResponse.json({ error: "گیرنده نامعتبر است" }, { status: 400 });
    }
    if (receiverId === user.id) {
      return NextResponse.json({ error: "نمی توانید به خودتان سکه هدیه دهید" }, { status: 400 });
    }

    // جلوگیری از انتقال سکه به هانی (هوش مصنوعی)
    if (await isHaniUser(receiverId)) {
      return NextResponse.json({ error: "امکان انتقال سکه به هانی وجود ندارد" }, { status: 400 });
    }

    const settings = await getAllSettings();
    const fee = Math.ceil((coins * settings.transferFeePercent) / 100);
    const totalDeduct = coins + fee;

    // بررسی ویژه بودن گیرنده برای 20% سکه اضافه
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      select: { isSpecial: true },
    });
    const bonus = receiver?.isSpecial ? Math.ceil((coins * 20) / 100) : 0;
    const receiverCoins = coins + bonus;

    await ensureWallet(user.id);
    await ensureWallet(receiverId);

    const senderWallet = await prisma.wallet.findUnique({ where: { userId: user.id } });
    if (!senderWallet || senderWallet.balance < totalDeduct) {
      return NextResponse.json({ error: "موجودی سکه کافی نیست" }, { status: 400 });
    }

    const coinValue = settings.coinValue;

    await prisma.$transaction([
      // کسر از فرستنده
      prisma.wallet.update({
        where: { userId: user.id },
        data: { balance: { decrement: totalDeduct } },
      }),
      // اضافه به گیرنده (با پاداش ویژه)
      prisma.wallet.update({
        where: { userId: receiverId },
        data: { balance: { increment: receiverCoins } },
      }),
      // ثبت انتقال
      prisma.coinTransfer.create({
        data: {
          conversationId,
          senderId: user.id,
          receiverId,
          coins,
          fee,
          type: "GIFT",
          status: "COMPLETED",
          message: message ? sanitizeString(message, 200) : null,
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
      // پیام سیستمی در چت
      prisma.message.create({
        data: {
          conversationId,
          senderId: user.id,
          content: JSON.stringify({ coins: receiverCoins, fee, bonus, message: message ?? "", type: "GIFT" }),
          type: "SYSTEM",
        },
      }),
      // نوتیفیکیشن برای گیرنده
      prisma.notification.create({
        data: {
          userId: receiverId,
          type: "GIFT_RECEIVED",
          title: "هدیه سکه دریافتی",
          body: `${user.firstName} ${receiverCoins} سکه به شما هدیه داد${bonus > 0 ? " (شامل پاداش ویژه)" : ""}`,
          data: JSON.stringify({ coins, senderId: user.id, conversationId }),
        },
      }),
    ]);

    console.log(`[transfer] user ${user.id} sent ${coins} coins (+${fee} fee) to ${receiverId}, receiver got ${receiverCoins}${bonus > 0 ? ` (+${bonus} special bonus)` : ""}`);
    return NextResponse.json({ ok: true, coins: receiverCoins, fee, bonus });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[transfer] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
