// بررسی سریع کاربران تست E2E
import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  const data = JSON.parse(
    (await import("fs")).readFileSync("tests/.e2e-data.json", "utf8")
  );
  const users = await prisma.user.findMany({
    where: { id: { in: [data.me, data.liked, data.plain, data.blocked, data.noSub] } },
    select: { id: true, phone: true, isActive: true, gender: true },
  });
  console.log(JSON.stringify(users, null, 2));

  // تست ۴۰۱ یا مربوط به فرستادن پیام روی /api/feed/home
  const res = await fetch("http://localhost:3000/api/feed/home?seed=abc12345&offset=0&limit=20", {
    headers: { cookie: "kandoo_session=x" },
  });
  console.log("status with dummy cookie:", res.status);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
