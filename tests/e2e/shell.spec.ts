// تست شل و ناوبری: منوی موبایل، تب های پایین، چت دو ستونی، 404، آفلاین، حالت افقی
import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers/auth";
import { e2eData } from "./helpers/data";

test.beforeEach(async ({ context, baseURL }) => {
  await loginAs(context, e2eData().me, baseURL);
});

test("تب های پایین برچسب دسترس پذیر دارند و تب فعال مشخص است", async ({ page, viewport }) => {
  test.skip(!viewport || viewport.width >= 1024, "فقط موبایل");
  await page.goto("/dashboard/search");
  const nav = page.locator("nav.lg\\:hidden");
  for (const name of ["خانه", "جستجو", "پیام ها", "کیف پول", "پروفایل"]) {
    await expect(nav.getByRole("link", { name })).toBeVisible();
  }
  await expect(nav.getByRole("link", { name: "جستجو" })).toHaveAttribute("aria-current", "page");
});

test("منوی پروفایل صفحه های فرعی را دارد و ناوبری می کند", async ({ page }) => {
  await page.goto("/dashboard/profile");
  const dialog = page.getByRole("dialog", { name: "منو" });
  // کلیک قبل از تکمیل هیدرات بی اثر است — تا باز شدن منو تکرار می شود
  await expect(async () => {
    await page.getByRole("button", { name: "منو" }).click();
    await expect(dialog).toBeVisible({ timeout: 1500 });
  }).toPass({ timeout: 15_000 });
  for (const name of ["پشتیبانی", "تنظیمات", "راهنما و سوالات متداول", "قوانین و مقررات", "خروج از حساب"]) {
    await expect(dialog.getByText(name, { exact: true })).toBeVisible();
  }
  await dialog.getByText("تنظیمات", { exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard\/settings/);
});

test("چت: دسکتاپ دو ستونی، موبایل تک ستونی", async ({ page, viewport }) => {
  const d = e2eData();
  await page.goto(`/dashboard/chat/${d.conversationId}`);
  // فقط ۵۰ پیام آخر لود می شود — به محتوای خاص وابسته نیستیم
  await expect(page.getByPlaceholder("پیام بنویس...")).toBeVisible();
  await expect(page.getByTestId("message-list").locator("p").first()).toBeVisible();
  const listHeader = page.getByRole("heading", { name: "پیام ها" }).or(page.getByText("پیام ها", { exact: true }).first());
  if (viewport && viewport.width >= 1024) {
    await expect(page.locator("aside").filter({ hasText: "هانی" }).first()).toBeVisible();
  } else {
    await expect(page.locator("aside").filter({ hasText: "هانی" }).first()).toBeHidden();
  }
  void listHeader;
});

test("صفحه ۴۰۴ برندشده", async ({ page }) => {
  await page.goto("/dashboard/nothing-here-xyz");
  await expect(page.getByRole("heading", { name: "صفحه پیدا نشد" })).toBeVisible();
});

test("صفحه آفلاین PWA نمایش داده می شود", async ({ page }) => {
  await page.goto("/offline");
  await expect(page.getByRole("heading", { name: "به اینترنت متصل نیستید" })).toBeVisible();
});

test("حالت افقی: گوشی پیام چرخش می گیرد، تبلت و دسکتاپ مسدود نمی شوند", async ({ page, viewport }) => {
  await page.goto("/dashboard");
  const guard = page.locator(".portrait-guard");
  const touch = await page.evaluate(() => matchMedia("(pointer: coarse)").matches);
  const phoneLandscape = !!viewport && viewport.width > viewport.height && viewport.height <= 500 && touch;
  if (phoneLandscape) {
    await expect(guard).toBeVisible();
    await expect(guard.getByText("دستگاه خود را بچرخانید")).toBeVisible();
  } else {
    await expect(guard).toBeHidden();
  }
  await expect(page.locator("main")).toBeVisible();
});
