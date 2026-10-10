// مدیریت پروفایل ویژه مدیر سایت برای ارسال پیام مدیریتی به کاربران
import { prisma } from "@/lib/prisma";
import { publishToConversation } from "@/lib/chatEvents";

// دریافت یا ساخت پروفایل ویژه مدیر
export async function getOrCreateAdminProfile(): Promise<{ id: string; firstName: string }> {
  const existing = await prisma.user.findFirst({
    where: { isAdminProfile: true },
    select: { id: true, firstName: true },
  });

  if (existing) return existing;

  // ساخت پروفایل مدیر
  const admin = await prisma.user.create({
    data: {
      phone: "00000000000",
      username: "admin_kandoo",
      password: "admin_profile_no_login",
      role: "ADMIN",
      gender: "FEMALE",
      firstName: "مدیر سایت",
      lastName: "کندو",
      province: "تهران",
      city: "تهران",
      age: 30,
      height: 170,
      weight: 65,
      income: 0,
      bio: "پروفایل رسمی مدیر سایت کندو — پیام های این بخش مدیریتی و غیرقابل پاسخ هستند",
      isVerified: true,
      isActive: true,
      isAdminProfile: true,
    },
    select: { id: true, firstName: true },
  });

  console.log("[admin-profile] Created admin profile:", admin.id);
  return admin;
}

// ارسال پیام مدیریتی به کاربر
export async function sendAdminMessage(
  targetUserId: string,
  message: string
): Promise<boolean> {
  try {
    const admin = await getOrCreateAdminProfile();

    // پیدا کردن یا ساخت گفتگو بین مدیر و کاربر
    const existingConv = await prisma.conversation.findFirst({
      where: {
        OR: [
          { userAId: admin.id, userBId: targetUserId },
          { userAId: targetUserId, userBId: admin.id },
        ],
      },
    });

    let conversationId: string;
    if (existingConv) {
      conversationId = existingConv.id;
      // ریست deletedBy اگر کاربر گفتگو را حذف کرده
      const isUserA = existingConv.userAId === targetUserId;
      if (isUserA && existingConv.deletedByA) {
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { deletedByA: false },
        });
      } else if (!isUserA && existingConv.deletedByB) {
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { deletedByB: false },
        });
      }
    } else {
      const conv = await prisma.conversation.create({
        data: {
          userAId: admin.id,
          userBId: targetUserId,
          startedBy: admin.id,
        },
      });
      conversationId = conv.id;
    }

    // ارسال پیام به صورت TEXT تا در چت به عنوان پیام عادی نمایش داده شود
    const msg = await prisma.message.create({
      data: {
        conversationId,
        senderId: admin.id,
        content: message,
        type: "TEXT",
        isRead: false,
      },
      include: {
        replyTo: { select: { id: true, content: true, type: true, senderId: true } },
      },
    });
    publishToConversation(conversationId, "message", msg);

    // به‌روزرسانی updatedAt گفتگو
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return true;
  } catch (err) {
    console.error("[admin-profile] sendAdminMessage error:", err);
    return false;
  }
}
