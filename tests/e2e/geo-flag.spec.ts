// اسموک کشور و پرچم IP: کشور از دیتابیس محلی تعیین می شود، پرچم SVG نمایش داده می شود و IP فقط برای مدیر کامل است
import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers/auth";
import { query } from "./helpers/db";

const IRAN_IP = "2.176.0.1";
const US_IP = "8.8.8.8";

async function superAdminId(): Promise<string> {
  const rows = await query<{ id: string }>(`SELECT id FROM "User" WHERE role = 'SUPER_ADMIN' AND "isActive" = true LIMIT 1`);
  return rows[0].id;
}

// این تست ها IP یک کاربر واقعی را موقت تغییر می دهند؛ اجرای موازی پروژه ها روی یک دیتابیس باعث تداخل می شود
test.describe("پرچم و کشور IP کاربران", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-1920", "فقط در پروژه دسکتاپ اجرا شود تا دیتای مشترک تداخل نکند");
  });

  test("کشور IP ایران و آمریکا درست تشخیص داده می شود", async ({ context, baseURL }) => {
    const adminId = await superAdminId();
    await loginAs(context, adminId, baseURL, "SUPER_ADMIN");
    const target = await query<{ id: string; lastIp: string | null }>(
      `SELECT id, "lastIp" FROM "User" WHERE role = 'USER' ORDER BY "createdAt" DESC LIMIT 1`
    );
    const userId = target[0].id;
    const original = target[0].lastIp;

    try {
      for (const [ip, expected] of [[IRAN_IP, "IR"], [US_IP, "US"]] as const) {
        await query(`UPDATE "User" SET "lastIp" = $1 WHERE id = $2`, [ip, userId]);
        const body = await (await context.request.get("/api/admin/users?take=200")).json();
        const row = (body.users as { id: string; lastIp: string | null; lastCountry: string | null }[]).find((u) => u.id === userId);
        expect(row?.lastCountry).toBe(expected);
        expect(row?.lastIp).toBe(ip);
      }
    } finally {
      await query(`UPDATE "User" SET "lastIp" = $1 WHERE id = $2`, [original, userId]);
    }
  });

  test("صفحه کاربران پرچم SVG کشور را نشان می دهد", async ({ page, context, baseURL }) => {
    await loginAs(context, await superAdminId(), baseURL, "SUPER_ADMIN");
    const target = await query<{ id: string; lastIp: string | null }>(
      `SELECT id, "lastIp" FROM "User" WHERE role = 'USER' ORDER BY "createdAt" DESC LIMIT 1`
    );
    const userId = target[0].id;
    const original = target[0].lastIp;
    try {
      await query(`UPDATE "User" SET "lastIp" = $1 WHERE id = $2`, [IRAN_IP, userId]);
      await page.goto("/admin/users", { waitUntil: "networkidle" });
      await expect(page.locator('img[src="/flags/4x3/ir.svg"]').first()).toBeVisible();
    } finally {
      await query(`UPDATE "User" SET "lastIp" = $1 WHERE id = $2`, [original, userId]);
    }
  });
});
