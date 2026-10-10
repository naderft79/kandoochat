import "dotenv/config";
import { chromium } from "@playwright/test";
import { loginAs } from "../tests/e2e/helpers/auth";
import data from "../tests/.e2e-data.json";

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await loginAs(ctx, data.me as string);
  const page = await ctx.newPage();
  // فید: کارت دارای عکس را پیدا کن و تپ بزن
  await page.goto("http://localhost:3000/dashboard", { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  const cards = page.locator("article");
  const n = await cards.count();
  for (let i = 0; i < Math.min(n, 8); i++) {
    const c = cards.nth(i);
    if (await c.locator("img").count() > 0) {
      await c.scrollIntoViewIfNeeded();
      await c.locator("div.aspect-square").first().click({ position: { x: 12, y: 12 } });
      await page.waitForTimeout(600);
      await c.screenshot({ path: "tests/screens/feed-actions-open.png" });
      break;
    }
  }
  // پروفایل: لیست قابلیت ها
  await page.goto("http://localhost:3000/dashboard/profile", { waitUntil: "networkidle" });
  await page.getByText("قابلیت های ویژه").scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await page.screenshot({ path: "tests/screens/profile-features.png" });
  // شیت ترغیب بخش ویژه
  await page.getByText("اضافه شدن در بخش ویژه").click();
  await page.waitForTimeout(700);
  await page.screenshot({ path: "tests/screens/featured-sheet.png" });
  await browser.close();
  console.log("done");
})();
