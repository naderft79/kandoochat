// بررسی دقیق وضعیت عکس پروفایل کاربران دختر
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const females = await prisma.user.findMany({
    where: { gender: "FEMALE", role: "USER" },
    include: { photos: true },
  });

  let noProfilePhoto = 0;
  let noPhotosAtAll = 0;
  let hasPhotosButNoProfile = 0;

  for (const u of females) {
    const profilePhotos = u.photos.filter(p => p.isProfile);
    if (profilePhotos.length === 0) {
      noProfilePhoto++;
      if (u.photos.length === 0) {
        noPhotosAtAll++;
        console.log(`[check] NO PHOTOS: ${u.id} ${u.firstName} ${u.lastName} @${u.username}`);
      } else {
        hasPhotosButNoProfile++;
        console.log(`[check] HAS ${u.photos.length} PHOTOS BUT NONE isProfile: ${u.id} ${u.firstName} @${u.username} | isProfile flags: ${u.photos.map(p => p.isProfile).join(",")}`);
      }
    }
  }

  console.log(`\n[check] مجموع کاربران دختر: ${females.length}`);
  console.log(`[check] بدون عکس پروفایل: ${noProfilePhoto}`);
  console.log(`[check] - بدون هیچ عکسی: ${noPhotosAtAll}`);
  console.log(`[check] - عکس دارند ولی isProfile=false: ${hasPhotosButNoProfile}`);
}

main().finally(() => prisma.$disconnect());
