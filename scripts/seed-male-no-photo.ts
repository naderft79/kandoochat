// ساخت ۵ کاربر پسر جدید بدون هیچ عکس پروفایل برای تست فید و پیام
// استفاده: tsx scripts/seed-male-no-photo.ts
import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";

const PASSWORD = "Kandoo@1403";

// اسامی کاملا پسرانه
const SPEC = [
  { firstName: "بهراد", lastName: "نوروزی", age: 27, city: "تهران", province: "تهران", job: "مهندس کامپیوتر", bio: "برنامه نویس هستم و زندگی سالم را دوست دارم. به دنبال رابطه جدی و پایدار هستم." },
  { firstName: "کامران", lastName: "فتحی", age: 31, city: "کرج", province: "البرز", job: "حسابدار", bio: "حسابدار هستم. عاشق کوهنوردی و کتاب خواندن. به دنبال شریک زندگی صادق." },
  { firstName: "پویان", lastName: "اکباتانی", age: 24, city: "تهران", province: "تهران", job: "کارشناس فروش", bio: "عاشق فوتبال و سفرهای جاده ای. دوست دارم با کسی آشنا بشم که ماجراجو باشد." },
  { firstName: "هومن", lastName: "یزدانی", age: 34, city: "اصفهان", province: "اصفهان", job: "صاحب فروشگاه", bio: "صاحب مغازه هستم. خانواده برایم مهم است و به دنبال رابطه بر پایه احترام می گردم." },
  { firstName: "سعید", lastName: "بندری", age: 29, city: "شیراز", province: "فارس", job: "کارمند بانک", bio: "کارمند بانک هستم. عاشق آشپزی و طبیعت. به دنبال رابطه ای جدی و پایدار." },
];

function pad(n: number, len: number) {
  return String(n).padStart(len, "0");
}

// شماره تلفن یکتا با پیشوند مشخص تا پاکسازی راحت باشد
function phoneFor(i: number) {
  return `0912900${pad(300 + i, 4)}`;
}

function usernameFor(firstName: string, i: number) {
  const translit: Record<string, string> = {
    "آ": "a", "ا": "a", "ب": "b", "پ": "p", "ت": "t", "ج": "j", "ح": "h", "خ": "kh",
    "د": "d", "ر": "r", "ز": "z", "س": "s", "ش": "sh", "ص": "s", "ع": "a", "ف": "f",
    "ک": "k", "گ": "g", "ل": "l", "م": "m", "ن": "n", "و": "v", "ه": "h", "ی": "y",
  };
  let latin = "";
  for (const ch of firstName) latin += translit[ch] ?? ch;
  return `${latin.toLowerCase()}_${Date.now().toString(36).slice(-5)}${i}`;
}

async function main() {
  console.log("[seed-male-nophoto] شروع...");

  // پاکسازی نسخه های قبلی همین اسکریپت (idempotent)
  const old = await prisma.user.deleteMany({ where: { phone: { startsWith: "0912900" } } });
  if (old.count) console.log(`[seed-male-nophoto] ${old.count} کاربر قبلی حذف شد`);

  const hash = await bcrypt.hash(PASSWORD, 10);

  let created = 0;
  for (let i = 0; i < SPEC.length; i++) {
    const s = SPEC[i];
    const daysAgo = i + 1; // چند روز پیش ثبت نام کرده
    const user = await prisma.user.create({
      data: {
        phone: phoneFor(i),
        username: usernameFor(s.firstName, i),
        password: hash,
        role: "USER",
        gender: "MALE",
        firstName: s.firstName,
        lastName: s.lastName,
        province: s.province,
        city: s.city,
        age: s.age,
        height: 168 + i * 3,
        weight: 68 + i * 3,
        income: (10 + i * 5) * 1_000_000,
        job: s.job,
        bio: s.bio,
        isActive: true,
        phoneVerified: true,
        lastSeen: new Date(Date.now() - i * 60 * 60 * 1000),
        isOnline: i < 2,
        createdAt: new Date(Date.now() - daysAgo * 86_400_000),
        wallet: { create: { balance: 20 + i * 5 } },
      },
    });
    // عمدا هیچ عکسی ساخته نمی شود — بدون عکس پروفایل
    console.log(`[seed-male-nophoto] ${user.firstName} (${user.username}) ساخته شد — بدون عکس`);
    created++;
  }

  const noPhotoMales = await prisma.user.count({
    where: { gender: "MALE", role: "USER", photos: { none: {} } },
  });
  console.log(`[seed-male-nophoto] پایان! ${created} کاربر پسر بدون عکس ساخته شد`);
  console.log(`[seed-male-nophoto] کل پسرهای بدون عکس: ${noPhotoMales}`);
}

main()
  .catch((err) => {
    console.error("[seed-male-nophoto] خطا:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
