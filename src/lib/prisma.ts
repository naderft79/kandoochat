// اتصال سراسری به دیتابیس با Prisma 7 و PostgreSQL
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { publishToUser } from "@/lib/userEvents";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  const pool = new Pool({
    connectionString,
    // پیش فرض pg فقط 10 اتصال است که زیر بار همزمان باعث P2028 می شود
    max: Number(process.env.PG_POOL_MAX ?? 50),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

// کلاینت پایه برای کوئری های داخلی داخل هوک ها (تا extension دوباره اجرا نشود)
const base = globalForPrisma.prisma ?? createClient();

// رویدادهای real-time: با هر نوتیفیکیشن/پیام جدید یا تغییر موجودی، به SSE کاربر خبر می دهیم
export const prisma = base.$extends({
  query: {
    notification: {
      async create({ args, query }) {
        const result = await query(args);
        // خود اعلان هم همراه رویداد می رود تا بنر زنده درون برنامه نمایش داده شود
        if (result.userId) publishToUser(result.userId, "change", { scope: "notifications", notification: result });
        return result;
      },
    },
    message: {
      async create({ args, query }) {
        const result = await query(args);
        // گیرنده پیام را پیدا کن تا بج پیام نخوانده و نوتیف زنده او به روز شود
        void Promise.all([
          base.conversation.findUnique({
            where: { id: result.conversationId },
            select: { userAId: true, userBId: true },
          }),
          base.user.findUnique({
            where: { id: result.senderId },
            select: { firstName: true, lastName: true },
          }),
        ])
          .then(([conv, sender]) => {
            if (!conv) return;
            const recipientId = conv.userAId === result.senderId ? conv.userBId : conv.userAId;
            const preview =
              result.type === "TEXT"
                ? String(result.content ?? "").slice(0, 100)
                : result.type === "IMAGE"
                  ? "عکس"
                  : result.type === "VOICE"
                    ? "پیام صوتی"
                    : result.type === "VIDEO"
                      ? "ویدیو"
                      : "رسانه جدید";
            publishToUser(recipientId, "change", {
              scope: "messages",
              message: {
                id: result.id,
                conversationId: result.conversationId,
                senderName: sender ? `${sender.firstName} ${sender.lastName}`.trim() : "پیام جدید",
                preview,
              },
            });
          })
          .catch(() => {});
        return result;
      },
    },
    wallet: {
      async update({ args, query }) {
        const result = await query(args);
        if (result.userId) publishToUser(result.userId, "change", { scope: "wallet", balance: result.balance });
        return result;
      },
      async upsert({ args, query }) {
        const result = await query(args);
        if (result.userId) publishToUser(result.userId, "change", { scope: "wallet", balance: result.balance });
        return result;
      },
    },
  },
}) as unknown as PrismaClient;

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = base;
