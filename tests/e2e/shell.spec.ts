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

test("منوی پروفایل همه صفحه های فرعی را دارد و ناوبری می کند", async ({ page }) => {
  await page.goto("/dashboard/profile");
  const dialog = page.getByRole("dialog", { name: "منو" });
  // کلیک قبل از تکمیل هیدرات بی اثر است — تا باز شدن منو تکرار می شود
  await expect(async () => {
    await page.getByRole("button", { name: "منو" }).click();
    await expect(dialog).toBeVisible({ timeout: 1500 });
  }).toPass({ timeout: 15_000 });
  for (const name of ["کیف پول", "اشتراک", "فعالیت ها", "دعوت دوستان", "پشتیبانی", "تنظیمات", "خروج از حساب"]) {
    await expect(dialog.getByText(name, { exact: true })).toBeVisible();
  }
  await dialog.getByText("اشتراک", { exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard\/subscription/);
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

test("نوار آفلاین", async ({ page, context }) => {
  await page.goto("/dashboard/search");
  await context.setOffline(true);
  await expect(page.getByText("اتصال اینترنت قطع است")).toBeVisible();
  await context.setOffline(false);
  await expect(page.getByText("اتصال اینترنت قطع است")).toBeHidden();
});

test("حالت افقی گوشی مسدود نمی شود", async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto("/dashboard");
  await expect(page.getByText("دستگاه خود را بچرخانید")).toHaveCount(0);
  await expect(page.locator("main")).toBeVisible();
});
