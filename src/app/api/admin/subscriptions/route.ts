// API مدیریت اشتراک کاربران توسط مدیر
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, AuthError } from "@/lib/auth";

const schema = z.object({
  userId: z.string().min(1),
  action: z.enum(["extend", "shorten", "delete", "create"]),
  days: z.coerce.number().int().min(0).max(3650).optional(),
});

export async function PATCH(request: Request) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "درخواست نامعتبر" }, { status: 400 });
    }
    const { userId, action, days = 0 } = parsed.data;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "کاربر یافت نشد" }, { status: 404 });
    }

    const now = new Date();
    const activeSubscription = await prisma.subscription.findFirst({
      where: { userId, endsAt: { gt: now } },
      orderBy: { endsAt: "desc" },
    });

    switch (action) {
      case "delete": {
        if (!activeSubscription) {
          return NextResponse.json({ error: "اشتراک فعالی وجود ندارد" }, { status: 400 });
        }
        await prisma.subscription.delete({ where: { id: activeSubscription.id } });
        break;
      }
      case "create": {
        if (activeSubscription) {
          return NextResponse.json({ error: "کاربر قبلا اشتراک فعال دارد" }, { status: 400 });
        }
        if (days <= 0) {
          return NextResponse.json({ error: "تعداد روز نامعتبر" }, { status: 400 });
        }
        const endsAt = new Date();
        endsAt.setDate(endsAt.getDate() + days);
        await prisma.subscription.create({
          data: {
            userId,
            startsAt: now,
            endsAt,
            coinsPaid: 0,
          },
        });
        break;
      }
      case "extend": {
        if (!activeSubscription) {
          return NextResponse.json({ error: "اشتراک فعالی برای تمدید وجود ندارد" }, { status: 400 });
        }
        if (days <= 0) {
          return NextResponse.json({ error: "تعداد روز نامعتبر" }, { status: 400 });
        }
        const endsAt = new Date(activeSubscription.endsAt);
        endsAt.setDate(endsAt.getDate() + days);
        await prisma.subscription.update({
          where: { id: activeSubscription.id },
          data: { endsAt },
        });
        break;
      }
      case "shorten": {
        if (!activeSubscription) {
          return NextResponse.json({ error: "اشتراک فعالی برای کاهش وجود ندارد" }, { status: 400 });
        }
        if (days <= 0) {
          return NextResponse.json({ error: "تعداد روز نامعتبر" }, { status: 400 });
        }
        const endsAt = new Date(activeSubscription.endsAt);
        endsAt.setDate(endsAt.getDate() - days);
        if (endsAt < now) {
          await prisma.subscription.delete({ where: { id: activeSubscription.id } });
        } else {
          await prisma.subscription.update({
            where: { id: activeSubscription.id },
            data: { endsAt },
          });
        }
        break;
      }
    }

    console.log(`[admin] ${admin.id} subscription ${action} for user ${userId}, days=${days}`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    console.error("[admin/subscriptions] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
