// SSE stream سراسری حضور کاربران — رویداد online/offline همه کاربران
import { requireUser, AuthError } from "@/lib/auth";
import { subscribePresence } from "@/lib/presenceEvents";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    await requireUser();

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

        unsubscribe = subscribePresence((data) => send("presence", data));

        // heartbeat برای جلوگیری از timeout
        heartbeat = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(": ping\n\n"));
          } catch {
            // closed
          }
        }, 25000);

        send("ready", { ok: true });
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
    console.error("[presence/stream] error:", err);
    return new Response("Server error", { status: 500 });
  }
}
