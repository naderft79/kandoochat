// اسموک تست پنل ادمین: صفحات اصلی بدون ریدایرکت و خطا باز می شوند؛ صفحه حذف شده نوتیفیکیشن ۴۰۴ است
import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers/auth";
import { query } from "./helpers/db";

async function superAdminId(): Promise<string> {
  const rows = await query<{ id: string }>(`SELECT id FROM "User" WHERE role = 'SUPER_ADMIN' AND "isActive" = true LIMIT 1`);
  if (!rows[0]) throw new Error("no active SUPER_ADMIN in test database");
  return rows[0].id;
}

const ADMIN_PAGES = [
  "/admin",
  "/admin/verify",
  "/admin/stats",
  "/admin/analytics",
  "/admin/withdrawals",
  "/admin/transactions",
  "/admin/users",
];

test.describe("پنل ادمین — اسموک", () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await loginAs(context, await superAdminId(), baseURL, "SUPER_ADMIN");
  });

  for (const path of ADMIN_PAGES) {
    test(`صفحه ${path} بدون ریدایرکت باز می شود`, async ({ page }) => {
      const res = await page.goto(path, { waitUntil: "domcontentloaded" });
      expect(res?.status()).toBeLessThan(400);
      expect(new URL(page.url()).pathname).toBe(path);
      await expect(page.getByText("Application error")).toHaveCount(0);
    });
  }

  test("صفحه نوتیفیکیشن ادمین حذف شده است", async ({ page }) => {
    const res = await page.goto("/admin/notifications", { waitUntil: "domcontentloaded" });
    expect(res?.status()).toBe(404);
  });

  test("منوی سایدبار احراز هویت، برداشت ها و تراکنش ها را دارد", async ({ page }) => {
    await page.goto("/admin", { waitUntil: "domcontentloaded" });
    for (const href of ["/admin/verify", "/admin/withdrawals", "/admin/transactions"]) {
      await expect(page.locator(`a[href="${href}"]`).first()).toBeAttached();
    }
  });

  test("آمار: ۶۰ شاخص و نمودار نمایش داده می شود", async ({ page }) => {
    await page.goto("/admin/stats", { waitUntil: "networkidle" });
    await expect(page.getByText("ثبت نام ۱۴ روز اخیر")).toBeVisible();
    await expect(page.getByText(/شاخص · به‌روزرسانی هر ۳۰ ثانیه/)).toBeVisible();
  });

  test("صفحه کاربران: فیلتر استان و شهر بدون باز کردن پنل دیده می شود", async ({ page }) => {
    await page.goto("/admin/users", { waitUntil: "networkidle" });
    const province = page.getByLabel("فیلتر استان");
    const city = page.getByLabel("فیلتر شهر");
    await expect(province).toBeVisible();
    await expect(city).toBeDisabled();
    await province.selectOption("تهران");
    await expect(province).toHaveValue("تهران");
    await expect(city).toBeEnabled({ timeout: 15_000 });
  });

  test("داشبورد ۱۲ نمودار دارد و با فونت سایت رسم می شود", async ({ page }) => {
    await page.goto("/admin", { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => document.querySelectorAll("div[role=img] canvas").length >= 12, null, { timeout: 60_000 });
    const info = await page.evaluate(() => {
      const first = document.querySelector("div[role=img]");
      const grid = first?.closest(".grid");
      return {
        charts: document.querySelectorAll("div[role=img]").length,
        cols: grid ? getComputedStyle(grid).gridTemplateColumns.split(" ").length : 0,
        body: getComputedStyle(document.body).fontFamily,
      };
    });
    expect(info.charts).toBe(12);
    expect(info.body).toContain("Vazirmatn");
    if (test.info().project.name === "desktop-1920") expect(info.cols).toBe(3);
  });

  test("کارت کاربر IP و بلوک آمار را نشان می دهد", async ({ page }) => {
    await page.goto("/admin/users", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("آخرین IP:").first()).toBeVisible();
    await expect(page.getByText("جمع مبلغ برداشتی").first()).toBeVisible();
  });
});
