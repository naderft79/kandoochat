// بررسی همه کاربران (نه فقط دخترها) برای عکس پروفایل
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const all = await prisma.user.findMany({
    where: { role: "USER" },
    include: { photos: true },
  });

  const noProfile = all.filter(u => !u.photos.some(p => p.isProfile));
  console.log(`total users: ${all.length}`);
  console.log(`without profile photo: ${noProfile.length}`);
  noProfile.forEach(u => console.log(`  ${u.id} | ${u.firstName} ${u.lastName} | ${u.gender} | photos: ${u.photos.length}`));
}

main().finally(() => prisma.$disconnect());
