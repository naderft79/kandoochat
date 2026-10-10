// API مدیریت علایق توسط ادمین — CRUD
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, AuthError } from "@/lib/auth";
import { logAction } from "@/lib/audit";

export async function GET() {
  try {
    await requireAdmin();
    const interests = await prisma.interest.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { users: true } },
      },
    });
    return NextResponse.json({ interests });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[admin interests GET] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const { name, icon } = body;

    if (!name || !icon) {
      return NextResponse.json({ error: "نام و آیکن الزامی است" }, { status: 400 });
    }

    const existing = await prisma.interest.findUnique({ where: { name } });
    if (existing) {
      return NextResponse.json({ error: "این علاقه قبلا ثبت شده است" }, { status: 400 });
    }

    const interest = await prisma.interest.create({
      data: { name, icon },
    });

    await logAction(admin.id, "UPDATE_SETTINGS", "SETTING", `ساخت علاقه: ${name}`);

    return NextResponse.json({ ok: true, interest });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[admin interests POST] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const { id, name, icon } = body;

    if (!id) {
      return NextResponse.json({ error: "شناسه الزامی است" }, { status: 400 });
    }

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (icon !== undefined) data.icon = icon;

    const interest = await prisma.interest.update({
      where: { id },
      data,
    });

    await logAction(admin.id, "UPDATE_SETTINGS", "SETTING", `ویرایش علاقه: ${interest.name}`);

    return NextResponse.json({ ok: true, interest });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[admin interests PUT] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const admin = await requireAdmin();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "شناسه الزامی است" }, { status: 400 });
    }

    const interest = await prisma.interest.delete({ where: { id } });

    await logAction(admin.id, "UPDATE_SETTINGS", "SETTING", `حذف علاقه: ${interest.name}`);

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[admin interests DELETE] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
