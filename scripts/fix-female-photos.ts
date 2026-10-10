// اسکریپت اطمینان از اینکه همه دخترها عکس پروفایل و حداقل ۲ عکس گالری دارند
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import fs from "fs";
import path from "path";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

async function main() {
  console.log("[fix-photos] شروع...");

  const photosDir = path.join(process.cwd(), "public", "uploads", "keyshozorii");
  const allPhotoFiles = fs.readdirSync(photosDir).filter(f => f.endsWith(".jpg"));
  console.log(`[fix-photos] کل عکس ها: ${allPhotoFiles.length}`);

  // گرفتن همه کاربران دختر با عکس هایشان
  const users = await prisma.user.findMany({
    where: { gender: "FEMALE", role: "USER" },
    include: {
      photos: {
        where: { url: { contains: "keyshozorii" } },
        orderBy: { order: "asc" },
      },
    },
  });

  console.log(`[fix-photos] کاربران دختر: ${users.length}`);

  // ساخت pool عکس های موجود
  const photoPool = shuffle(allPhotoFiles.map(f => `/uploads/keyshozorii/${f}`));

  let fixedProfile = 0;
  let addedGallery = 0;
  let poolIdx = 0;

  function nextPhoto(exclude: Set<string>): string | null {
    for (let attempts = 0; attempts < allPhotoFiles.length; attempts++) {
      const photo = photoPool[poolIdx % photoPool.length];
      poolIdx++;
      if (!exclude.has(photo)) return photo;
    }
    return null;
  }

  for (const user of users) {
    const userPhotoUrls = new Set(user.photos.map(p => p.url));

    // ۱. اطمینان از وجود عکس پروفایل (isProfile=true)
    const hasProfile = user.photos.some(p => p.isProfile);
    if (!hasProfile) {
      // اگر عکسی دارد ولی هیچ کدام isProfile نیست، اولین را isProfile کن
      if (user.photos.length > 0) {
        await prisma.profilePhoto.update({
          where: { id: user.photos[0].id },
          data: { isProfile: true },
        });
      } else {
        // هیچ عکسی ندارد - یک عکس جدید به عنوان پروفایل اضافه کن
        const newPhoto = nextPhoto(userPhotoUrls);
        if (newPhoto) {
          await prisma.profilePhoto.create({
            data: {
              userId: user.id,
              url: newPhoto,
              order: 0,
              isProfile: true,
              isVerified: Math.random() < 0.3,
            },
          });
          userPhotoUrls.add(newPhoto);
          fixedProfile++;
        }
      }
    }

    // ۲. اطمینان از حداقل ۲ عکس گالری (یعنی مجموع عکس ها حداقل ۳: ۱ پروفایل + ۲ گالری)
    const currentCount = user.photos.length === 0 ? 1 : user.photos.length; // اگر پروفایل اضافه کردیم
    const minTotal = 3; // ۱ پروفایل + ۲ گالری
    const needed = Math.max(0, minTotal - currentCount);

    for (let i = 0; i < needed; i++) {
      const newPhoto = nextPhoto(userPhotoUrls);
      if (newPhoto) {
        await prisma.profilePhoto.create({
          data: {
            userId: user.id,
            url: newPhoto,
            order: currentCount + i,
            isProfile: false,
            isVerified: Math.random() < 0.3,
          },
        });
        userPhotoUrls.add(newPhoto);
        addedGallery++;
      }
    }

    // بازخوانی عکس های کاربر برای به روز رسانی
    if (fixedProfile % 50 === 0 && fixedProfile > 0) {
      console.log(`[fix-photos] ${fixedProfile} پروفایل اصلاح شد...`);
    }
  }

  console.log(`\n[fix-photos] پایان! پروفایل های اصلاح شده: ${fixedProfile}, عکس های گالری اضافه شده: ${addedGallery}`);

  // آمار نهایی
  const usersWithoutProfile = await prisma.user.count({
    where: {
      gender: "FEMALE",
      role: "USER",
      photos: { none: { isProfile: true } },
    },
  });
  console.log(`[fix-photos] کاربران بدون عکس پروفایل باقی مانده: ${usersWithoutProfile}`);

  const usersWithLessThan3 = await prisma.user.findMany({
    where: { gender: "FEMALE", role: "USER" },
    include: { photos: { where: { url: { contains: "keyshozorii" } } } },
  });
  const lessThan3 = usersWithLessThan3.filter(u => u.photos.length < 3).length;
  console.log(`[fix-photos] کاربران با کمتر از ۳ عکس باقی مانده: ${lessThan3}`);
}

main()
  .catch((err) => {
    console.error("[fix-photos] خطا:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
