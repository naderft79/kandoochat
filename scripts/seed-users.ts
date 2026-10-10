// ساخت ۱۰ کاربر تستی تهران
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

const boys = [
  { firstName: "علی", lastName: "محمدی", username: "ali_tehran", age: 28, height: 180, weight: 78, job: "مهندس نرم افزار", bio: "عاشق فوتبال و سفر", neighborhood: "الهیه" },
  { firstName: "رضا", lastName: "احمدی", username: "reza_tehran", age: 32, height: 175, weight: 72, job: "پزشک", bio: "ورزشکار و کتاب خوان", neighborhood: "نیاوران" },
  { firstName: "امیر", lastName: "رضایی", username: "amir_tehran", age: 26, height: 185, weight: 82, job: "معماران", bio: "عکاسی و موسیقی", neighborhood: "جردن" },
  { firstName: "محمد", lastName: "کریمی", username: "mohammad_tehran", age: 30, height: 178, weight: 75, job: "مدیر فروش", bio: "عاشق آشپزی", neighborhood: "فرشته" },
  { firstName: "سینا", lastName: "موسوی", username: "sina_tehran", age: 29, height: 172, weight: 70, job: "گرافیست", bio: "هنر و طراحی", neighborhood: "ونک" },
];

const girls = [
  { firstName: "نگار", lastName: "حسینی", username: "negar_tehran", age: 27, height: 165, weight: 55, job: "طراح داخال", bio: "عاشق هنر و سفر", neighborhood: "الهیه" },
  { firstName: "سارا", lastName: "عباسی", username: "sara_tehran", age: 25, height: 168, weight: 58, job: "پزشک دندانپزشک", bio: "ورزش و موسیقی", neighborhood: "نیاوران" },
  { firstName: "مریم", lastName: "صادقی", username: "maryam_tehran", age: 29, height: 162, weight: 52, job: "وکیل", bio: "عاشق کتاب و قهوه", neighborhood: "جردن" },
  { firstName: "زهرا", lastName: "نوری", username: "zahra_tehran", age: 31, height: 170, weight: 60, job: "داروساز", bio: "سفر و عکاسی", neighborhood: "فرشته" },
  { firstName: "پریسا", lastName: "جعفری", username: "parisa_tehran", age: 26, height: 160, weight: 50, job: "استاد دانشگاه", bio: "علم و هنر", neighborhood: "ونک" },
];

async function main() {
  const hashedPassword = await bcrypt.hash("123456", 10);

  for (const u of boys) {
    const existing = await prisma.user.findUnique({ where: { username: u.username } });
    if (existing) continue;
    const user = await prisma.user.create({
      data: {
        phone: `0912${Math.floor(1000000 + Math.random() * 8999999)}`,
        password: hashedPassword,
        firstName: u.firstName,
        lastName: u.lastName,
        username: u.username,
        role: "USER",
        gender: "MALE",
        age: u.age,
        height: u.height,
        weight: u.weight,
        income: 30000000 + Math.floor(Math.random() * 50000000),
        city: "تهران",
        province: "تهران",
        neighborhood: u.neighborhood,
        job: u.job,
        bio: u.bio,
        phoneVerified: true,
        isVerified: true,
        isActive: true,
        dailyLikesReset: new Date(),
        dailySuperLikeReset: new Date(),
      },
    });
    await prisma.wallet.create({ data: { userId: user.id, balance: 500 } });
    await prisma.userSettings.create({ data: { userId: user.id } });
    console.log(`Created: ${u.firstName} (${u.username})`);
  }

  for (const u of girls) {
    const existing = await prisma.user.findUnique({ where: { username: u.username } });
    if (existing) continue;
    const user = await prisma.user.create({
      data: {
        phone: `0935${Math.floor(1000000 + Math.random() * 8999999)}`,
        password: hashedPassword,
        firstName: u.firstName,
        lastName: u.lastName,
        username: u.username,
        role: "USER",
        gender: "FEMALE",
        age: u.age,
        height: u.height,
        weight: u.weight,
        income: 20000000 + Math.floor(Math.random() * 40000000),
        city: "تهران",
        province: "تهران",
        neighborhood: u.neighborhood,
        job: u.job,
        bio: u.bio,
        phoneVerified: true,
        isVerified: true,
        isActive: true,
        dailyLikesReset: new Date(),
        dailySuperLikeReset: new Date(),
      },
    });
    await prisma.wallet.create({ data: { userId: user.id, balance: 500 } });
    await prisma.userSettings.create({ data: { userId: user.id } });
    console.log(`Created: ${u.firstName} (${u.username})`);
  }

  console.log("Done! 10 users created.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
