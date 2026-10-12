// تست تم روشن/تاریک: پیش فرض روشن، تغییر با دکمه، ماندگاری بعد از ریلود
import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers/auth";
import { e2eData } from "./helpers/data";

test.beforeEach(async ({ context, baseURL }) => {
  await loginAs(context, e2eData().me, baseURL);
});

test("تم پیش فرض روشن است و دکمه تاریک را فعال می کند", async ({ page }) => {
  await page.goto("/dashboard/profile");
  await page.waitForLoadState("networkidle");
  const toggle = page.getByRole("button", { name: "تغییر به حالت تاریک" });
  await expect(toggle).toBeVisible();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
  await expect(page.locator("body")).toHaveCSS("background-color", "rgb(255, 255, 255)");

  await toggle.click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(page.locator("body")).toHaveCSS("background-color", "rgb(0, 0, 0)");
  await expect(page.getByRole("button", { name: "تغییر به حالت روشن" })).toBeVisible();
});

test("انتخاب تم بعد از ریلود حفظ می شود و برگشت به روشن کار می کند", async ({ page }) => {
  await page.goto("/dashboard/profile");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "تغییر به حالت تاریک" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);

  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);

  await page.getByRole("button", { name: "تغییر به حالت روشن" }).click();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
  await expect(page.locator("body")).toHaveCSS("background-color", "rgb(255, 255, 255)");
});
