// API تنظیمات شخصی کاربر (نوتیفیکیشن و حریم خصوصی)
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth";

const settingsSchema = z.object({
  notifLikes: z.boolean().optional(),
  notifMessages: z.boolean().optional(),
  notifSuperLikes: z.boolean().optional(),
  notifProfileViews: z.boolean().optional(),
  notifGifts: z.boolean().optional(),
  notifStreak: z.boolean().optional(),
  privacyShowOnline: z.boolean().optional(),
  privacyShowAge: z.boolean().optional(),
  privacyShowIncome: z.boolean().optional(),
  privacyOnlyVerified: z.boolean().optional(),
});

export async function GET() {
  try {
    const user = await requireUser();
    let settings = await prisma.userSettings.findUnique({
      where: { userId: user.id },
    });
    if (!settings) {
      settings = await prisma.userSettings.create({
        data: { userId: user.id },
      });
    }
    return NextResponse.json({ settings });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[settings GET] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const parsed = settingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "اطلاعات نامعتبر است" }, { status: 400 });
    }

    const settings = await prisma.userSettings.upsert({
      where: { userId: user.id },
      update: parsed.data,
      create: { userId: user.id, ...parsed.data },
    });

    console.log(`[settings] user ${user.id} updated settings`);
    return NextResponse.json({ settings });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[settings PUT] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
