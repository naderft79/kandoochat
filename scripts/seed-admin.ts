// ساخت کاربر ادمین پیش فرض: شماره و رمز ۱
import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";

async function main() {
  const phone = "1";
  const password = "1";
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { phone },
    update: { password: hashedPassword, username: "1", role: "SUPER_ADMIN", isActive: true },
    create: {
      phone,
      username: "1",
      password: hashedPassword,
      firstName: "ادمین",
      lastName: "اصلی",
      role: "SUPER_ADMIN",
      phoneVerified: true,
      isVerified: true,
      isActive: true,
      gender: "MALE",
      age: 30,
      city: "تهران",
      province: "تهران",
      height: 180,
      weight: 75,
      income: 50000000,
    },
  });

  // کیف پول و تنظیمات اگر وجود ندارند
  await prisma.wallet.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id, balance: 10000 },
  });
  await prisma.userSettings.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id },
  });

  console.log(`Admin ready: ${phone} / ${password}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
