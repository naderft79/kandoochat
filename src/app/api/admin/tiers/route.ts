// API مدیریت سطح اشتراک توسط ادمین
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, AuthError } from "@/lib/auth";
import { logAction } from "@/lib/audit";

const tierSchema = z.object({
  key: z.enum(["BASIC", "PREMIUM", "VIP"]),
  name: z.string().min(1).max(50),
  coinsPerMonth: z.coerce.number().int().min(0),
  dailyLikes: z.coerce.number().int().min(0),
  dailySuperLikes: z.coerce.number().int().min(0),
  canSeeLikers: z.boolean().default(false),
  canRewindLast: z.boolean().default(false),
  canHideOnline: z.boolean().default(false),
  canSendGifts: z.boolean().default(false),
  profileBoost: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export async function GET() {
  try {
    await requireAdmin();
    const tiers = await prisma.subscriptionTier.findMany({
      orderBy: { coinsPerMonth: "asc" },
    });

    // اگر هیچ tier ای وجود نداشت، مقادیر پیش فرض بساز
    if (tiers.length === 0) {
      const defaults = [
        {
          key: "BASIC",
          name: "پایه",
          coinsPerMonth: 100,
          dailyLikes: 30,
          dailySuperLikes: 1,
          canSeeLikers: false,
          canRewindLast: false,
          canHideOnline: false,
          canSendGifts: false,
          profileBoost: false,
        },
        {
          key: "PREMIUM",
          name: "پرمیوم",
          coinsPerMonth: 300,
          dailyLikes: 60,
          dailySuperLikes: 3,
          canSeeLikers: true,
          canRewindLast: true,
          canHideOnline: true,
          canSendGifts: true,
          profileBoost: false,
        },
        {
          key: "VIP",
          name: "VIP",
          coinsPerMonth: 600,
          dailyLikes: 100,
          dailySuperLikes: 5,
          canSeeLikers: true,
          canRewindLast: true,
          canHideOnline: true,
          canSendGifts: true,
          profileBoost: true,
        },
      ];
      await prisma.subscriptionTier.createMany({ data: defaults });
      const created = await prisma.subscriptionTier.findMany({
        orderBy: { coinsPerMonth: "asc" },
      });
      return NextResponse.json({ tiers: created });
    }

    return NextResponse.json({ tiers });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[admin tiers GET] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const parsed = tierSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "اطلاعات نامعتبر" }, { status: 400 });
    }

    const data = parsed.data;
    const tier = await prisma.subscriptionTier.upsert({
      where: { key: data.key },
      update: {
        name: data.name,
        coinsPerMonth: data.coinsPerMonth,
        dailyLikes: data.dailyLikes,
        dailySuperLikes: data.dailySuperLikes,
        canSeeLikers: data.canSeeLikers,
        canRewindLast: data.canRewindLast,
        canHideOnline: data.canHideOnline,
        canSendGifts: data.canSendGifts,
        profileBoost: data.profileBoost,
        isActive: data.isActive,
      },
      create: data,
    });

    await logAction(admin.id, "UPDATE_TIER", "TIER", tier.id, data.key);
    console.log(`[admin tiers PUT] ${admin.id} updated tier ${data.key}`);
    return NextResponse.json({ ok: true, tier });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[admin tiers PUT] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
