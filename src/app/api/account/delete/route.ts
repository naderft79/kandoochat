// حذف خودکار حساب توسط خود کاربر — با تایید رمز عبور
// از همان حذف نرم ادمین استفاده می شود؛ تا ۳۰ روز بازیابی با پشتیبانی ممکن است
import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireUser, destroySession, AuthError } from "@/lib/auth";
import { softDeleteUser, DeleteUserError } from "@/lib/user-deletion";

const schema = z.object({
  password: z.string().min(1, "رمز عبور الزامی است").max(100),
  reason: z.string().max(300).optional(),
});

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "اطلاعات نامعتبر است" }, { status: 400 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { password: true },
    });
    if (!dbUser || !(await bcrypt.compare(parsed.data.password, dbUser.password))) {
      return NextResponse.json({ error: "رمز عبور اشتباه است" }, { status: 400 });
    }

    const reason = parsed.data.reason?.trim()
      ? `حذف خودکار توسط کاربر: ${parsed.data.reason.trim()}`
      : "حذف خودکار توسط کاربر";

    await softDeleteUser(user.id, user.id, reason);
    await destroySession();
    console.log(`[account/delete] user ${user.id} self-deleted`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    if (err instanceof DeleteUserError)
      return NextResponse.json({ error: "امکان حذف حساب وجود ندارد" }, { status: 400 });
    console.error("[account/delete] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
