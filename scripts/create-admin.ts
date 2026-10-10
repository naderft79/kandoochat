// ساخت کاربر ادمین با یوزرنیم 1 و پسورد 1
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  const existing = await prisma.user.findUnique({ where: { username: "1" } });
  if (existing) {
    console.log("Admin user already exists:", existing.id);
    return;
  }

  const hashed = await bcrypt.hash("1", 10);
  const admin = await prisma.user.create({
    data: {
      phone: "11111111111",
      username: "1",
      password: hashed,
      role: "ADMIN",
      gender: "MALE",
      firstName: "مدیر",
      lastName: "سایت",
      province: "تهران",
      city: "تهران",
      age: 30,
      height: 180,
      weight: 75,
      income: 0,
      isVerified: true,
      isActive: true,
      phoneVerified: true,
    },
  });

  console.log("Admin created:", admin.id, admin.username);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
