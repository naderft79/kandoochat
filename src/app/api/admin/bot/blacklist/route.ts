// API مدیریت لیست سیاه و سفید ربات
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, AuthError } from "@/lib/auth";
import { setSetting, invalidateSettingsCache } from "@/lib/settings";

// GET — دریافت لیست سیاه و سفید
export async function GET(request: Request) {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    throw e;
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "blacklist";
  const search = searchParams.get("search");

  // جستجوی کاربر برای افزودن
  if (search) {
    const users = await prisma.user.findMany({
      where: {
        isFake: false,
        OR: [
          { username: { contains: search } },
          { phone: { contains: search } },
          { firstName: { contains: search } },
        ],
      },
      select: {
        id: true,
        firstName: true,
        username: true,
        phone: true,
        city: true,
        gender: true,
        age: true,
        photos: { select: { url: true }, where: { isProfile: true, isDeletedByUser: false }, take: 1 },
      },
      take: 10,
    });
    return NextResponse.json({ searchResults: users });
  }

  if (type === "blacklist") {
    const items = await prisma.botExclude.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ items });
  } else {
    const items = await prisma.botWhitelist.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ items });
  }
}

// POST — افزودن به لیست
export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    throw e;
  }

  const body = await request.json();
  const { userId, reason, type, addedBy } = body;

  if (!userId) {
    return NextResponse.json({ error: "شناسه کاربر الزامی است" }, { status: 400 });
  }

  if (type === "blacklist") {
    try {
      const item = await prisma.botExclude.create({
        data: { userId, reason, addedBy: addedBy || "admin" },
      });
      return NextResponse.json({ item });
    } catch {
      return NextResponse.json({ error: "این کاربر قبلا در لیست سیاه وجود دارد" }, { status: 409 });
    }
  } else {
    try {
      const item = await prisma.botWhitelist.create({
        data: { userId, reason, addedBy: addedBy || "admin" },
      });
      return NextResponse.json({ item });
    } catch {
      return NextResponse.json({ error: "این کاربر قبلا در لیست سفید وجود دارد" }, { status: 409 });
    }
  }
}

// DELETE — حذف از لیست
export async function DELETE(request: Request) {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    throw e;
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const type = searchParams.get("type") || "blacklist";

  if (!id) {
    return NextResponse.json({ error: "شناسه الزامی است" }, { status: 400 });
  }

  if (type === "blacklist") {
    await prisma.botExclude.delete({ where: { id } });
  } else {
    await prisma.botWhitelist.delete({ where: { id } });
  }

  return NextResponse.json({ ok: true });
}

// PUT — فعال/غیرفعال لیست سفید
export async function PUT(request: Request) {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    throw e;
  }

  const body = await request.json();
  const { useWhitelist } = body;

  await setSetting("BOT_USE_WHITELIST", useWhitelist ? "true" : "false");
  invalidateSettingsCache();

  return NextResponse.json({ ok: true });
}
