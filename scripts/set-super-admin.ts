import { prisma } from "@/lib/prisma";

async function main() {
  const phone = process.argv[2] || "1";
  const user = await prisma.user.update({
    where: { phone },
    data: { role: "SUPER_ADMIN" },
  });
  console.log(`[set-super-admin] user ${user.id} (${user.phone}) -> ${user.role}`);
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
