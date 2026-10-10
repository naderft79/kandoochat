// تست فاز ۶: پروفایل من، پروفایل عمومی، کیف پول و اشتراک — موبایل و دسکتاپ
import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers/auth";
import data from "../.e2e-data.json";

const BASE = "http://localhost:3000";

test.beforeEach(async ({}, info) => {
  test.skip(info.project.name !== "iphone-14" && info.project.name !== "laptop-1366", "یک موبایل و یک دسکتاپ");
});

test("پروفایل من: آمار سه تایی، دکمه های خاکستری و ویرایش در شیت", async ({ page, context }) => {
  await loginAs(context, data.me, BASE);
  await page.goto("/dashboard/profile");

  // سه آمار در یک ردیف
  await expect(page.getByText("بازدید")).toBeVisible();
  await expect(page.getByText("گفتگو").first()).toBeVisible();
  await expect(page.getByText("لایک").first()).toBeVisible();

  // دو دکمه خاکستری
  await page.getByRole("button", { name: "ویرایش پروفایل" }).click();
  // شیت ویرایش با فرم باز می شود
  await expect(page.getByRole("button", { name: "ذخیره تغییرات" })).toBeVisible();
  // نمایش به چشم دیگران
  await expect(page.getByRole("button", { name: /نمایش پروفایل به چشم دیگران/ })).toBeVisible();
  // بستن با انصراف
  await page.getByRole("button", { name: "انصراف" }).click();
  await expect(page.getByRole("button", { name: "ذخیره تغییرات" })).toHaveCount(0);

  // چیپ های وضعیت قدیمی حذف شده اند
  await expect(page.getByText("موبایل تایید شده")).toHaveCount(0);
});

test("پروفایل عمومی: گفتگو آبی، لایک خاکستری و منوی سه نقطه", async ({ page, context }) => {
  await loginAs(context, data.me, BASE);
  await page.goto("/profile/e2e_user_2");

  await expect(page.getByRole("button", { name: "گفتگو" })).toBeVisible();
  await expect(page.getByRole("button", { name: /لایک/ })).toBeVisible();

  // منوی سه نقطه — گزارش، بلاک، کپی لینک
  await page.getByRole("button", { name: "گزینه های بیشتر" }).click();
  await expect(page.getByText("گزارش", { exact: true })).toBeVisible();
  await expect(page.getByText("بلاک کردن")).toBeVisible();
  await page.getByText("کپی لینک پروفایل").click();
  await expect(page.getByText("گزارش", { exact: true })).toHaveCount(0);
});

test("گزارش پروفایل: انتخاب دلیل و ارسال موفق", async ({ page, context }) => {
  await loginAs(context, data.me, BASE);
  await page.goto("/profile/e2e_user_2");

  await page.getByRole("button", { name: "گزینه های بیشتر" }).click();
  await page.getByText("گزارش", { exact: true }).click();

  // بدون دلیل دکمه ارسال غیرفعال است
  await expect(page.getByRole("button", { name: "ارسال گزارش" })).toBeDisabled();

  await page.getByRole("radio", { name: "پروفایل جعلی" }).click();
  await page.getByRole("button", { name: "ارسال گزارش" }).click();

  await expect(page.getByText("گزارش شما ثبت شد")).toBeVisible();
});

test("دعوت دوستان: کد دعوت مستقل از شناسه کاربر", async ({ page, context }) => {
  await loginAs(context, data.me, BASE);
  await page.goto("/dashboard/referral");

  // کد دعوت باید فرمت KD... باشد، نه شناسه دیتابیس
  const linkInput = page.locator('input[readonly]').first();
  await expect(linkInput).toHaveValue(/\/register\?ref=KD[A-Z0-9]+/);
  const link = await linkInput.inputValue();
  expect(link).not.toContain(data.me);
});

test("کیف پول: تب های زیرخط دار و فیلتر تاریخچه", async ({ page, context }) => {
  await loginAs(context, data.me, BASE);
  await page.goto("/dashboard/coins");

  // موجودی با عدد بزرگ
  await expect(page.getByText("موجودی سکه")).toBeVisible();

  // تب تاریخچه
  await page.getByRole("button", { name: "تاریخچه" }).click();
  // چیپ های فیلتر یا پیام خالی
  const filterAll = page.getByRole("button", { name: "همه", exact: true });
  if (await filterAll.count()) {
    await expect(filterAll).toBeVisible();
    await expect(page.getByRole("button", { name: "ورودی" })).toBeVisible();
    await expect(page.getByRole("button", { name: "خرجی" })).toBeVisible();
  } else {
    await expect(page.getByText("هنوز تراکنشی ثبت نشده است")).toBeVisible();
  }
});

test("اشتراک: کارت های پلن و مودال تایید خرید", async ({ page, context }) => {
  await loginAs(context, data.me, BASE);
  await page.goto("/dashboard/subscription");

  // حداقل دو کارت پلن
  await expect(page.getByRole("button", { name: /پایه/ }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /پرمیوم/ }).first()).toBeVisible();
  // نشان پیشنهادی
  await expect(page.getByText("پیشنهادی")).toBeVisible();

  // کلیک روی کارت پایه و تلاش برای خرید با سکه — مودال تایید یا خطای موجودی
  await page.getByRole("button", { name: /پایه/ }).click();
  const buyBtn = page.getByRole("button", { name: /با سکه/ });
  if (await buyBtn.isEnabled()) {
    await buyBtn.click();
    await expect(page.getByText(/کسر می شود/)).toBeVisible();
    await page.getByRole("button", { name: "انصراف" }).last().click();
  }
});
