// ساخت حساب دمو برای بازرس گوگل پلی — کاربر عادی با پروفایل کامل
// این حساب در فرم App access کنسول داده می شود تا بازرس کل اپ را ببیند
// استفاده روی سرور production: npx tsx scripts/seed-demo-reviewer.ts
import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";

// اطلاعات دمو — همین را در فرم App access کنسول وارد کنید
const DEMO_PHONE = "09900000001";
const DEMO_PASSWORD = "1234567";

async function main() {
  const existing = await prisma.user.findUnique({ where: { phone: DEMO_PHONE } });
  if (existing) {
    console.log(`[demo] already exists: id=${existing.id} phone=${DEMO_PHONE}`);
    return;
  }

  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const user = await prisma.user.create({
    data: {
      phone: DEMO_PHONE,
      username: "kandoo_demo",
      password: hash,
      gender: "MALE",
      firstName: "حساب",
      lastName: "نمایشی",
      province: "تهران",
      city: "تهران",
      age: 30,
      height: 178,
      weight: 75,
      income: 30000000,
      bio: "این حساب برای بررسی اپلیکیشن کندو توسط تیم بازبینی گوگل پلی ساخته شده است.",
      phoneVerified: true,
      isVerified: true,
      referralCode: "KDDEMO1",
    } as never,
  });

  await prisma.wallet.create({ data: { userId: user.id, balance: 50 } });

  console.log(`[demo] created: id=${user.id}`);
  console.log(`[demo] Play Console App access → phone: ${DEMO_PHONE} / password: ${DEMO_PASSWORD}`);
  console.log("[demo] keep this account active until the app is published");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
