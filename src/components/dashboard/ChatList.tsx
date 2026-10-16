// لیست گفتگوها (ستون لیست در چیدمان چت)
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import {
  SquarePen,
  ImageIcon,
  Mic,
  Video,
  Gift,
  ArrowLeft,
  Shield,
  Sparkles,
} from "lucide-react";
import VerifiedBadge from "@/components/dashboard/VerifiedBadge";
import DefaultAvatar from "@/components/dashboard/DefaultAvatar";
import { PresenceDot, PresenceLastSeen } from "@/components/dashboard/PresenceBits";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { formatTime, toPersianDigits } from "@/lib/format";
import PageHeader from "@/components/dashboard/PageHeader";
import CoinBadge from "@/components/dashboard/CoinBadge";
import ChatListLive from "@/components/dashboard/ChatListLive";
import ConversationActionsMenu from "@/components/dashboard/ConversationActionsMenu";
import { getOrCreateAIConversation } from "@/lib/aiCompanion";

export default async function ChatList() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // ایجاد یا دریافت گفتگو با همراه هوش مصنوعی (براساس جنسیت کاربر)
  // خطا در این بخش نباید کل صفحه را بکشد — بدون همراه ادامه می دهیم
  let aiConversation: { id: string } | null = null;
  let aiConfig: { firstName: string; gradient: string } | null = null;
  try {
    const ai = await getOrCreateAIConversation(user.id);
    aiConversation = ai.conversation;
    aiConfig = ai.config;
  } catch (err) {
    console.error("[chat] ai companion init failed:", err);
  }

  const conversations = await prisma.conversation.findMany({
    where: { OR: [{ userAId: user.id }, { userBId: user.id }] },
    include: {
      userA: {
        select: {
          id: true,
          firstName: true,
          username: true,
          gender: true,
          isVerified: true,
          isOnline: true,
          lastSeen: true,
          isAdminProfile: true,
          isAICompanion: true,
          deletedAt: true,
          photos: {
            select: { url: true, order: true },
            where: {
              isVerified: true,
              isRejected: false,
              isDeletedByUser: false,
              isProfile: true,
            },
            take: 1,
          },
        },
      },
      userB: {
        select: {
          id: true,
          firstName: true,
          username: true,
          gender: true,
          isVerified: true,
          isOnline: true,
          lastSeen: true,
          isAdminProfile: true,
          isAICompanion: true,
          deletedAt: true,
          photos: {
            select: { url: true, order: true },
            where: {
              isVerified: true,
              isRejected: false,
              isDeletedByUser: false,
              isProfile: true,
            },
            take: 1,
          },
        },
      },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
      _count: {
        select: {
          messages: { where: { isRead: false, senderId: { not: user.id } } },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  // فیلتر: گفتگوهایی که کاربر فعلی حذف کرده فقط اگر پیام جدید خوانده نشده دارد نمایش داده شود
  const visibleConversations = conversations.filter((c) => {
    const iAmA = c.userAId === user.id;
    const iDeleted = iAmA ? c.deletedByA : c.deletedByB;
    if (!iDeleted) return true;
    // اگر حذف کرده اما پیام جدید خوانده نشده از طرف مقابل دارد، نمایش بده
    const unread = c._count.messages;
    return unread > 0;
  });

  // جدا کردن همراه هوش مصنوعی از سایر گفتگوها
  // همراه هوش مصنوعی همیشه بالای لیست پین است (حتی اگر قبلا حذف شده باشد)
  const aiConv = aiConversation
    ? conversations.find((c) => c.id === aiConversation.id)
    : undefined;
  const otherConversations = visibleConversations.filter(
    (c) => c.id !== aiConversation?.id
  );

  function getLastMessagePreview(content: string, type: string) {
    if (type === "IMAGE") return "عکس";
    if (type === "VOICE") return "پیام صوتی";
    if (type === "VIDEO") return "ویدیو";
    if (type === "STICKER") return "استیکر";
    if (type === "SYSTEM") return "سیستم";
    return content;
  }

  function getLastMessageIcon(type: string) {
    if (type === "IMAGE")
      return <ImageIcon className="w-3.5 h-3.5 text-ig-gray" />;
    if (type === "VOICE") return <Mic className="w-3.5 h-3.5 text-ig-gray" />;
    if (type === "VIDEO") return <Video className="w-3.5 h-3.5 text-ig-gray" />;
    if (type === "SYSTEM") return <Gift className="w-3.5 h-3.5 text-ig-gray" />;
    return null;
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* تازه سازی زنده لیست با پیام جدید */}
      <ChatListLive />
      {/* هدر یکپارچه */}
      <PageHeader
        title="پیام ها"
        subtitle={`${toPersianDigits(visibleConversations.length)} گفتگو`}
        right={
          <Link
            href="/dashboard/search"
            className="p-1.5 rounded-lg hover:bg-ig-gray-bg active:scale-90 transition-all"
            title="گفتگوی جدید"
          >
            <SquarePen className="w-6 h-6 text-foreground" strokeWidth={1.5} />
          </Link>
        }
        left={<CoinBadge />}
      />

      {/* لیست گفتگوها */}
      <div className="flex-1 overflow-y-auto thin-scroll">
        {/* گفتگوی همراه هوش مصنوعی - پین شده در بالا */}
        {aiConv && aiConfig && (
          <div
            className="flex items-center gap-3 px-4 py-3 border-b border-ig-border/50 bg-ig-gray-bg opacity-80 cursor-default"
          >
            {/* آواتار همراه */}
            <div className="relative shrink-0">
              <div
                className={`w-14 h-14 rounded-full bg-gradient-to-br ${aiConfig.gradient} flex items-center justify-center overflow-hidden`}
              >
                {(() => {
                  const aiPhoto = (aiConv.userAId === user.id ? aiConv.userB : aiConv.userA).photos?.[0]?.url;
                  return aiPhoto ? (
                    <div className="relative w-full h-full">
                      <Image
                        src={aiPhoto}
                        alt={aiConfig.firstName}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    </div>
                  ) : (
                    <Sparkles
                      className="w-6 h-6 text-white"
                      strokeWidth={1.5}
                    />
                  );
                })()}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-ig-online rounded-full border-2 border-white ig-pulse" />
              {aiConv._count.messages > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[20px] h-5 bg-ig-red rounded-full flex items-center justify-center text-xs font-bold text-white px-1.5">
                  {toPersianDigits(aiConv._count.messages)}
                </span>
              )}
            </div>

            {/* نام + بج بزودی */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold flex items-center gap-1.5">
                {aiConfig.firstName}
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-ig-blue/10 text-ig-blue text-[10px] font-bold">
                  بزودی
                </span>
              </p>
              <p className="text-sm truncate text-ig-gray">
                {`با ${aiConfig.firstName} درد دل کن، مشاوره و یا راهنمایی بگیر`}
              </p>
            </div>

            {/* زمان */}
            <div className="flex flex-col items-end gap-0.5 shrink-0" />
          </div>
        )}

        {/* سایر گفتگوها */}
        {otherConversations.map((c) => {
          const other = c.userAId === user.id ? c.userB : c.userA;
          const otherDeleted = !!other.deletedAt;
          const lastMessage = c.messages[0];
          const unread = c._count.messages;
          return (
            <ConversationActionsMenu
              key={c.id}
              conversationId={c.id}
              targetId={other.id}
              targetName={otherDeleted ? "کاربر حذف شده" : other.firstName}
              targetUsername={other.username}
              targetPhoto={other.photos?.[0]?.url ?? null}
              targetVerified={other.isVerified}
              isAdminProfile={other.isAdminProfile}
              isDeletedAccount={otherDeleted}
            >
            <Link
              href={`/dashboard/chat/${c.id}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-ig-gray-bg transition-colors border-b border-ig-border/50"
            >
              {/* آواتار */}
              <div className="relative shrink-0">
                {other.photos?.[0]?.url && !otherDeleted ? (
                  <div className="relative w-14 h-14 rounded-full overflow-hidden">
                    <Image
                      src={other.photos[0].url}
                      alt={otherDeleted ? "کاربر حذف شده" : other.firstName}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  </div>
                ) : (
                  <DefaultAvatar size={56} />
                )}
                {!otherDeleted && (
                  <PresenceDot userId={other.id} initialOnline={other.isOnline} />
                )}
                {unread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[20px] h-5 bg-ig-red rounded-full flex items-center justify-center text-xs font-bold text-white px-1.5">
                    {toPersianDigits(unread)}
                  </span>
                )}
              </div>

              {/* نام + آخرین پیام */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold flex items-center gap-1 ${otherDeleted ? "text-ig-gray" : ""}`}>
                  {otherDeleted ? "کاربر حذف شده" : other.firstName}
                  {other.isAdminProfile && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-ig-gray-bg text-foreground text-xs font-bold">
                      <Shield className="w-3 h-3" />
                      مدیریتی
                    </span>
                  )}
                  {other.isVerified && !other.isAdminProfile && !otherDeleted && (
                    <VerifiedBadge className="w-3.5 h-3.5" />
                  )}
                </p>
                <p
                  className={`text-sm truncate flex items-center gap-1 ${
                    unread > 0 ? "text-foreground font-bold" : "text-ig-gray"
                  }`}
                >
                  {getLastMessageIcon(lastMessage?.type || "TEXT")}
                  {lastMessage
                    ? getLastMessagePreview(
                        lastMessage.content,
                        lastMessage.type
                      )
                    : "گفتگو را شروع کنید..."}
                </p>
              </div>

              {/* زمان */}
              <div className="flex flex-col items-end gap-0.5 shrink-0">
                {lastMessage ? (
                  <span
                    className={`text-xs ${
                      unread > 0 ? "text-ig-blue font-bold" : "text-ig-gray"
                    }`}
                  >
                    {formatTime(lastMessage.createdAt)}
                  </span>
                ) : !otherDeleted ? (
                  <PresenceLastSeen
                    userId={other.id}
                    initialOnline={other.isOnline}
                    initialLastSeen={other.lastSeen?.toISOString() ?? null}
                  />
                ) : null}
              </div>
            </Link>
            </ConversationActionsMenu>
          );
        })}
        {otherConversations.length === 0 && (
          <div className="flex flex-col items-center text-center px-8 py-12 ig-fade-in">
            <p className="text-base font-bold text-foreground mb-1">
              هنوز گفتگویی ندارید
            </p>
            <p className="text-sm text-ig-gray mb-4">
              از بخش جستجو با پروفایل ها آشنا شوید
            </p>
            <Link
              href="/dashboard/search"
              className="inline-flex items-center gap-2 px-5 h-10 rounded-lg bg-ig-blue text-white text-sm font-bold hover:bg-ig-blue-hover transition-colors"
            >
              دیدن پروفایل ها
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>

      {/* دکمه شناور مداد با منوی سریع */}
    </div>
  );
}
