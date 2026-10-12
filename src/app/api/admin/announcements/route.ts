// مدیریت اطلاعیه های سراسری — فقط سوپر ادمین
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin, AuthError } from "@/lib/auth";
import { sanitizeString } from "@/lib/sanitize";

const createSchema = z.object({
  title: z.string().min(1).max(120),
  body: z.string().min(1).max(500),
  type: z.enum(["INFO", "WARNING", "PROMO"]).default("INFO"),
  startsAt: z.string().datetime({ offset: true }).optional(),
  endsAt: z.string().datetime({ offset: true }).optional().nullable(),
});

const patchSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(120).optional(),
  body: z.string().min(1).max(500).optional(),
  type: z.enum(["INFO", "WARNING", "PROMO"]).optional(),
  isActive: z.boolean().optional(),
  endsAt: z.string().datetime({ offset: true }).optional().nullable(),
});

export async function POST(request: Request) {
  try {
    const admin = await requireSuperAdmin();
    const parsed = createSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "اطلاعات نامعتبر است" }, { status: 400 });
    }
    const d = parsed.data;
    const item = await prisma.announcement.create({
      data: {
        title: sanitizeString(d.title, 120),
        body: sanitizeString(d.body, 500),
        type: d.type,
        startsAt: d.startsAt ? new Date(d.startsAt) : new Date(),
        endsAt: d.endsAt ? new Date(d.endsAt) : null,
        createdById: admin.id,
      },
    });
    console.log(`[announcements] admin ${admin.id} created ${item.id}`);
    return NextResponse.json({ ok: true, item });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    console.error("[announcements POST] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    await requireSuperAdmin();
    const parsed = patchSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "اطلاعات نامعتبر است" }, { status: 400 });
    }
    const { id, ...fields } = parsed.data;
    await prisma.announcement.update({
      where: { id },
      data: {
        ...(fields.title !== undefined && { title: sanitizeString(fields.title, 120) }),
        ...(fields.body !== undefined && { body: sanitizeString(fields.body, 500) }),
        ...(fields.type !== undefined && { type: fields.type }),
        ...(fields.isActive !== undefined && { isActive: fields.isActive }),
        ...(fields.endsAt !== undefined && {
          endsAt: fields.endsAt ? new Date(fields.endsAt) : null,
        }),
      },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    console.error("[announcements PATCH] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await requireSuperAdmin();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "شناسه الزامی است" }, { status: 400 });
    await prisma.announcement.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    console.error("[announcements DELETE] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
