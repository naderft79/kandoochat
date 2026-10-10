// SSE stream رویدادهای کاربر — اعلان جدید، پیام نخوانده و تغییر موجودی سکه
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth";
import { subscribeToUser } from "@/lib/userEvents";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function snapshot(userId: string) {
  const [unreadCount, unreadConversations] = await Promise.all([
    prisma.notification.count({ where: { userId, isRead: false } }),
    prisma.message.findMany({
      where: {
        isRead: false,
        senderId: { not: userId },
        conversation: { OR: [{ userAId: userId }, { userBId: userId }] },
      },
      select: { conversationId: true },
      distinct: ["conversationId"],
    }),
  ]);
  return { unreadCount, unreadConversations: unreadConversations.length };
}

export async function GET() {
  try {
    const user = await requireUser();

    const encoder = new TextEncoder();
    let unsubscribe: (() => void) | null = null;
    let heartbeat: ReturnType<typeof setInterval> | null = null;

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const send = (event: string, data: unknown) => {
          try {
            controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
          } catch {
            // اتصال بسته شده
          }
        };

        // ابتدا subscribe می کنیم تا رویدادی بین اسنپ شات و اتصال گم نشود
        unsubscribe = subscribeToUser(user.id, async (event, data) => {
          if (event !== "change") return;
          const payload = data as { scope?: string; balance?: number };
          if (payload.scope === "wallet") {
            send("change", payload);
            return;
          }
          try {
            const snap = await snapshot(user.id);
            send("change", { ...payload, ...snap });
          } catch {
            send("change", payload);
          }
        });

        // اسنپ شات اولیه بعد از subscribe — شامل هر تغییری که در این فاصله رخ داده
        try {
          send("snapshot", await snapshot(user.id));
        } catch {
          // اگر کوئری اولیه خطا خورد، کلاینت خودش دوباره می گیرد
        }

        // heartbeat برای جلوگیری از timeout
        heartbeat = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(": ping\n\n"));
          } catch {
            // closed
          }
        }, 25000);
      },
      cancel() {
        if (unsubscribe) unsubscribe();
        if (heartbeat) clearInterval(heartbeat);
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err) {
    if (err instanceof AuthError)
      return new Response("Unauthorized", { status: 401 });
    console.error("[notifications/stream] error:", err);
    return new Response("Internal error", { status: 500 });
  }
}
