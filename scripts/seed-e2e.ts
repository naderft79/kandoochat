// ساخت و پاک سازی کاربران تست E2E — استفاده: tsx scripts/seed-e2e.ts [--clean]
import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";

// شماره های تستی با پیشوند ۰۹۰۰۰۰۰ (شماره واقعی با این پیشوند وجود ندارد)
const PREFIX = "0900000";
const OUT = path.join("tests", ".e2e-data.json");
const PHOTO_SRC = path.join("scripts", "face-detector", "test-lena.jpg");
const PHOTO_DIR = path.join("public", "uploads", "e2e");

async function clean() {
  await prisma.user.deleteMany({ where: { phone: { startsWith: PREFIX } } });
  fs.rmSync(PHOTO_DIR, { recursive: true, force: true });
  fs.rmSync(OUT, { force: true });
  console.log("[seed-e2e] cleaned");
}

function base(
  i: number,
  gender: "MALE" | "FEMALE",
  extra: Record<string, unknown> = {}
) {
  return {
    phone: `${PREFIX}${String(i).padStart(4, "0")}`,
    username: `e2e_user_${i}`,
    password: "",
    gender,
    firstName: gender === "MALE" ? `آرش${i}` : `سارا${i}`,
    lastName: "تست",
    province: "تهران",
    city: "تهران",
    age: 25 + i,
    height: 170,
    weight: 65,
    income: 20000000,
    phoneVerified: true,
    bio: "کاربر تست خودکار",
    ...extra,
  };
}

async function main() {
  await clean();
  if (process.argv.includes("--clean")) return;

  fs.mkdirSync(PHOTO_DIR, { recursive: true });
  fs.copyFileSync(PHOTO_SRC, path.join(PHOTO_DIR, "face.jpg"));
  const photoUrl = "/uploads/e2e/face.jpg";
  const hash = await bcrypt.hash("E2E-pass-1234", 10);

  const specs = [
    base(1, "MALE", { password: hash }), // me: مرد با اشتراک
    base(2, "FEMALE", { password: hash }), // لایک متقابل + گفتگو
    base(3, "FEMALE", { password: hash }), // بدون تعامل
    base(4, "FEMALE", { password: hash }), // بلاک شده
    base(5, "MALE", { password: hash }), // بدون اشتراک و بدون عکس
  ];
  const users = [];
  for (const s of specs)
    users.push(
      await prisma.user.create({
        data: {
          ...s,
          referralCode: `KD${s.username
            .replace("e2e_user_", "")
            .toUpperCase()}E2E`,
        } as never,
      })
    );
  const [me, liked, plain, blocked, noSub] = users;

  const now = new Date();
  for (const u of [me, liked, plain, blocked]) {
    await prisma.profilePhoto.create({
      data: {
        userId: u.id,
        url: photoUrl,
        order: 0,
        isProfile: true,
        isVerified: true,
      },
    });
  }
  for (const u of users)
    await prisma.wallet.create({ data: { userId: u.id, balance: 100 } });
  await prisma.subscription.create({
    data: {
      userId: me.id,
      startsAt: now,
      endsAt: new Date(now.getTime() + 30 * 86400000),
      coinsPaid: 0,
    },
  });
  await prisma.like.create({
    data: { senderId: liked.id, receiverId: me.id, type: "LIKE" },
  });
  await prisma.block.create({
    data: { blockerId: me.id, blockedId: blocked.id },
  });

  const [a, b] = [me.id, liked.id].sort();
  const conv = await prisma.conversation.create({
    data: { userAId: a, userBId: b, startedBy: me.id },
  });
  // ۶۰ پیام قدیمی برای تست صفحه بندی تاریخچه
  await prisma.message.createMany({
    data: Array.from({ length: 60 }, (_, i) => ({
      conversationId: conv.id,
      senderId: i % 2 ? liked.id : me.id,
      content: `پیام قدیمی ${String(i + 1).padStart(2, "0")}`,
      type: "TEXT" as const,
      createdAt: new Date(now.getTime() - (61 - i) * 60000),
    })),
  });
  for (let i = 0; i < 3; i++) {
    await prisma.message.create({
      data: {
        conversationId: conv.id,
        senderId: i % 2 ? liked.id : me.id,
        content: `پیام تست ${i + 1}`,
        type: "TEXT",
      },
    });
  }

  fs.mkdirSync("tests", { recursive: true });
  fs.writeFileSync(
    OUT,
    JSON.stringify(
      {
        me: me.id,
        liked: liked.id,
        plain: plain.id,
        blocked: blocked.id,
        noSub: noSub.id,
        conversationId: conv.id,
        plainPhone: plain.phone,
        mePhone: me.phone,
      },
      null,
      2
    )
  );
  console.log("[seed-e2e] done ->", OUT);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
