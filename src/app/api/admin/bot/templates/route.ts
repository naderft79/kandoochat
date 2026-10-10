// API مدیریت قالب‌های داینامیک ربات — CRUD
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, AuthError } from "@/lib/auth";

// دریافت لیست قالب‌های داینامیک
export async function GET(request: Request) {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    throw e;
  }

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const activeOnly = searchParams.get("active") === "true";

  const where: Record<string, unknown> = {};
  if (category) where.category = category;
  if (activeOnly) where.isActive = true;

  const templates = await prisma.botTemplate.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ templates });
}

// ایجاد قالب جدید
export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    throw e;
  }

  const body = await request.json();
  const { text, category, senderGender, targetGender, weight } = body;

  if (!text || !category) {
    return NextResponse.json({ error: "متن و دسته الزامی است" }, { status: 400 });
  }

  const template = await prisma.botTemplate.create({
    data: {
      text,
      category,
      senderGender: senderGender || "FEMALE",
      targetGender: targetGender || "MALE",
      weight: weight || 1,
    },
  });

  return NextResponse.json({ template });
}

// ویرایش قالب
export async function PUT(request: Request) {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    throw e;
  }

  const body = await request.json();
  const { id, text, category, senderGender, targetGender, isActive, weight } = body;

  if (!id) {
    return NextResponse.json({ error: "شناسه الزامی است" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (text !== undefined) data.text = text;
  if (category !== undefined) data.category = category;
  if (senderGender !== undefined) data.senderGender = senderGender;
  if (targetGender !== undefined) data.targetGender = targetGender;
  if (isActive !== undefined) data.isActive = isActive;
  if (weight !== undefined) data.weight = weight;

  const template = await prisma.botTemplate.update({
    where: { id },
    data,
  });

  return NextResponse.json({ template });
}

// حذف قالب
export async function DELETE(request: Request) {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    throw e;
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "شناسه الزامی است" }, { status: 400 });
  }

  await prisma.botTemplate.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
