// اضافه کردن عکس پروفایل به کاربرانی که هیچ عکسی ندارند (کاربران مرد قدیمی)
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import fs from "fs";
import path from "path";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const photosDir = path.join(process.cwd(), "public", "uploads", "keyshozorii");
  const allPhotoFiles = fs.readdirSync(photosDir).filter(f => f.endsWith(".jpg"));

  // کاربرانی که هیچ عکس پروفایل ندارند
  const users = await prisma.user.findMany({
    where: { role: "USER", photos: { none: { isProfile: true } } },
    include: { photos: true },
  });

  console.log(`[fix] کاربران بدون عکس پروفایل: ${users.length}`);

  let fixed = 0;
  for (const user of users) {
    // اگر اصلا عکس ندارد، از پوشه یک عکس رندوم بده
    if (user.photos.length === 0) {
      const randomPhoto = allPhotoFiles[Math.floor(Math.random() * allPhotoFiles.length)];
      const url = `/uploads/keyshozorii/${randomPhoto}`;
      await prisma.profilePhoto.create({
        data: {
          userId: user.id,
          url,
          order: 0,
          isProfile: true,
          isVerified: false,
        },
      });
      console.log(`[fix] عکس پروفایل اضافه شد: ${user.firstName} ${user.lastName} (${user.gender})`);
      fixed++;
    } else {
      // عکس دارد ولی isProfile=false - اولین عکس را isProfile کن
      await prisma.profilePhoto.update({
        where: { id: user.photos[0].id },
        data: { isProfile: true },
      });
      console.log(`[fix] isProfile=true شد: ${user.firstName} ${user.lastName}`);
      fixed++;
    }
  }

  console.log(`\n[fix] پایان! ${fixed} کاربر اصلاح شد`);

  // بررسی نهایی
  const remaining = await prisma.user.count({
    where: { role: "USER", photos: { none: { isProfile: true } } },
  });
  console.log(`[fix] کاربران بدون عکس پروفایل باقی مانده: ${remaining}`);
}

main().finally(() => prisma.$disconnect());
