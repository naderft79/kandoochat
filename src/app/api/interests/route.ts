// API علایق — لیست و ثبت
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth";

// GET — لیست همه علایق + علایق کاربر
export async function GET() {
  try {
    const user = await requireUser();
    const [interests, userInterests] = await Promise.all([
      prisma.interest.findMany({ orderBy: { name: "asc" } }),
      prisma.userInterest.findMany({
        where: { userId: user.id },
        include: { interest: true },
      }),
    ]);
    return NextResponse.json({
      interests,
      userInterestIds: userInterests.map((ui) => ui.interestId),
    });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

// POST — ثبت علایق کاربر (جایگزین کامل)
export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const { interestIds } = body as { interestIds: string[] };

    if (!Array.isArray(interestIds)) {
      return NextResponse.json({ error: "اطلاعات نامعتبر" }, { status: 400 });
    }

    // حذف علایق قبلی
    await prisma.userInterest.deleteMany({
      where: { userId: user.id },
    });

    // ثبت علایق جدید
    if (interestIds.length > 0) {
      await prisma.userInterest.createMany({
        data: interestIds.map((interestId) => ({
          userId: user.id,
          interestId,
        })),
      });
    }

    console.log(`[interests] user ${user.id} set ${interestIds.length} interests`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[interests POST] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
