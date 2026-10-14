// مقداردهی اولیه پروداکشن: تنظیمات پیش فرض، حساب سوپر ادمین ریشه و کاربران فیک پیش فرض
import "dotenv/config";
import { readFileSync } from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");

const pool = new pg.Pool({ connectionString, max: 2 });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

// رمز همه کاربران فیک پیش فرض (طبق قانون عددی ۵ تا ۷ رقم)
const DEFAULT_USER_PASSWORD = "11111";

type DefaultUser = {
  phone: string;
  username: string;
  gender: string;
  firstName: string;
  lastName: string;
  province: string;
  city: string;
  age: number;
  height: number;
  weight: number;
  income: number;
  carModel: string | null;
  neighborhood: string | null;
  job: string | null;
  bio: string | null;
  isVerified: boolean;
  isIdentityVerified: boolean;
  isSpecial: boolean;
  walletBalance: number;
  interests: Array<{ name: string; icon: string }>;
  profilePhoto: string | null;
};

async function ensureSettings() {
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
}

async function ensureRoot() {
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

async function ensureDefaultUsers() {
  const file = path.join(process.cwd(), "prisma", "seed-data", "default-users.json");
  const list = JSON.parse(readFileSync(file, "utf8")) as DefaultUser[];
  const password = await bcrypt.hash(DEFAULT_USER_PASSWORD, 10);
  let created = 0;

  for (const u of list) {
    // کاربری که از قبل با همین موبایل یا یوزرنیم باشد دست نمی خورد (ایدمپوتنت)
    const exists = await prisma.user.findFirst({
      where: { OR: [{ phone: u.phone }, { username: u.username }] },
      select: { id: true },
    });
    if (exists) continue;

    await prisma.user.create({
      data: {
        phone: u.phone,
        username: u.username,
        password,
        role: "USER",
        isFake: true,
        isActive: true,
        phoneVerified: true,
        gender: u.gender,
        firstName: u.firstName,
        lastName: u.lastName,
        province: u.province,
        city: u.city,
        age: u.age,
        height: u.height,
        weight: u.weight,
        income: u.income,
        carModel: u.carModel,
        neighborhood: u.neighborhood,
        job: u.job,
        bio: u.bio,
        isVerified: u.isVerified,
        isIdentityVerified: u.isIdentityVerified,
        isSpecial: u.isSpecial,
        wallet: { create: { balance: u.walletBalance } },
        interests: {
          create: u.interests.map((i) => ({
            interest: { connectOrCreate: { where: { name: i.name }, create: { name: i.name, icon: i.icon } } },
          })),
        },
        photos: u.profilePhoto
          ? { create: { url: u.profilePhoto, order: 0, isProfile: true, isVerified: true, isRejected: false } }
          : undefined,
      },
    });
    created++;
  }
  console.log(`[seed-production] default users: ${created} created, ${list.length - created} already present`);
}

async function main() {
  await ensureSettings();
  await ensureRoot();
  await ensureDefaultUsers();
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
