// SSE stream پیام های یک گفتگو — real-time
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth";
import { subscribeToConversation } from "@/lib/chatEvents";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId") ?? "";

    if (!conversationId) {
      return new Response("conversationId required", { status: 400 });
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation || (conversation.userAId !== user.id && conversation.userBId !== user.id)) {
      return new Response("Not found", { status: 404 });
    }

    const encoder = new TextEncoder();
    let unsubscribe: (() => void) | null = null;
    let heartbeat: ReturnType<typeof setInterval> | null = null;

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        const send = (event: string, data: unknown) => {
          try {
            controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
          } catch {
            // connection closed
          }
        };

        unsubscribe = subscribeToConversation(conversationId, send);

        // heartbeat برای جلوگیری از timeout
        heartbeat = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(": ping\n\n"));
          } catch {
            // closed
          }
        }, 25000);

        // پیام خوش‌آمد
        send("ready", { conversationId });
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
    console.error("[messages/stream] error:", err);
    return new Response("Server error", { status: 500 });
  }
}
