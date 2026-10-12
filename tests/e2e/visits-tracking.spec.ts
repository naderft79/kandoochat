// اسموک آمار بازدید: مسیر مرورگر کلاینت را پیگیری می کند، ورودی ها را طبقه بندی می کند و صفحه ادمین داده نشان می دهد
// توجه: توکن HeadlessChrome در User-Agent پیش فرض Playwright به عنوان ربات فیلتر می شود؛ پس UA واقعی تنظیم می کنیم
import { test, expect, request as pwRequest, type Page } from "@playwright/test";
import { loginAs } from "./helpers/auth";
import { query } from "./helpers/db";

const DESKTOP_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

async function cleanup() {
  await query(`DELETE FROM "PageView"`);
  await query(`DELETE FROM "VisitDailyStat"`);
}

// ناوبری و انتظار همزمان برای ارسال beacon تا مسابقه رخ ندهد
async function gotoAndTrack(page: Page, path: string, referer?: string) {
  const beacon = page.waitForResponse((r) => r.url().includes("/api/analytics/pageview"), { timeout: 20000 });
  await page.goto(path, referer ? { referer } : undefined);
  await beacon;
}

test.describe("ردیابی بازدید صفحات", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-1920", "ردیابی در همه پروژه ها یکسان است؛ فقط دسکتاپ برای جلوگیری از تداخل دیتا");
  });

  test("ورودی از گوگل و بازدید داخلی ثبت می شود", async ({ browser, baseURL }) => {
    await cleanup();
    const ctx = await browser.newContext({ userAgent: DESKTOP_UA, baseURL });
    try {
      const page = await ctx.newPage();
      await gotoAndTrack(page, "/login", "https://www.google.com/search?q=kandoo");
      await gotoAndTrack(page, "/about");
    } finally {
      await ctx.close();
    }
    const rows = await query<{ pageKey: string; channel: string; source: string; isEntry: boolean }>(
      `SELECT "pageKey", "channel", "source", "isEntry" FROM "PageView" ORDER BY "createdAt" ASC`
    );
    const login = rows.find((r) => r.pageKey === "login");
    const about = rows.find((r) => r.pageKey === "about");
    expect(login).toBeTruthy();
    expect(login?.isEntry).toBe(true);
    expect(login?.channel).toBe("SEARCH");
    expect(login?.source).toBe("google");
    expect(about).toBeTruthy();
    expect(about?.isEntry).toBe(false);
    expect(about?.channel).toBe("INTERNAL");
  });

  test("ورودی با utm از اینستاگرام ثبت می شود", async ({ browser, baseURL }) => {
    await cleanup();
    const ctx = await browser.newContext({ userAgent: DESKTOP_UA, baseURL });
    try {
      const page = await ctx.newPage();
      await gotoAndTrack(page, "/register?utm_source=instagram&utm_medium=social");
    } finally {
      await ctx.close();
    }
    const rows = await query<{ channel: string; source: string }>(`SELECT "channel", "source" FROM "PageView" WHERE "pageKey" = 'register'`);
    expect(rows[0]?.channel).toBe("SOCIAL");
    expect(rows[0]?.source).toBe("instagram");
  });

  test("بازدید مدیر در آمار ثبت نمی شود", async ({ browser, baseURL }) => {
    await cleanup();
    const ctx = await browser.newContext({ userAgent: DESKTOP_UA, baseURL });
    try {
      const page = await ctx.newPage();
      const rows = await query<{ id: string }>(`SELECT id FROM "User" WHERE role = 'SUPER_ADMIN' LIMIT 1`);
      await loginAs(ctx, rows[0].id, baseURL, "SUPER_ADMIN");
      await page.goto("/");
      await page.waitForTimeout(3000);
    } finally {
      await ctx.close();
    }
    // beacon های تست های قبلی ممکن است دیر برسند؛ پس فقط بازدیدهای کاربر لاگین شده را می شماریم
    // (هر ردیف لاگین شده در این پنجره یعنی بازدید مدیر ثبت شده است)
    const count = await query<{ n: number }>(`SELECT COUNT(*)::int AS n FROM "PageView" WHERE "isLoggedIn" = true`);
    expect(count[0].n).toBe(0);
  });

  test("صفحه آمار بازدید ادمین نمایش داده می شود", async ({ page, context, baseURL }) => {
    await cleanup();
    // داده اولیه با API عمومی
    const api = await pwRequest.newContext({ baseURL });
    await api.post("/api/analytics/pageview", {
      data: { path: "/login", entry: true, referrer: "https://www.google.com/", utmSource: null, utmMedium: null },
      headers: { "user-agent": DESKTOP_UA },
    });
    await api.post("/api/analytics/pageview", {
      data: { path: "/dashboard/subscription", entry: false, referrer: null, utmSource: null, utmMedium: null },
      headers: { "user-agent": DESKTOP_UA },
    });
    await api.dispose();

    const rows = await query<{ id: string }>(`SELECT id FROM "User" WHERE role = 'SUPER_ADMIN' LIMIT 1`);
    await loginAs(context, rows[0].id, baseURL, "SUPER_ADMIN");
    await page.goto("/admin/visits", { waitUntil: "networkidle" });
    await expect(page.locator("h1")).toContainText("آمار بازدید");
    await expect(page.getByText("صفحه ورود").first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText("صفحه خرید اشتراک").first()).toBeVisible();
    await expect(page.getByText("گوگل").first()).toBeVisible();
  });
});
