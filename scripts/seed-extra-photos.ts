// اسکریپت افزودن ۱ الی ۴ عکس اضافی به پروفایل کاربران از پوشه keyshozorii
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import fs from "fs";
import path from "path";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

async function main() {
  console.log("[seed-photos] شروع اسکریپت افزودن عکس های اضافی...");

  // خواندن لیست عکس ها
  const photosDir = path.join(process.cwd(), "public", "uploads", "keyshozorii");
  const allPhotoFiles = fs.readdirSync(photosDir).filter(f => f.endsWith(".jpg"));
  console.log(`[seed-photos] تعداد کل عکس ها: ${allPhotoFiles.length}`);

  // گرفتن همه کاربرانی که عکس keyshozorii دارند
  const users = await prisma.user.findMany({
    where: { gender: "FEMALE", role: "USER" },
    include: {
      photos: {
        where: { url: { contains: "keyshozorii" } },
        orderBy: { order: "asc" },
      },
    },
  });

  console.log(`[seed-photos] کاربران یافت شده: ${users.length}`);

  // ساخت مجموعه عکس های استفاده شده برای جلوگیری از تکرار زیاد
  const usedPhotos = new Set<string>();
  for (const u of users) {
    for (const p of u.photos) {
      usedPhotos.add(p.url);
    }
  }

  let updated = 0;
  let added = 0;

  for (const user of users) {
    // تعداد عکس فعلی کاربر
    const currentCount = user.photos.length;

    // تعداد عکس نهایی: بین ۱ تا ۴
    const targetCount = randInt(1, 4);

    if (currentCount >= targetCount) continue; // این کاربر کافی دارد

    const needed = targetCount - currentCount;

    // انتخاب عکس های جدید که این کاربر نداشت
    const available = allPhotoFiles.filter(f => {
      const url = `/uploads/keyshozorii/${f}`;
      return !user.photos.some(p => p.url === url);
    });

    if (available.length === 0) continue;

    const picked = shuffle(available).slice(0, needed);

    for (let i = 0; i < picked.length; i++) {
      const url = `/uploads/keyshozorii/${picked[i]}`;
      await prisma.profilePhoto.create({
        data: {
          userId: user.id,
          url,
          order: currentCount + i,
          isProfile: false,
          isVerified: Math.random() < 0.3,
        },
      });
      added++;
    }

    updated++;

    if (updated % 50 === 0) {
      console.log(`[seed-photos] ${updated} کاربر به روز شد، ${added} عکس اضافه شد...`);
    }
  }

  console.log(`\n[seed-photos] پایان! کاربران به روز شده: ${updated}, عکس های اضافه شده: ${added}`);

  // آمار نهایی
  const totalPhotos = await prisma.profilePhoto.count({
    where: { url: { contains: "keyshozorii" } },
  });
  console.log(`[seed-photos] مجموع عکس های keyshozorii در دیتابیس: ${totalPhotos}`);
}

main()
  .catch((err) => {
    console.error("[seed-photos] خطای اسکریپت:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
