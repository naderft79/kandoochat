// API بلاک کردن کاربر
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth";
import { rateLimitUser } from "@/lib/rate-limit";

const blockSchema = z.object({
  blockedId: z.string().min(1),
  reason: z.string().max(200).optional(),
});

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    // سقف بلاک/آنبلاک: ۶۰ در ساعت
    const limited = await rateLimitUser(
      user.id,
      "block",
      { windowMs: 60 * 60 * 1000, maxRequests: 60 },
      "تعداد درخواست های بلاک/رفع بلاک شما بیش از حد مجاز است؛ لطفا بعدا تلاش کنید"
    );
    if (limited) return limited;
    const body = await request.json();
    const parsed = blockSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "اطلاعات نامعتبر است" }, { status: 400 });
    }

    const { blockedId, reason } = parsed.data;
    if (blockedId === user.id) {
      return NextResponse.json({ error: "نمی توانید خودتان را بلاک کنید" }, { status: 400 });
    }

    // upsert چون ممکن است قبلا بلاک شده باشد
    await prisma.block.upsert({
      where: { blockerId_blockedId: { blockerId: user.id, blockedId } },
      update: { reason: reason ?? null },
      create: { blockerId: user.id, blockedId, reason: reason ?? null },
    });

    console.log(`[block] user ${user.id} blocked ${blockedId}`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[block] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

// لیست بلاک شده ها
export async function GET() {
  try {
    const user = await requireUser();
    const blocks = await prisma.block.findMany({
      where: { blockerId: user.id },
      include: {
        blocked: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            age: true,
            city: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ blocks });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[block GET] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

// حذف بلاک
export async function DELETE(request: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const blockedId = searchParams.get("blockedId");
    if (!blockedId) {
      return NextResponse.json({ error: "شناسه کاربر لازم است" }, { status: 400 });
    }
    await prisma.block.deleteMany({
      where: { blockerId: user.id, blockedId },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[block DELETE] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
