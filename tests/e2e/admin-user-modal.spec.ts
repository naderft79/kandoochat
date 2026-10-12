// اسموک مودال پروفایل کاربر: باز شدن از اسم کاربر، تب ها، ثبت لاگ مشاهده پیام ها، و ناوبری با بازگشت
import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers/auth";
import { query } from "./helpers/db";

async function superAdminId(): Promise<string> {
  const rows = await query<{ id: string }>(`SELECT id FROM "User" WHERE role = 'SUPER_ADMIN' AND "isActive" = true LIMIT 1`);
  if (!rows[0]) throw new Error("no active SUPER_ADMIN in test database");
  return rows[0].id;
}

test.describe("مودال پروفایل کاربر — اسموک", () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await loginAs(context, await superAdminId(), baseURL, "SUPER_ADMIN");
  });

  test("با کلیک روی اسم کاربر در فهرست، مودال باز و تب ها دیده می شوند", async ({ page }) => {
    await page.goto("/admin/users", { waitUntil: "networkidle" });
    const firstName = page.locator("[data-user-link]").first();
    await firstName.waitFor({ timeout: 30_000 });
    await firstName.click();

    const dialog = page.getByRole("dialog", { name: "پروفایل کاربر" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("button", { name: "مالی" })).toBeVisible();
    await expect(dialog.getByRole("button", { name: "پیام ها" })).toBeVisible();
    await expect(dialog.getByRole("button", { name: "فعالیت و امنیت" })).toBeVisible();
    await expect(dialog.getByRole("button", { name: "احراز هویت" })).toBeVisible();
  });

  test("تب مالی داده را بارگذاری می کند و دکمه بستن مودال را می بندد", async ({ page }) => {
    await page.goto("/admin/users", { waitUntil: "networkidle" });
    await page.locator("[data-user-link]").first().click();
    const dialog = page.getByRole("dialog", { name: "پروفایل کاربر" });
    await expect(dialog).toBeVisible();

    const finance = page.waitForResponse((r) => r.url().includes("/tabs/finance") && r.ok());
    await dialog.getByRole("button", { name: "مالی" }).click();
    await finance;
    await expect(dialog.getByText(/مورد$/).first()).toBeVisible();

    await dialog.getByRole("button", { name: "بستن" }).click();
    await expect(dialog).toHaveCount(0);
  });

  test("مشاهده پیام ها در لاگ ادمین ثبت می شود", async ({ page }) => {
    await page.goto("/admin/users", { waitUntil: "networkidle" });
    await page.locator("[data-user-link]").first().click();
    const dialog = page.getByRole("dialog", { name: "پروفایل کاربر" });
    await expect(dialog).toBeVisible();

    const messages = page.waitForResponse((r) => r.url().includes("/tabs/messages") && r.ok());
    await dialog.getByRole("button", { name: "پیام ها" }).click();
    await messages;

    const rows = await query<{ n: string }>(
      `SELECT COUNT(*)::text AS n FROM "AuditLog" WHERE action = 'VIEW_USER_MESSAGES' AND "createdAt" > (NOW() AT TIME ZONE 'UTC') - INTERVAL '5 minutes'`
    );
    expect(Number(rows[0]?.n ?? 0)).toBeGreaterThan(0);
  });

  test("از اسم کاربر داخل مودال، پروفایل کاربر دیگر باز و با بازگشت برمی گردد", async ({ page }) => {
    await page.goto("/admin/users", { waitUntil: "networkidle" });
    await page.locator("[data-user-link]").first().click();
    const dialog = page.getByRole("dialog", { name: "پروفایل کاربر" });
    await expect(dialog).toBeVisible();

    const messages = page.waitForResponse((r) => r.url().includes("/tabs/messages") && r.ok());
    await dialog.getByRole("button", { name: "پیام ها" }).click();
    await messages;

    const otherName = dialog.locator("[data-user-link]").first();
    if ((await otherName.count()) === 0) test.skip(true, "این کاربر گفتگویی ندارد");
    await otherName.click();

    const back = page.getByRole("button", { name: "بازگشت به کاربر قبلی" });
    await expect(back).toBeVisible();
    await back.click();
    await expect(back).toHaveCount(0);
    await expect(page.getByRole("dialog", { name: "پروفایل کاربر" })).toBeVisible();
  });

  test("خروجی اکسل تب مالی یک فایل XLSX معتبر می دهد", async ({ page }) => {
    await page.goto("/admin/users", { waitUntil: "networkidle" });
    const id = await page.locator("[data-user-link]").first().getAttribute("data-user-link");
    const res = await page.request.get(`/api/admin/users/${id}/tabs/finance/export?kind=`);
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("spreadsheetml");
    const body = await res.body();
    expect(body.subarray(0, 2).toString()).toBe("PK");
  });
});
