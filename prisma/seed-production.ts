// مقداردهی اولیه پروداکشن: فقط تنظیمات پیش فرض و حساب سوپر ادمین ریشه (بدون کاربر نمونه)
import "dotenv/config";
import bcrypt from "bcryptjs";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");

const pool = new pg.Pool({ connectionString, max: 2 });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  // تنظیمات پیش فرض — اگر از قبل باشد دست نمی خورد
  const settings: Array<[string, string]> = [
    ["COIN_VALUE", "10000"],
    ["SUBSCRIPTION_PRICE", "398000"],
    ["MIN_WITHDRAW_COINS", "50"],
  ];
  for (const [key, value] of settings) {
    await prisma.setting.upsert({ where: { key }, update: {}, create: { key, value } });
  }
  console.log("[seed-production] settings ensured");

  // حساب ریشه سوپر ادمین — update خالی است تا ری-سید هیچ فیلدی را بازنویسی نکند
  const rootPassword = await bcrypt.hash("1", 10);
  await prisma.user.upsert({
    where: { phone: "1" },
    update: {},
    create: {
      phone: "1",
      username: "1",
      password: rootPassword,
      role: "SUPER_ADMIN",
      gender: "MALE",
      firstName: "سوپر",
      lastName: "مدیر",
      province: "تهران",
      city: "تهران",
      age: 35,
      height: 180,
      weight: 80,
      income: 0,
      isVerified: true,
      phoneVerified: true,
      wallet: { create: { balance: 0 } },
    },
  });
  console.log("[seed-production] root super admin ensured");
}

main()
  .catch((err) => {
    console.error("[seed-production] failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
