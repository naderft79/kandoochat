// فیچرهای جدید پنل کاربر: لایک ها، فعالیت من، ماموریت ها، حذف خودکار حساب و خروج از همه دستگاه ها
import { test, expect } from "@playwright/test";
import bcrypt from "bcryptjs";
import { loginAs } from "./helpers/auth";
import { e2eData } from "./helpers/data";
import { query } from "./helpers/db";

async function superAdminId(): Promise<string> {
  const rows = await query<{ id: string }>(`SELECT id FROM "User" WHERE role = 'SUPER_ADMIN' AND "isActive" = true LIMIT 1`);
  return rows[0].id;
}

test.describe("صفحه لایک ها", () => {
  test("کاربر ویژه هویت لایک کننده را می بیند", async ({ page, context, baseURL }) => {
    const d = e2eData();
    await loginAs(context, d.me, baseURL);
    await page.goto("/dashboard/likes");
    await expect(page.getByText("چه کسانی تو را پسندیدند")).toBeVisible();
    // کارت لایک کننده به پروفایل لینک است
    await expect(page.locator('a[href^="/profile/e2e_user_2"]').first()).toBeVisible();
  });

  test("کاربر رایگان فقط کارت قفل می بیند و هویت لایک کننده در صفحه نیست", async ({ context, baseURL }) => {
    const d = e2eData();
    // فیکسچر ممکن است توسط تست های دیگر غیرفعال شده باشد — دوباره فعال می کنیم
    await query(`UPDATE "User" SET "isActive" = true WHERE id IN ($1, $2)`, [d.plain, d.noSub]);
    await query(
      `INSERT INTO "Like" (id, "senderId", "receiverId", type) VALUES ('e2e-like-nosub', $1, $2, 'LIKE') ON CONFLICT (id) DO NOTHING`,
      [d.plain, d.noSub]
    );
    try {
      await loginAs(context, d.noSub, baseURL);
      const page = await context.newPage();
      await page.goto("/dashboard/likes");
      await expect(page.getByText("چه کسانی تو را پسندیدند")).toBeVisible();
      // نام لایک کننده (سارا۳) نباید در صفحه باشد — هویت به کلاینت نمی رسد
      await expect(page.getByText("سارا۳")).toHaveCount(0);
      // عکس از مسیر بلر سمت سرور می آید
      await expect(page.locator('img[src^="/api/likes/blur/"]').first()).toBeVisible();
      // خود روت بلر webp برمی گرداند
      const blur = await context.request.get("/api/likes/blur/e2e-like-nosub");
      expect(blur.status()).toBe(200);
      expect(blur.headers()["content-type"]).toContain("image/webp");
      await page.close();
    } finally {
      await query(`DELETE FROM "Like" WHERE id = 'e2e-like-nosub'`);
    }
  });

  test("روت بلر برای کاربر ویژه و لایک نامرتبط ۴۰۴ است", async ({ context, baseURL }) => {
    const d = e2eData();
    await loginAs(context, d.me, baseURL);
    const res = await context.request.get("/api/likes/blur/nonexistent");
    expect(res.status()).toBe(404);
  });
});

test.describe("صفحه فعالیت من و ماموریت ها", () => {
  test("فعالیت من رندر می شود", async ({ page, context, baseURL }) => {
    const d = e2eData();
    await loginAs(context, d.me, baseURL);
    await page.goto("/dashboard/activity");
    await expect(page.getByRole("heading", { name: "فعالیت من" })).toBeVisible();
    await expect(page.getByText("بازدید از")).toBeVisible();
  });

  test("ماموریت ها رندر می شود", async ({ page, context, baseURL }) => {
    const d = e2eData();
    await loginAs(context, d.me, baseURL);
    await page.goto("/dashboard/missions");
    await expect(page.getByRole("heading", { name: "ماموریت ها" })).toBeVisible();
  });
});

