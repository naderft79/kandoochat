// seed ماموریت های روزانه — هماهنگ با ماموریت های روزانه بخش ویژه
import "dotenv/config";
import { prisma } from "../src/lib/prisma";

const missions = [
  {
    key: "daily_new_chats",
    title: "چت با کاربران جدید",
    description: "حداقل ۱۰ کاربر جدید",
    rewardCoins: 1,
    target: 10,
    icon: "UserCheck",
  },
  {
    key: "daily_old_chats",
    title: "چت با کاربران قدیمی",
    description: "حداقل ۱۰ کاربر قدیمی",
    rewardCoins: 1,
    target: 10,
    icon: "MessageCircle",
  },
  {
    key: "daily_voice",
    title: "ارسال ویس",
    description: "حداقل ۱۰ ویس در ۱۰ چت مختلف",
    rewardCoins: 1,
    target: 10,
    icon: "Mic",
  },
  {
    key: "daily_photo",
    title: "ارسال عکس",
    description: "حداقل ۱۰ عکس در ۱۰ چت مختلف",
    rewardCoins: 1,
    target: 10,
    icon: "Image",
  },
  {
    key: "daily_likes",
    title: "لایک کردن",
    description: "حداقل ۱۰ لایک",
    rewardCoins: 1,
    target: 10,
    icon: "Heart",
  },
];

// ماموریت های قدیمی غیرفعال می شوند تا در لیست نیایند ولی تاریخچه شان بماند
const deprecatedKeys = [
  "daily_login",
  "complete_profile",
  "send_5_likes",
  "open_10_profiles",
  "start_chat",
  "invite_friend",
];

async function main() {
  for (const m of missions) {
    await prisma.mission.upsert({
      where: { key: m.key },
      update: { title: m.title, description: m.description, rewardCoins: m.rewardCoins, target: m.target, icon: m.icon, isActive: true },
      create: m,
    });
    console.log(`[seed-missions] ${m.key} ok`);
  }
  await prisma.mission.updateMany({
    where: { key: { in: deprecatedKeys } },
    data: { isActive: false },
  });
  console.log("[seed-missions] done");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
