// اصلاح اسامی پسرانه در کاربران دختر به اسامی کاملا دخترانه
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

// اسامی که قطعا پسرانه یا نام خانوادگی هستند و باید تغییر کنند
const MALE_NAMES_TO_FIX = new Set([
  "نوید",       // نام پسر
  "دلاور",      // نام پسر
  "کاوه",       // نام پسر
  "رستمی",      // نام خانوادگی پسر
  "نیاز",       // نام پسر
  "برسابه",     // نام پسر
  "سلوک",       // نام پسر
  "گردآفرید",   // نام حماسی، مشکوک
]);

// اسامی دخترانه جایگزین
const EXTRA_FEMALE_NAMES = [
  "آفرین", "آناهیتا", "آرزو", "آرام", "آسیا", "آوا", "آیتا", "باران",
  "بهار", "پگاه", "تارا", "ترانه", "تیتا", "خاطره", "داریا", "رؤیا",
  "سحر", "شکوفه", "طناز", "فرشته", "کیمیا", "گلاره", "لاله", "نسترن",
  "نیلوفر", "هستی", "آذرخش", "نویدا", "دلارا", "ماهرو", "رستا", "آوین",
  "سپنتا", "آذر", "ماهور", "گردآفرین", "سلوکا", "پرسابه", "آوینا",
  "آنیتا", "آسمان", "شکوه", "ساغر", "یاسمین", "مینا",
  "سارینا", "نیکا", "پارمیس", "هانا", "آدنا", "نادیا", "سندس", "هلیا",
  "سوگل", "آیناز", "نیرا", "دنیازاد", "تهمینه", "رودابه",
];

function randName(): string {
  return EXTRA_FEMALE_NAMES[Math.floor(Math.random() * EXTRA_FEMALE_NAMES.length)];
}

async function main() {
  const females = await prisma.user.findMany({
    where: { gender: "FEMALE", role: "USER" },
    select: { id: true, firstName: true, lastName: true, username: true },
  });

  const toFix = females.filter(u => MALE_NAMES_TO_FIX.has(u.firstName));
  console.log(`[fix-names] کاربران با اسامی پسرانه: ${toFix.length}`);

  let fixed = 0;
  for (const user of toFix) {
    const newName = randName();
    // یوزرنیم جدید بر اساس نام جدید
    const translit: Record<string, string> = {
      "آ": "a", "ا": "a", "ب": "b", "پ": "p", "ت": "t", "ث": "s", "ج": "j",
      "چ": "ch", "ح": "h", "خ": "kh", "د": "d", "ذ": "z", "ر": "r", "ز": "z",
      "ژ": "zh", "س": "s", "ش": "sh", "ص": "s", "ض": "z", "ط": "t", "ظ": "z",
      "ع": "a", "غ": "gh", "ف": "f", "ق": "gh", "ک": "k", "گ": "g", "ل": "l",
      "م": "m", "ن": "n", "و": "v", "ه": "h", "ی": "y",
    };
    let latin = "";
    for (const ch of newName) latin += translit[ch] ?? ch;
    latin = latin.toLowerCase().replace(/[^a-z0-9_]/g, "");
    const newUsername = `${latin}_${Math.floor(Math.random() * 900) + 100}${user.id.slice(-4)}`;

    // بررسی یکتایی یوزرنیم
    const existing = await prisma.user.findUnique({ where: { username: newUsername } });
    const finalUsername = existing ? `${latin}_${Math.floor(Math.random() * 9999)}` : newUsername;

    await prisma.user.update({
      where: { id: user.id },
      data: { firstName: newName, username: finalUsername },
    });
    console.log(`[fix-names] ${user.firstName} -> ${newName} | @${user.username} -> @${finalUsername}`);
    fixed++;
  }

  console.log(`\n[fix-names] پایان! ${fixed} کاربر اصلاح شد`);
}

main().finally(() => prisma.$disconnect());
