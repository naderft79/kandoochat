// API مدیریت ماموریت ها توسط ادمین — CRUD
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, AuthError } from "@/lib/auth";
import { logAction } from "@/lib/audit";

export async function GET() {
  try {
    await requireAdmin();
    const missions = await prisma.mission.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { userMissions: true } },
      },
    });
    return NextResponse.json({ missions });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[admin missions GET] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const { key, title, description, rewardCoins, target, icon } = body;

    if (!key || !title || !description || rewardCoins === undefined) {
      return NextResponse.json({ error: "اطلاعات ناقص" }, { status: 400 });
    }

    const existing = await prisma.mission.findUnique({ where: { key } });
    if (existing) {
      return NextResponse.json({ error: "کلید ماموریت تکراری است" }, { status: 400 });
    }

    const mission = await prisma.mission.create({
      data: {
        key,
        title,
        description,
        rewardCoins: parseInt(rewardCoins, 10),
        target: parseInt(target ?? "1", 10),
        icon: icon || "🎯",
      },
    });

    await logAction(admin.id, "UPDATE_SETTINGS", "SETTING", `ساخت ماموریت: ${title}`);

    return NextResponse.json({ ok: true, mission });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[admin missions POST] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const { id, title, description, rewardCoins, target, icon, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: "شناسه الزامی است" }, { status: 400 });
    }

    const data: Record<string, unknown> = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (rewardCoins !== undefined) data.rewardCoins = parseInt(rewardCoins, 10);
    if (target !== undefined) data.target = parseInt(target, 10);
    if (icon !== undefined) data.icon = icon;
    if (isActive !== undefined) data.isActive = isActive;

    const mission = await prisma.mission.update({
      where: { id },
      data,
    });

    await logAction(admin.id, "UPDATE_SETTINGS", "SETTING", `ویرایش ماموریت: ${mission.title}`);

    return NextResponse.json({ ok: true, mission });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[admin missions PUT] error:", err);
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

    const mission = await prisma.mission.delete({ where: { id } });

    await logAction(admin.id, "UPDATE_SETTINGS", "SETTING", `حذف ماموریت: ${mission.title}`);

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[admin missions DELETE] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
