// API درخواست سکه در چت + تایید/رد درخواست
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth";
import { rateLimitUser } from "@/lib/rate-limit";
import { ensureWallet, InsufficientFundsError } from "@/lib/finance";
import { getAllSettings } from "@/lib/settings";
import { isHaniUser } from "@/lib/aiCompanion";
import { publishToConversation } from "@/lib/chatEvents";

const requestSchema = z.object({
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
    const parsed = requestSchema.safeParse(body);
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
    if (receiverId === user.id) {
      return NextResponse.json({ error: "نمی توانید از خودتان سکه درخواست کنید" }, { status: 400 });
    }

    // جلوگیری از درخواست سکه از هانی (هوش مصنوعی)
    if (await isHaniUser(receiverId)) {
      return NextResponse.json({ error: "امکان درخواست سکه از هانی وجود ندارد" }, { status: 400 });
    }

    // نام گیرنده برای نمایش درست در پیام
    const receiverUser = await prisma.user.findUnique({
      where: { id: receiverId },
      select: { firstName: true },
    });

    // ثبت درخواست
    const transfer = await prisma.coinTransfer.create({
      data: {
        conversationId,
        senderId: user.id,
        receiverId,
        coins,
        fee: 0,
        type: "REQUEST",
        status: "PENDING",
        message: message ?? null,
      },
    });

    // پیام سیستمی در چت
    const systemMessage = await prisma.message.create({
      data: {
        conversationId,
        senderId: user.id,
        content: JSON.stringify({
          coins,
          message: message ?? "",
          type: "REQUEST",
          transferId: transfer.id,
          senderName: user.firstName,
          receiverName: receiverUser?.firstName ?? "",
        }),
        type: "SYSTEM",
      },
    });
    publishToConversation(conversationId, "message", systemMessage);

    // نوتیفیکیشن برای گیرنده درخواست
    await prisma.notification.create({
      data: {
        userId: receiverId,
        type: "REQUEST_RECEIVED",
        title: "درخواست سکه",
        body: `${user.firstName} از شما ${coins} سکه درخواست کرد`,
        data: JSON.stringify({ coins, senderId: user.id, conversationId, transferId: transfer.id }),
      },
    });

    console.log(`[transfer/request] user ${user.id} requested ${coins} coins from ${receiverId}`);
    return NextResponse.json({ ok: true, transferId: transfer.id });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[transfer/request] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

const actionSchema = z.object({
  transferId: z.string().min(1),
  action: z.enum(["APPROVE", "REJECT"]),
});

export async function PATCH(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const parsed = actionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "اطلاعات نامعتبر است" }, { status: 400 });
    }

    const { transferId, action } = parsed.data;

    const transfer = await prisma.coinTransfer.findUnique({
      where: { id: transferId },
    });
    if (!transfer || transfer.type !== "REQUEST" || transfer.status !== "PENDING") {
      return NextResponse.json({ error: "درخواست یافت نشد" }, { status: 404 });
    }
    // فقط گیرنده درخواست می تواند تایید/رد کند
    if (transfer.receiverId !== user.id) {
      return NextResponse.json({ error: "اجازه انجام این عمل را ندارید" }, { status: 403 });
    }

    // نام درخواست کننده برای نمایش در پیام
    const requester = await prisma.user.findUnique({
      where: { id: transfer.senderId },
      select: { firstName: true },
    });

    if (action === "REJECT") {
      const [, rejectMsg] = await prisma.$transaction([
        prisma.coinTransfer.update({
          where: { id: transferId },
          data: { status: "REJECTED", type: "REQUEST_REJECTED" },
        }),
        prisma.message.create({
          data: {
            conversationId: transfer.conversationId,
            senderId: user.id,
            content: JSON.stringify({ coins: transfer.coins, type: "REQUEST_REJECTED", transferId, senderName: user.firstName, receiverName: requester?.firstName ?? "" }),
            type: "SYSTEM",
          },
        }),
        prisma.notification.create({
          data: {
            userId: transfer.senderId,
            type: "REQUEST_REJECTED",
            title: "درخواست سکه رد شد",
            body: `درخواست ${transfer.coins} سکه رد شد`,
            data: JSON.stringify({ transferId }),
          },
        }),
      ]);
      // اطلاع لحظه ای به هر دو طرف: پیام جدید + به روز شدن کارت درخواست
      publishToConversation(transfer.conversationId, "message", rejectMsg);
      publishToConversation(transfer.conversationId, "transfer-status", { transferId, status: "REJECTED" });
      return NextResponse.json({ ok: true, status: "REJECTED" });
    }

    // تایید درخواست — انتقال سکه بدون کارمزد است
    const settings = await getAllSettings();
    const fee = 0;
    const totalDeduct = transfer.coins;
    const coinValue = settings.coinValue;

    await ensureWallet(user.id);
    await ensureWallet(transfer.senderId);

    let approveMsg: Awaited<ReturnType<typeof prisma.message.create>> | null = null;
    try {
      await prisma.$transaction(async (tx) => {
        // کسر اتمیک از تایید کننده — کمبود موجودی کل تراکنش را برمی گرداند
        const deducted = await tx.wallet.updateMany({
          where: { userId: user.id, balance: { gte: totalDeduct } },
          data: { balance: { decrement: totalDeduct } },
        });
        if (deducted.count === 0) throw new InsufficientFundsError();
        await tx.wallet.update({
          where: { userId: transfer.senderId },
          data: { balance: { increment: transfer.coins } },
        });
        await tx.coinTransfer.update({
          where: { id: transferId },
          data: { status: "COMPLETED", type: "REQUEST_APPROVED", fee },
        });
        await tx.transaction.create({
          data: {
            userId: user.id,
            type: "COIN_TRANSFER_OUT",
            coins: -totalDeduct,
            amountToman: totalDeduct * coinValue,
            status: "COMPLETED",
            description: `تایید درخواست ${transfer.coins} سکه`,
          },
        });
        await tx.transaction.create({
          data: {
            userId: transfer.senderId,
            type: "COIN_TRANSFER_IN",
            coins: transfer.coins,
            amountToman: transfer.coins * coinValue,
            status: "COMPLETED",
            description: `دریافت ${transfer.coins} سکه (درخواست تایید شد)`,
          },
        });
        approveMsg = await tx.message.create({
          data: {
            conversationId: transfer.conversationId,
            senderId: user.id,
            content: JSON.stringify({ coins: transfer.coins, fee, type: "REQUEST_APPROVED", transferId, senderName: user.firstName, receiverName: requester?.firstName ?? "" }),
            type: "SYSTEM",
          },
        });
        await tx.notification.create({
          data: {
            userId: transfer.senderId,
            type: "REQUEST_APPROVED",
            title: "درخواست سکه تایید شد",
            body: `درخواست ${transfer.coins} سکه تایید شد`,
            data: JSON.stringify({ transferId }),
          },
        });
      });
    } catch (err) {
      if (err instanceof InsufficientFundsError) {
        return NextResponse.json({ error: "موجودی سکه کافی نیست" }, { status: 400 });
      }
      throw err;
    }

    // اطلاع لحظه ای به هر دو طرف گفتگو
    if (approveMsg) publishToConversation(transfer.conversationId, "message", approveMsg);
    publishToConversation(transfer.conversationId, "transfer-status", { transferId, status: "COMPLETED" });

    console.log(`[transfer/request] user ${user.id} approved transfer ${transferId}`);
    return NextResponse.json({ ok: true, status: "COMPLETED", fee });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[transfer/request PATCH] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
