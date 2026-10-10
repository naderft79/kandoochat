// API عکس زنده — SSE stream برای دریافت real-time عکس ها
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, AuthError } from "@/lib/auth";
import { subscribeLivePhotos } from "@/lib/liveChatEvents";

export async function GET(request: Request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const stream = searchParams.get("stream");

    // حالت SSE stream
    if (stream === "true") {
      const encoder = new TextEncoder();

      const streamResponse = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(": connected\n\n"));

          const unsubscribe = subscribeLivePhotos((message) => {
            const data = `data: ${JSON.stringify(message)}\n\n`;
            try {
              controller.enqueue(encoder.encode(data));
            } catch {
              // connection closed
            }
          });

          const heartbeat = setInterval(() => {
            try {
              controller.enqueue(encoder.encode(": heartbeat\n\n"));
            } catch {
              // connection closed
            }
          }, 30000);

          (controller as unknown as { _cleanup?: () => void })._cleanup = () => {
            unsubscribe();
            clearInterval(heartbeat);
          };
        },
        cancel(controller) {
          const c = controller as unknown as { _cleanup?: () => void };
          if (c._cleanup) c._cleanup();
        },
      });

      return new Response(streamResponse, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
        },
      });
    }

    // حالت عادی — initial load
    const cursor = searchParams.get("cursor");
    const limit = parseInt(searchParams.get("limit") ?? "50", 10);

    const messages = await prisma.message.findMany({
      where: {
        type: "IMAGE",
        ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            gender: true,
            photos: { where: { isProfile: true, isDeletedByUser: false }, select: { url: true }, take: 1 },
          },
        },
        conversation: {
          select: {
            id: true,
            userAId: true,
            userBId: true,
            userA: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                username: true,
                photos: { where: { isProfile: true, isDeletedByUser: false }, select: { url: true }, take: 1 },
              },
            },
            userB: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                username: true,
                photos: { where: { isProfile: true, isDeletedByUser: false }, select: { url: true }, take: 1 },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 100),
    });

    return NextResponse.json({
      messages,
      hasMore: messages.length === limit,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    }
    console.error("[admin/live-photos] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
