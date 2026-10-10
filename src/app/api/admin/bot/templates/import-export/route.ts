// API import/export قالب‌های داینامیک ربات
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, AuthError } from "@/lib/auth";

// GET — خروجی JSON تمام قالب‌ها
export async function GET() {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    throw e;
  }

  const templates = await prisma.botTemplate.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ templates, count: templates.length });
}

// POST — import قالب‌ها از JSON
export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    throw e;
  }

  const body = await request.json();
  const { templates, mode } = body as {
    templates: Array<{ text: string; category: string; senderGender?: string; targetGender?: string; weight?: number; isActive?: boolean }>;
    mode?: "merge" | "replace";
  };

  if (!templates || !Array.isArray(templates)) {
    return NextResponse.json({ error: "فرمت نامعتبر" }, { status: 400 });
  }

  let imported = 0;
  let skipped = 0;

  // حالت replace: حذف همه قالب‌های قبلی
  if (mode === "replace") {
    await prisma.botTemplate.deleteMany({});
  }

  for (const t of templates) {
    if (!t.text || !t.category) {
      skipped++;
      continue;
    }
    await prisma.botTemplate.create({
      data: {
        text: t.text,
        category: t.category,
        senderGender: t.senderGender || "FEMALE",
        targetGender: t.targetGender || "MALE",
        weight: t.weight || 1,
        isActive: t.isActive ?? true,
      },
    });
    imported++;
  }

  return NextResponse.json({ imported, skipped, total: templates.length });
}
