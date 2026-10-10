// تست ساده Prisma
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("[test] شروع تست...");
  const count = await prisma.user.count();
  console.log(`[test] تعداد کاربران: ${count}`);

  const one = await prisma.user.findFirst();
  console.log(`[test] اولین کاربر:`, one?.firstName, one?.lastName);

  const byPhone = await prisma.user.findUnique({ where: { phone: one!.phone } });
  console.log(`[test] جستجو با phone:`, byPhone?.firstName);

  const settings = await prisma.setting.findMany();
  console.log(`[test] تنظیمات: ${settings.length}`);

  console.log("[test] پایان - همه کوئری ها موفق بودند");
}

main().catch((err) => {
  console.error("[test] خطا:", err);
}).finally(() => prisma.$disconnect());
