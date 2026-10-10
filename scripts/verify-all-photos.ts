// تایید تمام عکس های پروفایل و گالری که تایید نشده اند
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  // شمارش عکس های تایید نشده
  const unverifiedCount = await prisma.profilePhoto.count({
    where: { isVerified: false, isRejected: false },
  });
  console.log(`[verify] عکس های تایید نشده: ${unverifiedCount}`);

  // تایید همه عکس های تایید نشده
  const result = await prisma.profilePhoto.updateMany({
    where: { isVerified: false, isRejected: false },
    data: { isVerified: true, isRejected: false },
  });
  console.log(`[verify] عکس های تایید شده: ${result.count}`);

  // آمار نهایی
  const total = await prisma.profilePhoto.count();
  const verified = await prisma.profilePhoto.count({ where: { isVerified: true } });
  const unverified = await prisma.profilePhoto.count({ where: { isVerified: false } });
  const rejected = await prisma.profilePhoto.count({ where: { isRejected: true } });
  console.log(`[verify] مجموع عکس ها: ${total}, تایید شده: ${verified}, تایید نشده: ${unverified}, رد شده: ${rejected}`);
}

main().finally(() => prisma.$disconnect());
