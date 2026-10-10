// ساخت نوتیفیکیشن درون‌برنامه + ارسال push
import { prisma } from "@/lib/prisma";
import { sendPushToUser } from "@/lib/push";

export async function notifyUser(
  userId: string,
  type: string,
  title: string,
  body: string,
  options?: { url?: string; icon?: string; data?: string }
) {
  const notification = await prisma.notification.create({
    data: { userId, type, title, body, data: options?.data },
  });

  // ارسال push در پس‌زمینه — خطا نباید روی پاسخ API تاثیر بگذارد
  sendPushToUser(userId, {
    title,
    body,
    url: options?.url || "/dashboard/notifications",
    icon: options?.icon,
  }).catch(() => {});

  return notification;
}