test.describe("حساب کاربری", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-1920", "روی کاربر مشترک دیتابیس اثر می گذارد؛ فقط دسکتاپ");
  });

  test("حذف خودکار حساب با رمز و خروج از همه دستگاه ها", async ({ context, baseURL }) => {
    // کاربر موقت برای حذف
    const hash = await bcrypt.hash("E2E-pass-1234", 10);
    const uid = `e2e-del-${Date.now()}`;
    await query(
      `INSERT INTO "User" (id, phone, username, password, gender, "firstName", "lastName", province, city, age, height, weight, income, "phoneVerified", "updatedAt")
       VALUES ($1, $2, $3, $4, 'MALE', 'موقت', 'حذفی', 'تهران', 'تهران', 30, 175, 70, 0, true, now())`,
      [uid, `0909999${String(Date.now()).slice(-4)}`, uid, hash]
    );

    try {
      await loginAs(context, uid, baseURL);

      // رمز اشتباه
      const bad = await context.request.post("/api/account/delete", { data: { password: "wrong-pass" } });
      expect(bad.status()).toBe(400);

      // حذف با رمز درست
      const ok = await context.request.post("/api/account/delete", { data: { password: "E2E-pass-1234", reason: "تست" } });
      expect(ok.status()).toBe(200);

      const after = await query<{ deletedAt: string | null; isActive: boolean }>(
        `SELECT "deletedAt"::text AS "deletedAt", "isActive" FROM "User" WHERE id = $1`,
        [uid]
      );
      expect(after[0].deletedAt).toBeTruthy();
      expect(after[0].isActive).toBe(false);
    } finally {
      await query(`DELETE FROM "User" WHERE id = $1`, [uid]);
    }
  });

  test("خروج از همه دستگاه ها سشن را باطل می کند", async ({ context, baseURL }) => {
    const d = e2eData();
    // روی کاربر تازه تست می کنیم تا سشن سایر تست ها خراب نشود
    const hash = await bcrypt.hash("E2E-pass-1234", 10);
    const uid = `e2e-lo-${Date.now()}`;
    await query(
      `INSERT INTO "User" (id, phone, username, password, gender, "firstName", "lastName", province, city, age, height, weight, income, "updatedAt")
       VALUES ($1, $2, $3, $4, 'FEMALE', 'موقت', 'خروجی', 'تهران', 'تهران', 26, 165, 55, 0, now())`,
      [uid, `0909998${String(Date.now()).slice(-4)}`, uid, hash]
    );

    try {
      await loginAs(context, uid, baseURL);
      // سشن قبل از خروج کار می کند
      const before = await context.request.get("/api/missions");
      expect(before.status()).toBe(200);

      const res = await context.request.post("/api/account/logout-all");
      expect(res.status()).toBe(200);

      // همان کوکی دیگر معتبر نیست
      const after = await context.request.get("/api/missions");
      expect(after.status()).toBe(401);
    } finally {
      await query(`DELETE FROM "User" WHERE id = $1`, [uid]);
    }
  });
});

test.describe("اطلاعیه سراسری", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-1920", "داده مشترک؛ فقط دسکتاپ");
  });

  test("ساخت توسط ادمین، نمایش برای کاربر و بستن", async ({ context, baseURL }) => {
    // ساخت اطلاعیه با نقش سوپر ادمین
    const adminCtx = await context.browser()!.newContext({ baseURL });
    await loginAs(adminCtx, await superAdminId(), baseURL, "SUPER_ADMIN");
    const create = await adminCtx.request.post("/api/admin/announcements", {
      data: { title: "اطلاعیه تست E2E", body: "متن تست اطلاعیه", type: "INFO" },
    });
    expect(create.status()).toBe(200);
    const { item } = await create.json();

    try {
      const d = e2eData();
      await loginAs(context, d.me, baseURL);
      const page = await context.newPage();
      await page.goto("/dashboard");
      const banner = page.getByText("اطلاعیه تست E2E");
      await expect(banner).toBeVisible();
      // بستن بنر
      await page.getByRole("button", { name: "بستن اطلاعیه" }).click();
      await expect(banner).toHaveCount(0);
      // بعد از رفرش هم نمایش داده نمی شود
      await page.reload();
      await expect(page.getByText("اطلاعیه تست E2E")).toHaveCount(0);
      await page.close();
    } finally {
      await adminCtx.request.delete(`/api/admin/announcements?id=${item.id}`);
      await adminCtx.close();
    }
  });

  test("کاربر عادی به API اطلاعیه دسترسی ندارد", async ({ context, baseURL }) => {
    const d = e2eData();
    await loginAs(context, d.me, baseURL);
    const res = await context.request.post("/api/admin/announcements", {
      data: { title: "x", body: "y" },
    });
    expect(res.status()).toBe(403);
  });
});
