import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
  const r = await prisma.setting.findUnique({ where: { key: "FREE_WEEK_SUBSCRIPTION" } });
  console.log("DB VALUE:", JSON.stringify(r));
  await pool.end();
}
main().then(() => process.exit(0));
