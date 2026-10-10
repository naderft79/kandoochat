// تابع ثبت لاگ اقدامات ادمین
import { prisma } from "@/lib/prisma";

export async function logAction(
  adminId: string,
  action: string,
  targetType: string,
  targetId?: string,
  details?: string
) {
  try {
    await prisma.auditLog.create({
      data: {
        adminId,
        action,
        targetType,
        ...(targetId ? { targetId } : {}),
        ...(details ? { details } : {}),
      },
    });
  } catch (err) {
    // خطای لاگ نباید جریان اصلی را قطع کند
    console.error("[audit] failed to log action:", err);
  }
}
