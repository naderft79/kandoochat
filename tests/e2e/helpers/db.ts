// دسترسی مستقیم و سبک به دیتابیس برای آماده سازی/پاک سازی تست ها
import "dotenv/config";
import { Pool } from "pg";

let pool: Pool | null = null;

export async function query<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
  pool ??= new Pool({ connectionString: process.env.DATABASE_URL, max: 2 });
  const r = await pool.query(sql, params);
  return r.rows as T[];
}
