// اسموک حذف نرم کاربر: فقط سوپر ادمین، دلیل اجباری، ناشناس سازی هویت و بازیابی در مهلت ۳۰ روزه
import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers/auth";
import { query } from "./helpers/db";

async function superAdminId(): Promise<string> {
  const rows = await query<{ id: string }>(`SELECT id FROM "User" WHERE role = 'SUPER_ADMIN' AND "isActive" = true LIMIT 1`);
  return rows[0].id;
}

test.describe("حذف نرم کاربر", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-1920", "روی همان کاربر دیتابیس کار می کند؛ فقط دسکتاپ برای جلوگیری از تداخل");
  });

  test("دلیل و نقش سوپر ادمین اجباری است و حذف نرم قابل بازیابی است", async ({ context, baseURL }) => {
    await loginAs(context, await superAdminId(), baseURL, "SUPER_ADMIN");

    const target = await query<{ id: string; username: string; phone: string; firstName: string }>(
      `SELECT id, username, phone, "firstName" FROM "User" WHERE role = 'USER' AND "deletedAt" IS NULL ORDER BY "createdAt" DESC LIMIT 1`
    );
    const user = target[0];

    try {
      // بدون دلیل
      const noReason = await context.request.patch("/api/admin/users", {
        data: { userId: user.id, action: "deleteUser" },
      });
      expect(noReason.status()).toBe(400);

      // حذف با دلیل
      const del = await context.request.patch("/api/admin/users", {
        data: { userId: user.id, action: "deleteUser", reason: "تست حذف خودکار" },
      });
      expect(del.status()).toBe(200);

      const after = await query<{ isActive: boolean; username: string; phone: string; firstName: string; lastName: string; deletedAt: string | null; snap: unknown }>(
        `SELECT "isActive", username, phone, "firstName", "lastName", "deletedAt"::text AS "deletedAt", "deletedSnapshot" AS snap FROM "User" WHERE id = $1`,
        [user.id]
      );
      expect(after[0].isActive).toBe(false);
      expect(after[0].deletedAt).toBeTruthy();
      expect(after[0].username).toBe(`del_${user.id}`);
      expect(after[0].phone).toBe(`del_${user.id}`);
      expect(`${after[0].firstName} ${after[0].lastName}`).toBe("کاربر حذف شده");
      expect(after[0].snap).toBeTruthy();

      // حذف دوباره باید خطا باشد
      const again = await context.request.patch("/api/admin/users", {
        data: { userId: user.id, action: "deleteUser", reason: "تکراری" },
      });
      expect(again.status()).toBe(400);

      // بازیابی
      const restore = await context.request.patch("/api/admin/users", {
        data: { userId: user.id, action: "restoreUser" },
      });
      expect(restore.status()).toBe(200);

      const restored = await query<{ isActive: boolean; username: string; phone: string; deletedAt: string | null; snap: unknown }>(
        `SELECT "isActive", username, phone, "deletedAt"::text AS "deletedAt", "deletedSnapshot" AS snap FROM "User" WHERE id = $1`,
        [user.id]
      );
      expect(restored[0].isActive).toBe(true);
      expect(restored[0].deletedAt).toBeNull();
      expect(restored[0].username).toBe(user.username);
      expect(restored[0].phone).toBe(user.phone);
      expect(restored[0].snap).toBeNull();
    } finally {
      // در صورت شکست تست، کاربر را به حالت عادی برمی گردانیم
      await query(
        `UPDATE "User" SET "isActive" = true, "deletedAt" = NULL, "deletedById" = NULL, "deleteReason" = NULL, "deletePurgeAfter" = NULL, "deletedSnapshot" = NULL WHERE id = $1`,
        [user.id]
      );
    }
  });

  test("مدیر غیر سوپر ادمین نمی تواند حذف کند", async ({ context, baseURL }) => {
    const admins = await query<{ id: string }>(
      `SELECT id FROM "User" WHERE role IN ('ADMIN', 'SUPPORT_ADMIN', 'CONTENT_ADMIN') AND "isActive" = true LIMIT 1`
    );
    test.skip(admins.length === 0, "مدیر غیر سوپر ادمین در دیتابیس نیست");
    await loginAs(context, admins[0].id, baseURL, "SUPPORT_ADMIN");
    const res = await context.request.patch("/api/admin/users", {
      data: { userId: "any", action: "deleteUser", reason: "unauthorized" },
    });
    expect(res.status()).toBe(403);
  });

  test("دکمه حذف کامل و تب حذف شده ها برای سوپر ادمین دیده می شود", async ({ page, context, baseURL }) => {
    await loginAs(context, await superAdminId(), baseURL, "SUPER_ADMIN");
    await page.goto("/admin/users", { waitUntil: "networkidle" });
    await expect(page.getByRole("button", { name: "حذف شده ها" })).toBeVisible();
    await expect(page.getByRole("button", { name: "حذف کامل" }).first()).toBeVisible();
  });
});
