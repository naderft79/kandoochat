// تست رفتار کتابخانه UI: Esc، focus trap، back مرورگر، a11y
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("کتابخانه UI", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/ui-kit", { waitUntil: "networkidle" });
  });

  test("دیالوگ با Esc بسته می شود و فوکوس برمی گردد", async ({ page }) => {
    const trigger = page.getByRole("button", { name: "دیالوگ هشدار" });
    await trigger.click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test("فوکوس داخل مودال می ماند", async ({ page }) => {
    await page.getByRole("button", { name: "مودال", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press("Tab");
      const inside = await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'));
      expect(inside).toBe(true);
    }
  });

  test("دکمه back مرورگر شیت را می بندد", async ({ page }) => {
    await page.getByRole("button", { name: "شیت", exact: true }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.goBack();
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(page).toHaveURL(/\/ui-kit$/);
  });

  test("اسکرول بدنه هنگام مودال قفل است", async ({ page }) => {
    await page.getByRole("button", { name: "مودال", exact: true }).click();
    expect(await page.evaluate(() => document.body.style.overflow)).toBe("hidden");
    await page.keyboard.press("Escape");
    expect(await page.evaluate(() => document.body.style.overflow)).toBe("");
  });

  test("axe: صفحه نمونه و دیالوگ بدون نقص جدی", async ({ page }) => {
    let r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(r.violations.filter((v) => ["critical", "serious"].includes(v.impact ?? "")).map((v) => v.id)).toEqual([]);
    await page.getByRole("button", { name: "دیالوگ تایید" }).click();
    await page.waitForTimeout(500);
    r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(r.violations.filter((v) => ["critical", "serious"].includes(v.impact ?? "")).map((v) => v.id)).toEqual([]);
  });
});
