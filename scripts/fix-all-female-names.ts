// جایگزینی تمام اسامی کاربران دختر با اسامی کاملا دخترانه
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

// ۱۲۰ اسم کاملا دخترانه فارسی
const FEMALE_NAMES = [
  "سارا", "زهرا", "مریم", "فاطمه", "عاطفه", "نگین", "پریسا", "الهام", "نرگس",
  "آیدا", "ندا", "مینا", "لیلا", "روناک", "سحر", "پگاه", "دنیا", "هانیه", "سمیرا",
  "آزاده", "طاهره", "معصومه", "زینب", "خدیجه", "سمیه", "ربیعه", "ربابه", "کریمه", "حلیمه",
  "نازنین", "شیرین", "پری", "فرشته", "گلناز", "محدثه", "اسرا", "الناز", "آناهیتا", "ترانه",
  "سیمین", "پروین", "فرزان", "آوا", "نیلوفر", "هاله", "غزل", "یاسمن", "ستایش", "پریچهره",
  "آرزو", "شکوفه", "بهاره", "نسترن", "لاله", "بنفشه", "گلاره", "یاسمین", "رؤیا",
  "ساغر", "شکوه", "فرناز", "کیمیا", "هستی", "آسمان", "خاطره", "طناز",
  "مهتاب", "آهو", "پردیس", "ژاله", "نوشآفرین", "سپیده", "آرام",
  "سارینا", "نیکا", "پارمیس", "هانا", "آدنا", "نادیا", "سندس", "مادلین",
  "رودابه", "تهمینه", "نیرا", "آیناز", "سوگل", "هلیا", "دنیازاد",
  "آفرین", "آسیا", "آیتا", "باران", "بهار", "تارا", "تیتا", "داریا",
  "آذرخش", "نویدا", "دلارا", "ماهرو", "رستا", "آوین", "سپنتا", "آذر", "ماهور",
  "گردآفرین", "سلوکا", "پرسابه", "آوینا", "آنیتا", "ساغر", "یاسمین", "مینا",
  "آرزو", "شکوفه", "نسترن", "لاله", "بنفشه", "گلاره", "یاسمین", "رؤیا",
  "مهتاب", "آهو", "پردیس", "ژاله", "سپیده", "آوا", "ستایش", "نوشآفرین",
  "پریچهره", "نازنین", "شیرین", "فرشته", "یاسمن", "نگین", "الهام",
  "مریم", "زهرا", "نگار", "کریمه", "فاطمه", "سمیرا", "لیلا",
  "ندا", "نرگس", "طاهره", "هانیه", "معصومه", "خدیجه", "سمیه",
  "ربیعه", "ربابه", "حلیمه", "عاطفه", "الناز", "محدثه", "سارینا",
  "نیکا", "پارمیس", "هانا", "آدنا", "نادیا", "سندس", "هلیا",
  "سوگل", "آیناز", "نیرا", "دنیازاد", "تهمینه", "رودابه", "آرام",
  "سیمین", "پروین", "فرزان", "ژیلا", "فرغانه", "رکسانا",
];

function randName(used: Set<string>): string {
  const available = FEMALE_NAMES.filter(n => !used.has(n));
  if (available.length === 0) {
    // اگر همه استفاده شده بودند، مجددا استفاده کن
    return FEMALE_NAMES[Math.floor(Math.random() * FEMALE_NAMES.length)];
  }
  return available[Math.floor(Math.random() * available.length)];
}

async function main() {
  const females = await prisma.user.findMany({
    where: { gender: "FEMALE", role: "USER" },
    select: { id: true, firstName: true, lastName: true, username: true },
  });

  console.log(`[fix-all] مجموع کاربران دختر: ${females.length}`);

  const usedNames = new Set<string>();
  let fixed = 0;

  for (const user of females) {
    const newName = randName(usedNames);
    usedNames.add(newName);

    // ساخت یوزرنیم جدید بر اساس نام جدید
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

    // یوزرنیم یکتا
    let newUsername = `${latin}_${Math.floor(Math.random() * 900) + 100}`;
    let attempts = 0;
    while (attempts < 20) {
      const existing = await prisma.user.findUnique({ where: { username: newUsername } });
      if (!existing) break;
      newUsername = `${latin}_${Math.floor(Math.random() * 99999)}`;
      attempts++;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { firstName: newName, username: newUsername },
    });
    fixed++;

    if (fixed % 50 === 0) {
      console.log(`[fix-all] ${fixed} کاربر به روز شد...`);
    }
  }

  console.log(`\n[fix-all] پایان! ${fixed} کاربر اصلاح شد`);

  // بررسی نهایی - پرینت همه اسامی یکتا
  const updated = await prisma.user.findMany({
    where: { gender: "FEMALE", role: "USER" },
    select: { firstName: true },
  });
  const nameCounts: Record<string, number> = {};
  for (const u of updated) {
    nameCounts[u.firstName] = (nameCounts[u.firstName] ?? 0) + 1;
  }
  console.log(`\n--- اسامی نهایی (${Object.keys(nameCounts).length} اسم یکتا) ---`);
  Object.entries(nameCounts).sort((a, b) => b[1] - a[1]).forEach(([name, count]) => {
    console.log(`  ${name}: ${count}`);
  });
}

main().finally(() => prisma.$disconnect());
