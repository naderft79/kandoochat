// حذف تمام عکس های همه کاربران پسر
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const result = await prisma.profilePhoto.deleteMany({
    where: { user: { gender: "MALE", role: "USER" } },
  });
  console.log(`[delete] عکس های حذف شده: ${result.count}`);

  const maleCount = await prisma.user.count({ where: { gender: "MALE", role: "USER" } });
  const maleWithPhotos = await prisma.user.count({
    where: { gender: "MALE", role: "USER", photos: { some: {} } },
  });
  console.log(`[delete] کاربران پسر: ${maleCount}, با عکس باقی مانده: ${maleWithPhotos}`);
}

main().finally(() => prisma.$disconnect());
