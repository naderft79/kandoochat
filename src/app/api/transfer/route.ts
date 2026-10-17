// API انتقال سکه (هدیه) در چت
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth";
import { ensureWallet, InsufficientFundsError } from "@/lib/finance";
import { getBrandSettings } from "@/lib/brandSettings";
import { parseBrandFromUA } from "@/lib/brands";
import { sanitizeString } from "@/lib/sanitize";
import { isHaniUser } from "@/lib/aiCompanion";
import { publishToConversation } from "@/lib/chatEvents";
import { rateLimitUser } from "@/lib/rate-limit";

const transferSchema = z.object({
  conversationId: z.string().min(1),
  receiverId: z.string().min(1),
  coins: z.coerce.number().int().min(1).max(100_000),
  message: z.string().max(200).optional(),
});

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    // سقف انتقال/درخواست/هدیه سکه (سهمیه مشترک): ۱۰ در ساعت
    const limited = await rateLimitUser(
      user.id,
      "coin-transfer",
      { windowMs: 60 * 60 * 1000, maxRequests: 10 },
      "به سقف انتقال سکه در هر ساعت رسیدید؛ لطفا بعدا تلاش کنید"
    );
    if (limited) return limited;
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

    const settings = await getBrandSettings(parseBrandFromUA(request.headers.get("user-agent")).brandId);
    // انتقال سکه بدون کارمزد است
    const fee = 0;
    const totalDeduct = coins;

    // بررسی ویژه بودن گیرنده برای 20% سکه اضافه
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      select: { isSpecial: true, firstName: true },
    });
    const bonus = receiver?.isSpecial ? Math.ceil((coins * 20) / 100) : 0;
    const receiverCoins = coins + bonus;

    await ensureWallet(user.id);
    await ensureWallet(receiverId);

    const coinValue = settings.coinValue;
    let systemMessage: Awaited<ReturnType<typeof prisma.message.create>> | null = null;

    try {
      await prisma.$transaction(async (tx) => {
        // کسر اتمیک از فرستنده — اگر موجودی کافی نباشد کل تراکنش برمی گردد
        const deducted = await tx.wallet.updateMany({
          where: { userId: user.id, balance: { gte: totalDeduct } },
          data: { balance: { decrement: totalDeduct } },
        });
        if (deducted.count === 0) throw new InsufficientFundsError();
        // اضافه به گیرنده (با پاداش ویژه)
        await tx.wallet.update({
          where: { userId: receiverId },
          data: { balance: { increment: receiverCoins } },
        });
        // ثبت انتقال
        await tx.coinTransfer.create({
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
        // پیام سیستمی در چت
        systemMessage = await tx.message.create({
          data: {
            conversationId,
            senderId: user.id,
            content: JSON.stringify({
              coins: receiverCoins,
              fee,
              bonus,
              message: message ?? "",
              type: "GIFT",
              senderName: user.firstName,
              receiverName: receiver?.firstName ?? "",
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
            body: `${user.firstName} ${receiverCoins} سکه به شما هدیه داد${bonus > 0 ? " (شامل پاداش ویژه)" : ""}`,
            data: JSON.stringify({ coins, senderId: user.id, conversationId }),
          },
        });
      });
    } catch (err) {
      if (err instanceof InsufficientFundsError) {
        return NextResponse.json({ error: "موجودی سکه کافی نیست" }, { status: 400 });
      }
      throw err;
    }

    // انتشار لحظه ای پیام انتقال به هر دو طرف گفتگو
    if (systemMessage) publishToConversation(conversationId, "message", systemMessage);

    console.log(`[transfer] user ${user.id} sent ${coins} coins to ${receiverId}, receiver got ${receiverCoins}${bonus > 0 ? ` (+${bonus} special bonus)` : ""}`);
    return NextResponse.json({ ok: true, coins: receiverCoins, fee, bonus });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[transfer] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
