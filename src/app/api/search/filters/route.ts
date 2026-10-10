// ذخیره و بازیابی آخرین فیلترهای جستجوی کاربر
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth";

const num = z.string().max(9).regex(/^\d*$/);
const schema = z.object({
  city: z.string().max(40),
  // استان برای فیلترهای قدیمی ذخیره شده ممکن است وجود نداشته باشد
  province: z.string().max(40).optional(),
  ageMin: num,
  ageMax: num,
  heightMin: num,
  heightMax: num,
  hasPhoto: z.boolean(),
});

export async function GET() {
  try {
    const user = await requireUser();
    const s = await prisma.userSettings.findUnique({ where: { userId: user.id }, select: { savedFilters: true } });
    const parsed = schema.safeParse(s?.savedFilters);
    return NextResponse.json({ filters: parsed.success ? parsed.data : null });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[search/filters GET] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireUser();
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "فیلتر نامعتبر" }, { status: 400 });
    await prisma.userSettings.upsert({
      where: { userId: user.id },
      update: { savedFilters: parsed.data },
      create: { userId: user.id, savedFilters: parsed.data },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[search/filters PUT] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
