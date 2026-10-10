// اصلاح phone ادمین به "1"
import { prisma } from "@/lib/prisma";

async function main() {
  const u = await prisma.user.findUnique({ where: { username: "1" } });
  if (!u) {
    console.log("not found");
    return;
  }
  await prisma.user.update({
    where: { id: u.id },
    data: { phone: "1" },
  });
  console.log("updated phone to '1' for user", u.id);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
