// API ماموریت های ویژه کاربر — گروه بندی و ادعای جایزه
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const REWARDS: Record<string, number> = {
  once: 5,
  daily: 5,
  monthly: 500,
};

async function checkClaimed(userId: string, tab: string): Promise<boolean> {
  const now = new Date();
  if (tab === "once") {
    const count = await prisma.transaction.count({
      where: { userId, type: "SPECIAL_MISSION_REWARD", description: "once" },
    });
    return count > 0;
  }
  if (tab === "daily") {
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const count = await prisma.transaction.count({
      where: { userId, type: "SPECIAL_MISSION_REWARD", description: "daily", createdAt: { gte: startOfToday } },
    });
    return count > 0;
  }
  if (tab === "monthly") {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const count = await prisma.transaction.count({
      where: { userId, type: "SPECIAL_MISSION_REWARD", description: "monthly", createdAt: { gte: startOfMonth } },
    });
    return count > 0;
  }
  return false;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!user.isSpecial) return NextResponse.json({ error: "شما کاربر ویژه نیستید" }, { status: 403 });

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const conversations = await prisma.conversation.findMany({
    where: { OR: [{ userAId: user.id }, { userBId: user.id }] },
    select: { id: true, createdAt: true },
  });

  const todayMessages = await prisma.message.findMany({
    where: { senderId: user.id, createdAt: { gte: startOfToday }, type: { in: ["TEXT", "IMAGE", "VOICE", "VIDEO"] } },
    select: { conversationId: true, type: true },
  });

  const todayChatIds = new Set(todayMessages.map((m) => m.conversationId));
  let newChatsToday = 0;
  let oldChatsToday = 0;
  for (const conv of conversations) {
    if (todayChatIds.has(conv.id)) {
      if (conv.createdAt >= startOfToday) newChatsToday++;
      else oldChatsToday++;
    }
  }

  const todayVoiceMessages = todayMessages.filter((m) => m.type === "VOICE");
  const todayVoiceChats = new Set(todayVoiceMessages.map((m) => m.conversationId));
  const todayImageMessages = todayMessages.filter((m) => m.type === "IMAGE");
  const todayImageChats = new Set(todayImageMessages.map((m) => m.conversationId));

  const todayLikes = await prisma.like.count({
    where: { senderId: user.id, createdAt: { gte: startOfToday } },
  });

  const monthlyReferrals = await prisma.referral.count({
    where: { referrerId: user.id, createdAt: { gte: startOfMonth } },
  });

  const photos = await prisma.profilePhoto.findMany({ where: { userId: user.id, isDeletedByUser: false, isRejected: false }, select: { isProfile: true } });
  const hasProfilePhoto = photos.some((p) => p.isProfile);
  const galleryPhotoCount = photos.filter((p) => !p.isProfile).length;

  const [onceClaimed, dailyClaimed, monthlyClaimed] = await Promise.all([
    checkClaimed(user.id, "once"),
    checkClaimed(user.id, "daily"),
    checkClaimed(user.id, "monthly"),
  ]);

  const dailyMissions = [
    { key: "daily_new_chats", title: "چت با کاربران جدید", desc: "حداقل ۱۰ کاربر جدید", current: newChatsToday, target: 10, unit: "کاربر", icon: "UserCheck" },
    { key: "daily_old_chats", title: "چت با کاربران قدیمی", desc: "حداقل ۱۰ کاربر قدیمی", current: oldChatsToday, target: 10, unit: "کاربر", icon: "MessageCircle" },
    { key: "daily_voice", title: "ارسال ویس", desc: "حداقل ۱۰ ویس در ۱۰ چت مختلف", current: Math.min(todayVoiceMessages.length, todayVoiceChats.size), target: 10, unit: "ویس", icon: "Mic", extra: { count: todayVoiceMessages.length, distinctChats: todayVoiceChats.size } },
    { key: "daily_photo", title: "ارسال عکس", desc: "حداقل ۱۰ عکس در ۱۰ چت مختلف", current: Math.min(todayImageMessages.length, todayImageChats.size), target: 10, unit: "عکس", icon: "Image", extra: { count: todayImageMessages.length, distinctChats: todayImageChats.size } },
    { key: "daily_likes", title: "لایک کردن", desc: "حداقل ۱۰ لایک", current: todayLikes, target: 10, unit: "لایک", icon: "Heart" },
  ];

  const monthlyMissions = [
    { key: "monthly_referrals", title: "معرفی دوستان", desc: "حداقل ۵ نفر در ماه", current: monthlyReferrals, target: 5, unit: "نفر", icon: "Users" },
  ];

  const onceMissions = [
    {
      key: "profile_complete", title: "تکمیل پروفایل", desc: "عکس پروفایل + ۳ عکس گالری + بیو + شغل",
      current: [hasProfilePhoto, galleryPhotoCount >= 3, !!user.bio, !!user.job].filter(Boolean).length,
      target: 4, unit: "گام", icon: "Check",
      details: { hasProfilePhoto, galleryPhotos: galleryPhotoCount, hasBio: !!user.bio, hasJob: !!user.job },
    },
  ];

  const tabs = {
    once: { label: "کلی", missions: onceMissions, reward: REWARDS.once, claimed: onceClaimed, allDone: onceMissions.every((m) => m.current >= m.target) },
    daily: { label: "روزانه", missions: dailyMissions, reward: REWARDS.daily, claimed: dailyClaimed, allDone: dailyMissions.every((m) => m.current >= m.target) },
    monthly: { label: "ماهانه", missions: monthlyMissions, reward: REWARDS.monthly, claimed: monthlyClaimed, allDone: monthlyMissions.every((m) => m.current >= m.target) },
  };

  return NextResponse.json({ tabs });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!user.isSpecial) return NextResponse.json({ error: "شما کاربر ویژه نیستید" }, { status: 403 });

  const { tab } = await request.json();
  if (!["once", "daily", "monthly"].includes(tab)) {
    return NextResponse.json({ error: "تب نامعتبر" }, { status: 400 });
  }

  const alreadyClaimed = await checkClaimed(user.id, tab);
  if (alreadyClaimed) {
    return NextResponse.json({ error: "جایزه این دوره قبلا دریافت شده" }, { status: 400 });
  }

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  let allDone = false;

  if (tab === "once") {
    const photos = await prisma.profilePhoto.findMany({ where: { userId: user.id, isDeletedByUser: false, isRejected: false }, select: { isProfile: true } });
    const hasProfilePhoto = photos.some((p) => p.isProfile);
    const galleryPhotoCount = photos.filter((p) => !p.isProfile).length;
    allDone = hasProfilePhoto && galleryPhotoCount >= 3 && !!user.bio && !!user.job;
  } else if (tab === "daily") {
    const conversations = await prisma.conversation.findMany({
      where: { OR: [{ userAId: user.id }, { userBId: user.id }] },
      select: { id: true, createdAt: true },
    });
    const todayMessages = await prisma.message.findMany({
      where: { senderId: user.id, createdAt: { gte: startOfToday }, type: { in: ["TEXT", "IMAGE", "VOICE", "VIDEO"] } },
      select: { conversationId: true, type: true },
    });
    const todayChatIds = new Set(todayMessages.map((m) => m.conversationId));
    let newChats = 0, oldChats = 0;
    for (const c of conversations) {
      if (todayChatIds.has(c.id)) { if (c.createdAt >= startOfToday) newChats++; else oldChats++; }
    }
    const voiceMsgs = todayMessages.filter((m) => m.type === "VOICE");
    const voiceChats = new Set(voiceMsgs.map((m) => m.conversationId));
    const imgMsgs = todayMessages.filter((m) => m.type === "IMAGE");
    const imgChats = new Set(imgMsgs.map((m) => m.conversationId));
    const todayLikes = await prisma.like.count({ where: { senderId: user.id, createdAt: { gte: startOfToday } } });
    allDone = newChats >= 10 && oldChats >= 10 && voiceMsgs.length >= 10 && voiceChats.size >= 10 && imgMsgs.length >= 10 && imgChats.size >= 10 && todayLikes >= 10;
  } else if (tab === "monthly") {
    const monthlyReferrals = await prisma.referral.count({ where: { referrerId: user.id, createdAt: { gte: startOfMonth } } });
    allDone = monthlyReferrals >= 5;
  }

  if (!allDone) {
    return NextResponse.json({ error: "هنوز همه ماموریت های این تب تکمیل نشده" }, { status: 400 });
  }

  const reward = REWARDS[tab];

  await prisma.$transaction([
    prisma.wallet.upsert({
      where: { userId: user.id },
      update: { balance: { increment: reward } },
      create: { userId: user.id, balance: reward },
    }),
    prisma.transaction.create({
      data: { userId: user.id, type: "SPECIAL_MISSION_REWARD", coins: reward, amountToman: 0, description: tab },
    }),
  ]);

  console.log(`[special] user ${user.id} claimed ${tab} mission reward: ${reward} coins`);
  return NextResponse.json({ ok: true, reward });
}
