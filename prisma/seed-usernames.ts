// اسکریپت تولید یوزرنیم یکتا برای کاربران فعلی
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

function randomUsername(base: string): string {
  const suffix = Math.floor(Math.random() * 9999);
  return `${base}${suffix}`;
}

async function main() {
  const users = await prisma.user.findMany();
  console.log(`Found ${users.length} users`);

  for (const user of users) {
    if (user.username && user.username !== "temp") continue;

    const base = user.firstName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .slice(0, 8) || "user";

    let username = randomUsername(base);
    let attempts = 0;

    while (attempts < 50) {
      const existing = await prisma.user.findFirst({ where: { username } });
      if (!existing) break;
      username = randomUsername(base);
      attempts++;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { username },
    });
    console.log(`Updated user ${user.id} -> username: ${username}`);
  }

  console.log("Done!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
