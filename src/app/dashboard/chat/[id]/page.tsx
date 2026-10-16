// صفحه اتاق گفتگو
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { hasActiveSubscription } from "@/lib/finance";
import ChatRoom from "@/components/dashboard/ChatRoom";
import { getCompanionConfigByCompanionId } from "@/lib/aiCompanion";
import { getTransferStatuses } from "@/lib/transferStatus";

export default async function ChatRoomPage({
  params,
}: PageProps<"/dashboard/chat/[id]">) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: {
      userA: {
        select: { id: true, firstName: true, username: true, gender: true, isVerified: true, isOnline: true, lastSeen: true, isAdminProfile: true, isAICompanion: true, photos: { select: { url: true, order: true }, where: { isVerified: true, isRejected: false, isDeletedByUser: false, isProfile: true }, take: 1 } },
      },
      userB: {
        select: { id: true, firstName: true, username: true, gender: true, isVerified: true, isOnline: true, lastSeen: true, isAdminProfile: true, isAICompanion: true, photos: { select: { url: true, order: true }, where: { isVerified: true, isRejected: false, isDeletedByUser: false, isProfile: true }, take: 1 } },
      },
      messages: {
        // آخرین پیام ها؛ صفحه بندی پیام های قدیمی تر در کلاینت انجام می شود
        orderBy: { createdAt: "desc" },
        take: 51,
        include: {
          replyTo: { select: { id: true, content: true, type: true, senderId: true } },
        },
      },
    },
  });

  // فقط اعضای گفتگو اجازه دسترسی دارند
  if (
    !conversation ||
    (conversation.userAId !== user.id && conversation.userBId !== user.id)
  ) {
    notFound();
  }

  const other =
    conversation.userAId === user.id ? conversation.userB : conversation.userA;

  // پیام ها desc گرفته شده اند؛ به asc برمی گردانیم و وجود پیام قدیمی تر را تشخیص می دهیم
  const hasMoreMessages = conversation.messages.length > 50;
  const initialMessages = conversation.messages.slice(0, 50).reverse();

  // بررسی اینکه آیا کاربر مقابل پروفایل مدیریتی است
  const isAdminChat = other.isAdminProfile === true;
  const isAIChat = other.isAICompanion === true;

  // هانی و آقای زنبور فعلا غیرفعال هستند — ورود به گفتگو با آن ها ممکن نیست
  if (isAIChat) redirect("/dashboard/chat");

  // دریافت کانفیگ همراه هوش مصنوعی (تم رنگی)
  const aiConfig = isAIChat ? await getCompanionConfigByCompanionId(other.id) : null;
  const aiGradient = aiConfig?.gradient ?? "";

  // قفل اشتراک: شروع کننده گفتگو باید اشتراک فعال داشته باشد (هانی مستثنی است)
  const starterSub = isAIChat || await hasActiveSubscription(conversation.startedBy);
  // اگر گفتگو بسته شده ولی من اشتراک دارم می توانم آن را دوباره آغاز کنم
  const canReopen = !starterSub && (await hasActiveSubscription(user.id));

  // بررسی قفل ارسال پیام کاربر فعلی
  const messageLockActive = user.messageLockUntil ? new Date(user.messageLockUntil) > new Date() : false;
  const messageLockInfo = messageLockActive
    ? { until: user.messageLockUntil!.toISOString(), reason: user.messageLockReason ?? "" }
    : null;

  // بررسی بلاک دو طرفه
  const [iBlockedOther, otherBlockedMe] = await Promise.all([
    prisma.block.findUnique({
      where: { blockerId_blockedId: { blockerId: user.id, blockedId: other.id } },
    }).then(Boolean),
    prisma.block.findUnique({
      where: { blockerId_blockedId: { blockerId: other.id, blockedId: user.id } },
    }).then(Boolean),
  ]);

  // ریست deletedBy اگر کاربر وارد گفتگوی حذف شده خود شده است
  const isUserA = conversation.userAId === user.id;
  const iDeleted = isUserA ? conversation.deletedByA : conversation.deletedByB;
  if (iDeleted) {
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: isUserA ? { deletedByA: false } : { deletedByB: false },
    });
  }

  // علامت گذاری پیام های دریافتی به عنوان خوانده شده
  await prisma.message.updateMany({
    where: { conversationId: id, senderId: { not: user.id }, isRead: false },
    data: { isRead: true },
  });

  // وضعیت فعلی درخواست های سکه برای نمایش درست کارت ها
  const initialTransferStatuses = await getTransferStatuses(initialMessages);

  return (
    <ChatRoom
      conversationId={conversation.id}
      currentUserId={user.id}
      otherUserId={other.id}
      otherName={other.firstName}
      otherUsername={other.username}
      otherVerified={other.isVerified}
      otherOnline={other.isOnline}
      otherLastSeen={other.lastSeen.toISOString()}
      otherPhoto={other.photos?.[0]?.url ?? null}
      canReopen={canReopen}
      canSend={starterSub && !iBlockedOther && !otherBlockedMe && !messageLockActive}
      iBlockedOther={iBlockedOther}
      otherBlockedMe={otherBlockedMe}
      messageLockInfo={messageLockInfo}
      isAdminChat={isAdminChat}
      isAIChat={isAIChat}
      aiGradient={aiGradient}
      initialHasMore={hasMoreMessages}
      initialTransferStatuses={initialTransferStatuses}
      initialMessages={initialMessages.map((m) => ({
        id: m.id,
        senderId: m.senderId,
        content: m.content,
        type: m.type,
        mediaUrl: m.mediaUrl,
        duration: m.duration,
        isRead: m.isRead,
        createdAt: m.createdAt.toISOString(),
        replyTo: m.replyTo ? {
          id: m.replyTo.id,
          content: m.replyTo.content,
          type: m.replyTo.type,
          senderId: m.replyTo.senderId,
        } : null,
        reaction: m.reaction,
      }))}
    />
  );
}
