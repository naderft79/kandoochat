// ساخت کاربر مدیریت «آقا سید» با دسترسی کامل سوپرادمین
// ورود با نام کاربری seyyed در صفحه ورود مدیریت انجام می شود
import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";

const PHONE = "admin-seyyed"; // مقدار غیرموبایل تا با شماره کاربران واقعی تداخل نکند
const USERNAME = "6666666";
const PASSWORD = "6666666";

async function main() {
  const hashedPassword = await bcrypt.hash(PASSWORD, 10);

  const user = await prisma.user.upsert({
    where: { phone: PHONE },
    update: {
      password: hashedPassword,
      username: USERNAME,
      role: "SUPER_ADMIN",
      isActive: true,
      deletedAt: null,
    },
    create: {
      phone: PHONE,
      username: USERNAME,
      password: hashedPassword,
      firstName: "آقا",
      lastName: "سید",
      role: "SUPER_ADMIN",
      phoneVerified: true,
      isVerified: true,
      isActive: true,
      gender: "MALE",
      age: 35,
      city: "تهران",
      province: "تهران",
      height: 180,
      weight: 80,
      income: 0,
    },
  });

  await prisma.wallet.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id, balance: 0 },
  });
  await prisma.userSettings.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id },
  });

  console.log(`Seyyed admin ready: username=${USERNAME}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
