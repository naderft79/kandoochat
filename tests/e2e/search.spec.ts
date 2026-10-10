// تست جستجو: فیلتر ذخیره شده، چیپ ها، مرتب سازی، جستجوی اخیر
import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers/auth";
import { e2eData } from "./helpers/data";

test.describe.configure({ mode: "serial" });

test.beforeEach(async ({ context, baseURL }, info) => {
  test.skip(info.project.name !== "iphone-14" && info.project.name !== "laptop-1366", "یک موبایل و یک دسکتاپ");
  await loginAs(context, e2eData().me, baseURL);
  // وضعیت فیلتر ذخیره شده بین تست ها پاک شود
  await context.request.put("/api/search/filters", {
    data: { city: "تهران", ageMin: "", ageMax: "", heightMin: "", heightMax: "", incomeMin: "", hasPhoto: false, interests: [], verifiedOnly: false, onlineOnly: false, sort: "NEWEST" },
  });
});

test("فیلتر اعمال، چیپ نمایش و ذخیره می شود", async ({ page }) => {
  await page.goto("/dashboard/search");
  await page.getByRole("button", { name: /^فیلتر/ }).click();
  const sheet = page.getByRole("dialog", { name: "فیلترها" });
  await sheet.getByLabel("سن از").fill("30");
  await sheet.getByLabel("سن تا").fill("40");
  const saved = page.waitForResponse((r) => r.url().includes("/api/search/filters") && r.request().method() === "PUT");
  await sheet.getByRole("button", { name: "اعمال فیلتر" }).click();
  await expect(page.getByRole("button", { name: /حذف فیلتر سن/ })).toBeVisible();
  await saved;

  await page.reload();
  await expect(page.getByRole("button", { name: /حذف فیلتر سن/ })).toBeVisible();

  await page.getByRole("button", { name: "پاک کردن همه" }).click();
  await expect(page.getByRole("button", { name: /حذف فیلتر سن/ })).toHaveCount(0);
});

test("مرتب سازی با شیت", async ({ page }) => {
  await page.goto("/dashboard/search");
  await page.getByRole("button", { name: "مرتب سازی" }).click();
  await page.getByRole("radio", { name: "فعال ترین" }).click();
  await expect(page.getByRole("button", { name: "مرتب سازی" })).toContainText("فعال ترین");
});

test("جستجوی اخیر ذخیره و نمایش داده می شود", async ({ page }) => {
  await page.goto("/dashboard/search");
  await page.evaluate(() => localStorage.removeItem("kandoo_recent_searches"));
  const input = page.getByRole("searchbox");
  await input.fill("سارا");
  await page.waitForTimeout(1300);
  await input.fill("");
  await input.blur();
  await input.focus();
  await expect(page.getByText("جستجوهای اخیر")).toBeVisible();
  await expect(page.getByRole("button", { name: "سارا", exact: true })).toBeVisible();
});
