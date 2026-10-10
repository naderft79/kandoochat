// بررسی اسامی کاربران دختر - پیدا کردن اسامی پسرانه
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const females = await prisma.user.findMany({
    where: { gender: "FEMALE", role: "USER" },
    select: { id: true, firstName: true, lastName: true, username: true },
  });

  // اسامی پسرانه رایج
  const maleNames = new Set([
    "علی", "محمد", "حسن", "حسین", "رضا", "امیر", "مهدی", "سینا", "پویا", "آرش",
    "بابک", "بهنام", "پدرام", "تیمور", "جاوید", "خسرو", "داریوش", "رامین", "سامان",
    "سهراب", "سیامک", "شاهین", "شهرام", "فرید", "فریدون", "کامران", "کاوه", "کیان",
    "کوروش", "گودرز", "مازیار", "مهران", "میلاد", "نادر", "هوشنگ", "پیمان", "نیما",
    "یاسر", "آرمان", "اسماعیل", "اکبر", "ایمان", "بهرام", "پارسا", "جهانبخش", "حمید",
    "حمیدرضا", "داوود", "راستین", "زبان", "سعید", "سپهر", "شایان", "طاهر", "عباس",
    "عطا", "فرهاد", "قاسم", "کریم", "کیانوش", "مجید", "منوچهر", "نوید", "هانی",
    "هرمز", "یوسف", "آذرخش", "آرتین", "آرشام", "آرتا", "برزو", "پرهام", "تارا",
    "نیما", "آریا", "آریان", "سپنتا", "کاوه", "نوید", "آوینا", "دلاور", "سلوک",
    "نوید", "رستمی", "گردآفرید", "نیاز", "برسابه", "سپنتا", "ماهور", "آذر",
  ]);

  // اسامی خنثی یا نام های خانوادگی که اشتباه وارد شده
  const suspicious = females.filter(u => maleNames.has(u.firstName));

  console.log(`total females: ${females.length}`);
  console.log(`suspicious (male names): ${suspicious.length}`);
  suspicious.forEach(u => console.log(`  ${u.id} | ${u.firstName} ${u.lastName} | @${u.username}`));

  // همچنین چک کن همه اسامی یکتا را پرینت کن
  const nameCounts: Record<string, number> = {};
  for (const u of females) {
    nameCounts[u.firstName] = (nameCounts[u.firstName] ?? 0) + 1;
  }
  console.log(`\n--- All unique first names (${Object.keys(nameCounts).length}) ---`);
  Object.entries(nameCounts).sort((a,b) => b[1] - a[1]).forEach(([name, count]) => {
    console.log(`  ${name}: ${count}`);
  });
}

main().finally(() => prisma.$disconnect());
