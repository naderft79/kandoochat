// تست اتاق گفتگو: ارسال optimistic، ورودی چندخطی، صفحه بندی تاریخچه، تلاش مجدد، دکمه پیام جدید و حذف گفتگو
import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers/auth";
import data from "../.e2e-data.json";

const BASE = "http://localhost:3000";

test.describe.configure({ mode: "serial" });

test.beforeEach(async ({}, info) => {
  test.skip(info.project.name !== "iphone-14" && info.project.name !== "laptop-1366", "یک موبایل و یک دسکتاپ");
});

async function openChat(context: Parameters<typeof loginAs>[0], page: import("@playwright/test").Page) {
  await loginAs(context, data.me, BASE);
  await page.goto(`/dashboard/chat/${data.conversationId}`);
  await expect(page.getByPlaceholder("پیام بنویس...")).toBeVisible();
  // صبر برای هیدرات: اسکرول اولیه لیست پیام ها فقط بعد از اجرای افکت رخ می دهد
  const list = page.getByTestId("message-list");
  await expect(async () => {
    expect(await list.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
  }).toPass({ timeout: 10000 });
}

test("ارسال پیام متنی فورا نمایش داده و تایید می شود", async ({ page, context }) => {
  await openChat(context, page);
  const box = page.getByPlaceholder("پیام بنویس...");
  const unique = `پیام تست ارسال ${Date.now()}`;
  await box.fill(unique);
  await page.keyboard.press("Enter");
  // optimistic: پیام بلافاصله دیده می شود
  await expect(page.getByText(unique)).toBeVisible();
  // بعد از تایید سرور اسپینر ارسال می رود
  await expect(page.getByLabel("در حال ارسال")).toHaveCount(0, { timeout: 10000 });
});

test("ورودی چندخطی: Shift+Enter خط جدید و Enter ارسال", async ({ page, context }) => {
  await openChat(context, page);
  const box = page.getByPlaceholder("پیام بنویس...");
  const tag = `چندخطی${Date.now().toString().slice(-6)}`;
  await box.fill(`خط اول ${tag}`);
  await box.press("Shift+Enter");
  await box.type("خط دوم");
  // خط دوم هنوز ارسال نشده — در textarea است
  await expect(box).toHaveValue(new RegExp(`خط اول ${tag}\\nخط دوم`));
  await box.press("Enter");
  await expect(page.getByText(new RegExp(`${tag}`))).toBeVisible();
});

test("صفحه بندی تاریخچه: اسکرول به بالا پیام های قدیمی را می آورد", async ({ page, context }) => {
  await openChat(context, page);
  // قدیمی ترین پیام seed شده اول دیده نمی شود (فقط ۵۰ پیام آخر لود می شوند)
  await expect(page.getByText("پیام قدیمی 01", { exact: true })).toHaveCount(0);
  const list = page.getByTestId("message-list");
  for (let i = 0; i < 6; i++) {
    await list.evaluate((el) => { el.scrollTop = 0; });
    await page.waitForTimeout(600);
    if (await page.getByText("پیام قدیمی 01", { exact: true }).count()) break;
  }
  await expect(page.getByText("پیام قدیمی 01", { exact: true })).toBeVisible();
});

test("ارسال ناموفق: پیام failed و تلاش مجدد موفق می شود", async ({ page, context }) => {
  await openChat(context, page);
  // اولین POST پیام را قطع می کنیم
  await page.route("**/api/messages", (route) => route.abort(), { times: 1 });
  const unique = `پیام ناموفق ${Date.now()}`;
  const box = page.getByPlaceholder("پیام بنویس...");
  await box.fill(unique);
  await box.press("Enter");
  await expect(page.getByRole("button", { name: "تلاش مجدد" })).toBeVisible({ timeout: 10000 });
  // تلاش مجدد بدون interception موفق می شود
  await page.getByRole("button", { name: "تلاش مجدد" }).click();
  await expect(page.getByRole("button", { name: "تلاش مجدد" })).toHaveCount(0, { timeout: 10000 });
  await expect(page.getByText(unique)).toBeVisible();
});

test("پیام جدید طرف مقابل هنگام خواندن تاریخچه دکمه پرش نشان می دهد", async ({ page, context, browser }) => {
  await openChat(context, page);
  // صبر برای رندر پیام ها و تکمیل اسکرول اولیه به پایین (هیدرات و افکت اولیه ممکن است دیر برسد)
  // به محتوای خاص seed وابسته نیستیم چون فقط ۵۰ پیام آخر لود می شود
  await expect(page.getByTestId("message-list").locator("p").first()).toBeVisible();
  const list = page.getByTestId("message-list");
  await expect(async () => {
    expect(await list.evaluate((el) => el.scrollTop)).toBeGreaterThan(100);
  }).toPass({ timeout: 10000 });
  // رفتن به بالای لیست تا از پایین فاصله بگیریم
  await list.evaluate((el) => {
    el.scrollTop = 0;
    el.dispatchEvent(new Event("scroll"));
  });
  await page.waitForTimeout(400);
  // کاربر دوم پیام می فرستد
  const ctx2 = await browser.newContext({ baseURL: BASE });
  await loginAs(ctx2, data.liked, BASE);
  const tag = `پیام-طرف-${Date.now().toString().slice(-6)}`;
  const postRes = await ctx2.request.post("/api/messages", {
    data: { conversationId: data.conversationId, content: tag, type: "TEXT" },
  });
  expect(postRes.ok()).toBeTruthy();
  await expect(page.getByRole("button", { name: "پیام جدید ↓" })).toBeVisible({ timeout: 15000 });
  await page.getByRole("button", { name: "پیام جدید ↓" }).click();
  await expect(page.getByText(tag)).toBeVisible();
  await ctx2.close();
});

test("حذف گفتگو: مودال تایید و سپس حذف یکطرفه", async ({ page, context }) => {
  // گفتگوی اختصاصی این تست ساخته می شود تا گفتگوی seed برای تست های دیگر دست نخورده بماند
  const { query } = await import("./helpers/db");
  const [a, b] = [data.me, data.plain].sort();
  const [{ id: convId }] = await query<{ id: string }>(
    `INSERT INTO "Conversation" (id, "userAId", "userBId", "startedBy", "createdAt", "updatedAt")
     VALUES (gen_random_uuid()::text, $1, $2, $3, now(), now())
     ON CONFLICT ("userAId", "userBId") DO UPDATE SET "deletedByA" = false, "deletedByB" = false
     RETURNING id`,
    [a, b, data.me]
  );
  await loginAs(context, data.me, BASE);
  await page.goto(`/dashboard/chat/${convId}`);
  await expect(page.getByPlaceholder("پیام بنویس...")).toBeVisible();
  // منوی سه نقطه
  await page.getByRole("button", { name: "گزینه های گفتگو" }).click();
  await page.getByRole("button", { name: /حذف گفتگو/ }).click();
  // مودال تایید
  await page.getByRole("button", { name: "حذف کن" }).click();
  await expect(page.getByText("این گفتگو حذف شد")).toBeVisible({ timeout: 10000 });
  await page.getByRole("button", { name: "بازگشت به لیست چت" }).click();
  await expect(page).toHaveURL(/\/dashboard\/chat$/);
});
