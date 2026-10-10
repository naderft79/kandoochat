// API ذخیره اشتراک Push Notification
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth";

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
});

const fcmSchema = z.object({
  fcmToken: z.string().min(10).max(512),
  platform: z.string().max(20).optional(),
});

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();

    // ثبت توکن FCM اپ اندروید — برای پوش وقتی اپ بسته است
    const fcm = fcmSchema.safeParse(body);
    if (fcm.success) {
      await prisma.fcmToken.upsert({
        where: { token: fcm.data.fcmToken },
        update: { userId: user.id, platform: fcm.data.platform ?? "android" },
        create: { userId: user.id, token: fcm.data.fcmToken, platform: fcm.data.platform ?? "android" },
      });
      return NextResponse.json({ ok: true });
    }

    const parsed = subscribeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "اشتراک نامعتبر است" }, { status: 400 });
    }

    const { endpoint, keys } = parsed.data;
    const userAgent = request.headers.get("user-agent") || undefined;

    await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: { userId: user.id, p256dh: keys.p256dh, auth: keys.auth, userAgent },
      create: { userId: user.id, endpoint, p256dh: keys.p256dh, auth: keys.auth, userAgent },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[push/subscribe] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
