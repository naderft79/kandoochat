// تست فید خانه: صفحه بندی سروری، ترتیب پایدار، حذف بلاک شده/نشان نده، لایک، لایک متقابل، گفتگو
import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers/auth";
import { e2eData } from "./helpers/data";
import { query } from "./helpers/db";

// بازگرداندن وضعیت فید کاربر به حالت seed — پاک کردن hide/block انباشته از اجراهای قبلی
async function resetFeedState() {
  const d = e2eData();
  await query(`DELETE FROM "FeedHide" WHERE "userId" = $1`, [d.me]);
  await query(
    `DELETE FROM "Block" WHERE "blockerId" = $1 AND "blockedId" <> $2`,
    [d.me, d.blocked]
  );
}

async function collect(
  request: import("@playwright/test").APIRequestContext,
  seed: string
) {
  const ids: string[] = [];
  let offset = 0;
  for (let i = 0; i < 60; i++) {
    const res = await request.get(
      `/api/feed/home?seed=${seed}&offset=${offset}&limit=20`
    );
    expect(res.ok()).toBeTruthy();
    const d = await res.json();
    ids.push(...d.items.map((x: { id: string }) => x.id));
    if (!d.hasMore) break;
    offset = d.nextOffset;
  }
  return ids;
}

test.describe("API فید", () => {
  // وضعیت مشترک (نشان نده) — فقط یک پروفایل و به صورت ترتیبی اجرا می شود
  test.describe.configure({ mode: "serial" });
  test.beforeEach(async ({ context, baseURL }, info) => {
    test.skip(info.project.name !== "laptop-1366", "API فقط یک بار");
    await resetFeedState();
    await loginAs(context, e2eData().me, baseURL);
  });

  test("ترتیب با seed ثابت پایدار است و تکراری ندارد", async ({ context }) => {
    const request = context.request;
    const a = await collect(request, "abc12345");
    const b = await collect(request, "abc12345");
    expect(a).toEqual(b);
    expect(new Set(a).size).toBe(a.length);
    const c = await collect(request, "zzzz9999");
    // seed متفاوت ترتیب متفاوت می دهد؛ طول ممکن است با ثبت نام های موازی تست دیگر تغییر کند
    expect(new Set(c).size).toBe(c.length);
    expect(c).not.toEqual(a);
  });

  test("بلاک شده ها و هم جنس ها در فید نیستند", async ({ context }) => {
    const request = context.request;
    const d = e2eData();
    const ids = await collect(request, "abc12345");
    expect(ids).not.toContain(d.blocked);
    expect(ids).not.toContain(d.me);
    expect(ids).not.toContain(d.noSub); // مرد است
    expect(ids).toContain(d.plain);
  });

  test("«نشان نده» پروفایل را از فید حذف می کند", async ({ context }) => {
    const request = context.request;
    const d = e2eData();
    const res = await request.post("/api/feed/hide", {
      data: { hiddenId: d.plain },
    });
    expect(res.ok()).toBeTruthy();
    const ids = await collect(request, "abc12345");
    expect(ids).not.toContain(d.plain);
    await request.delete(`/api/feed/hide?hiddenId=${d.plain}`);
    expect(await collect(request, "abc12345")).toContain(d.plain);
  });

  test("seed نامعتبر ۴۰۰ و بدون ورود ۴۰۱", async ({
    context,
    playwright,
    baseURL,
  }) => {
    const request = context.request;
    expect((await request.get("/api/feed/home")).status()).toBe(400);
    const anon = await playwright.request.newContext({ baseURL });
    expect((await anon.get("/api/feed/home?seed=abc")).status()).toBe(401);
  });
});

test.describe("UI فید", () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await loginAs(context, e2eData().me, baseURL);
  });

  // باز کردن نوار اکشن زیر عکس با تپ روی بدنه کارت
  async function revealActions(card: import("@playwright/test").Locator) {
    await card
      .locator("div.aspect-square")
      .first()
      .click({ position: { x: 12, y: 12 } });
  }

  test("کارت دکمه های اکشن دسترس پذیر دارد و لایک optimistic است", async ({
    page,
  }) => {
    await page.route("**/api/likes", async (route) => {
      if (route.request().method() === "POST")
        await route.fulfill({ json: { ok: true, isMatch: false } });
      else await route.continue();
    });
    await page.route("**/api/likes?**", (route) =>
      route.fulfill({ json: { ok: true } })
    );
    await page.goto("/dashboard");
    const card = page.locator("article").first();
    await expect(
      card.getByRole("button", { name: "گزینه های بیشتر" })
    ).toBeVisible();
    // دکمه ها تا قبل از تپ روی عکس پنهان اند
    await expect(
      card.getByRole("button", { name: "لایک", exact: true })
    ).toBeHidden();
    await revealActions(card);
    const likeBtn = card.getByRole("button", { name: "لایک", exact: true });
    await expect(likeBtn).toBeVisible();
    await likeBtn.click();
    await expect(
      card.getByRole("button", { name: "برداشتن لایک" })
    ).toHaveAttribute("aria-pressed", "true");
  });

  test("خطای لایک به حالت قبل برمی گردد و پیام می دهد", async ({ page }) => {
    await page.route("**/api/likes", (route) =>
      route.fulfill({ status: 500, json: { error: "خطای سرور" } })
    );
    await page.goto("/dashboard");
    const card = page.locator("article").first();
    await revealActions(card);
    await card.getByRole("button", { name: "لایک", exact: true }).click();
    await expect(page.getByText("خطای سرور")).toBeVisible();
    await expect(
      card.getByRole("button", { name: "لایک", exact: true })
    ).toHaveAttribute("aria-pressed", "false");
  });

  test("لایک متقابل مودال جشن را نشان می دهد", async ({ page }) => {
    await page.route("**/api/likes", (route) =>
      route.request().method() === "POST"
        ? route.fulfill({ json: { ok: true, isMatch: true } })
        : route.continue()
    );
    await page.goto("/dashboard");
    const matchCard = page.locator("article").first();
    await revealActions(matchCard);
    await matchCard.getByRole("button", { name: "لایک", exact: true }).click();
    const dlg = page.getByRole("dialog", { name: "لایک متقابل" });
    await expect(dlg).toBeVisible();
    await expect(dlg.getByText("لایک متقابل!")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dlg).toBeHidden();
  });

  test("دکمه پیام به گفتگوی همان کاربر می رود", async ({ page }) => {
    const d = e2eData();
    let body: { targetUserId?: string } = {};
    await page.route("**/api/conversations", async (route) => {
      body = route.request().postDataJSON();
      await route.fulfill({
        json: { ok: true, conversationId: d.conversationId },
      });
    });
    await page.goto("/dashboard");
    const chatCard = page.locator("article").first();
    await revealActions(chatCard);
    await chatCard.getByRole("button", { name: "گفتگو", exact: true }).click();
    await expect(page).toHaveURL(
      new RegExp(`/dashboard/chat/${d.conversationId}`)
    );
    expect(body.targetUserId).toBeTruthy();
  });

  test("منوی کارت: گزارش، بلاک و نشان نده", async ({ page }) => {
    await page.goto("/dashboard");
    await page
      .locator("article")
      .first()
      .getByRole("button", { name: "گزینه های بیشتر" })
      .click();
    const sheet = page.getByRole("dialog");
    for (const t of ["گزارش", "بلاک کردن", "نشان نده", "کپی لینک پروفایل"])
      await expect(sheet.getByText(t, { exact: true })).toBeVisible();
  });
});
