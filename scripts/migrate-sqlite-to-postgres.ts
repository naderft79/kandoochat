// انتقال داده‌های SQLite قدیمی به PostgreSQL جدید
// اجرا: npx tsx scripts/migrate-sqlite-to-postgres.ts
// نیازمند: DATABASE_URL (PostgreSQL) و SQLITE_PATH (پیش‌فرض prisma/dev.db)

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import Database from "better-sqlite3";

const sqlitePath = process.env.SQLITE_PATH || "prisma/dev.db";
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}
const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const sqlite = new Database(sqlitePath);

type PgTypeMap = Record<string, string>;

const modelOrder = [
  "User",
  "Wallet",
  "Setting",
  "SubscriptionTier",
  "Interest",
  "Gift",
  "Mission",
  "UserSettings",
  "ProfilePhoto",
  "UserInterest",
  "Subscription",
  "WithdrawRequest",
  "Conversation",
  "Message",
  "CoinTransfer",
  "PaymentRequest",
  "Notification",
  "Like",
  "Match",
  "Block",
  "Report",
  "ProfileView",
  "Boost",
  "Streak",
  "Referral",
  "Story",
  "StoryView",
  "StoryLike",
  "StoryReply",
  "Ticket",
  "TicketMessage",
  "AuditLog",
  "UserMission",
  "GiftPurchase",
];

function toBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  const s = String(value).toLowerCase();
  return s === "1" || s === "true" || s === "yes" || s === "on";
}

function convertValue(value: unknown, pgType: string): unknown {
  if (value === null || value === undefined) return null;
  const lowerType = pgType.toLowerCase();

  if (lowerType === "boolean") {
    return toBoolean(value);
  }

  if (["integer", "bigint", "smallint", "serial", "bigserial", "real", "double precision", "numeric"].includes(lowerType)) {
    const n = Number(value);
    return isNaN(n) ? null : n;
  }

  if (["timestamp without time zone", "timestamp with time zone", "date", "time without time zone", "time with time zone"].includes(lowerType)) {
    const s = String(value);
    if (!s || s === "") return null;
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }

  // text / varchar / json / etc.
  return String(value);
}

async function getPostgresTypes(modelName: string): Promise<PgTypeMap> {
  const rows = (await prisma.$queryRawUnsafe(
    `SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='public' AND table_name = '${modelName}'`
  )) as Array<{ column_name: string; data_type: string }>;
  const map: PgTypeMap = {};
  for (const r of rows) {
    map[r.column_name] = r.data_type;
  }
  return map;
}

async function main() {
  console.log("[migrate] شروع انتقال داده از SQLite به PostgreSQL");
  console.log(`[migrate] منبع: ${sqlitePath}`);

  // غیرفعال کردن بررسی کلید خارجی برای جلوگیری از مشکل ترتیب وابستگی‌ها
  await prisma.$executeRawUnsafe("SET session_replication_role = replica;");

  for (const modelName of modelOrder) {
    const model = (prisma as any)[modelName];
    if (!model) {
      console.warn(`[migrate] مدل ${modelName} در Prisma یافت نشد، رد شد`);
      continue;
    }

    const tableName = modelName;
    const infoStmt = sqlite.prepare(`PRAGMA table_info("${tableName}")`);
    const columns: { name: string; type: string }[] = infoStmt.all() as any;
    if (!columns || columns.length === 0) {
      console.log(`[migrate] ${modelName}: جدولی در SQLite یافت نشد`);
      continue;
    }

    const pgTypes = await getPostgresTypes(modelName);

    const rows = sqlite.prepare(`SELECT * FROM "${tableName}"`).all();
    if (!Array.isArray(rows) || rows.length === 0) {
      console.log(`[migrate] ${modelName}: رکوردی یافت نشد`);
      continue;
    }

    const data = rows.map((row: any) => {
      const obj: Record<string, unknown> = {};
      for (const col of columns) {
        // نام ستون PostgreSQL و SQLite هر دو camelCase هستند
        const pgType = pgTypes[col.name] || "text";
        obj[col.name] = convertValue(row[col.name], pgType);
      }
      return obj;
    });

    try {
      await model.createMany({ data, skipDuplicates: true });
      console.log(`[migrate] ${modelName}: ${data.length} رکورد منتقل شد`);
    } catch (err) {
      console.error(`[migrate] خطا در انتقال ${modelName}:`, err);
    }
  }

  await prisma.$executeRawUnsafe("SET session_replication_role = DEFAULT;");
  console.log("[migrate] انتقال با موفقیت پایان یافت");
}

main()
  .catch((err) => {
    console.error("[migrate] خطای کلی:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    sqlite.close();
  });
