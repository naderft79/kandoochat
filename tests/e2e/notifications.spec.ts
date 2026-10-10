// تست فاز ۷: مرکز اعلان، بج زنده SSE و لینک اعلان — موبایل و دسکتاپ
import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers/auth";
import { query } from "./helpers/db";
import data from "../.e2e-data.json";

const BASE = "http://localhost:3000";

// کاربر متفاوت برای هر تست تا اجرای موازی پروژه ها روی دیتابیس مشترک مسابقه ندهد
const TARGET_BADGE = data.blocked;
const TARGET_CENTER = data.noSub;
const TARGET_CONSENT = data.plain;

test.beforeEach(async ({}, info) => {
  test.skip(info.project.name !== "iphone-14" && info.project.name !== "laptop-1366", "یک موبایل و یک دسکتاپ");
});

async function createNotification(userId: string, tag: string) {
  const [{ id }] = await query<{ id: string }>(
    `INSERT INTO "Notification" (id, "userId", type, title, body, "isRead", "createdAt")
     VALUES (gen_random_uuid()::text, $1, 'ADMIN_BROADCAST', $2, $3, false, now())
     RETURNING id`,
    [userId, `اعلان تست ${tag}`, `متن اعلان تست ${tag}`]
  );
  return id;
}

test("بج اعلان بدون ریلود با SSE به روز می شود", async ({ page, context }) => {
  await loginAs(context, TARGET_BADGE, BASE);
  await page.goto("/dashboard");
  const bell = page.getByRole("link", { name: /اعلان ها/ });
  await expect(bell).toBeVisible();

  // درج نوتیفیکیشن مستقیم در دیتابیس — باید از طریق SSE به بج برسد
  const tag = Date.now().toString().slice(-6);
  await createNotification(TARGET_BADGE, tag);

  // بج ظاهر می شود (بدون ریلود)
  await expect(page.getByRole("link", { name: /اعلان ها: .* خوانده نشده/ })).toBeVisible({ timeout: 15000 });
});

test("مرکز اعلان: لیست، علامت خواندن و ناوبری", async ({ page, context }) => {
  await loginAs(context, TARGET_CENTER, BASE);

  const tag = Date.now().toString().slice(-6);
  const notifId = await createNotification(TARGET_CENTER, tag);

  await page.goto("/dashboard/notifications");
  const item = page.getByRole("button", { name: new RegExp(`اعلان تست ${tag}`) });
  await expect(item).toBeVisible();

  // نقطه خوانده نشده روی آیتم ما وجود دارد
  await expect(item.getByLabel("خوانده نشده")).toBeVisible();

  // خواندن همه — آیتم ما دیگر نقطه ندارد (پروژه دیگر ممکن است اعلان جدید بسازد، پس سراسری چک نمی کنیم)
  await page.getByRole("button", { name: "خواندن همه" }).click();
  await expect(item.getByLabel("خوانده نشده")).toHaveCount(0);

  // در دیتابیس هم خوانده شده است
  const rows = await query<{ isRead: boolean }>(`SELECT "isRead" FROM "Notification" WHERE id = $1`, [notifId]);
  expect(rows[0]?.isRead).toBe(true);
});

test("شیت مجوز اعلان بعد از اولین اعلان نمایش داده و با فعلا نه بسته می شود", async ({ page, context }) => {
  await loginAs(context, TARGET_CONSENT, BASE);
  // فلگ قبلی را فقط در اولین لود پاک کن تا در ریلود دوباره نمایش داده نشود
  // در محیط تست مجوز denied است پس default شبیه سازی می کنیم
  await context.addInitScript(() => {
    if (!sessionStorage.getItem("__push_flag_reset")) {
      sessionStorage.setItem("__push_flag_reset", "1");
      localStorage.removeItem("kandoo-push-asked");
    }
    Object.defineProperty(Notification, "permission", { get: () => "default", configurable: true });
  });

  const tag = Date.now().toString().slice(-6);
  await createNotification(TARGET_CONSENT, tag);

  await page.goto("/dashboard");
  // شیت بعد از رسیدن اعلان باز می شود
  await expect(page.getByText("اعلان ها را روشن کنید")).toBeVisible({ timeout: 15000 });
  await page.getByRole("button", { name: "فعلا نه" }).click();
  await expect(page.getByText("اعلان ها را روشن کنید")).toHaveCount(0);
  // فلگ ثبت شده و دوباره باز نمی شود
  await page.reload();
  await page.waitForTimeout(2500);
  await expect(page.getByText("اعلان ها را روشن کنید")).toHaveCount(0);
});

test("بج پیام نخوانده با پیام جدید به روز می شود", async ({ page, context, browser }) => {
  await loginAs(context, data.me, BASE);
  // صفر کردن وضعیت اولیه: همه پیام های نخوانده کاربر را می خوانیم
  await query(
    `UPDATE "Message" SET "isRead" = true WHERE "isRead" = false AND "senderId" <> $1
     AND "conversationId" IN (SELECT id FROM "Conversation" WHERE "userAId" = $1 OR "userBId" = $1)`,
    [data.me]
  );
  await page.goto("/dashboard/search");
  // بج قرمز روی تب پیام ها (در دسکتاپ سایدبار، در موبایل نوار پایین)
  // پیش چک صفر نمی گذاریم چون تست های موازی ممکن است به گفتگوهای کاربر پیام بفرستند
  const badge = page.locator("a[href='/dashboard/chat'] span.bg-ig-red:visible");

  // کاربر دوم پیام می فرستد — بج پیام ها باید به روز شود
  const ctx2 = await browser.newContext({ baseURL: BASE });
  await loginAs(ctx2, data.liked, BASE);
  const res = await ctx2.request.post("/api/messages", {
    data: { conversationId: data.conversationId, content: `پیام-بج-${Date.now()}`, type: "TEXT" },
  });
  expect(res.ok()).toBeTruthy();
  await ctx2.close();

  // بج روی تب پیام ها ظاهر می شود (بدون ریلود)
  await expect(badge).toBeVisible({ timeout: 15000 });
});
