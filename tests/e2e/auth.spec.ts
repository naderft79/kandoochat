// تست ثبت نام (OTP، قوانین، اعتبارسنجی inline)، ورود و بازیابی رمز
import { test, expect } from "@playwright/test";
import bcrypt from "bcryptjs";
import { query } from "./helpers/db";

const phoneFor = (_n: number) => `0919${Math.floor(1000000 + Math.random() * 8999999)}`;

test.describe.configure({ mode: "serial" });

test.beforeEach(async ({}, info) => {
  test.skip(info.project.name !== "iphone-14" && info.project.name !== "laptop-1366", "یک موبایل و یک دسکتاپ");
});

async function otpApi(request: import("@playwright/test").APIRequestContext, phone: string, purpose: string) {
  const r = await request.post("/api/auth/otp/send", { data: { phone, purpose } });
  return { status: r.status(), body: await r.json() };
}

test("API: بدون proof ثبت نام رد می شود و OTP اشتباه خطا می دهد", async ({ request }) => {
  const phone = phoneFor(1);
  const base = {
    phone, password: "1357913", gender: "MALE", username: `e2e_reg_${Date.now() % 100000}`, firstName: "تست", lastName: "ثبت",
    province: "تهران", city: "تهران", age: 30, height: 175, weight: 70, income: 1000000,
  };
  // بدون تیک قوانین
  let r = await request.post("/api/auth/register", { data: base });
  expect(r.status()).toBe(400);
  // با تیک ولی بدون proof
  r = await request.post("/api/auth/register", { data: { ...base, termsAccepted: true } });
  expect(r.status()).toBe(400);
  expect((await r.json()).error).toContain("تایید کنید");
  // کد اشتباه
  const s = await otpApi(request, phone, "REGISTER");
  expect(s.status).toBe(200);
  expect(s.body.devCode).toMatch(/^\d{6}$/);
  const bad = await request.post("/api/auth/otp/verify", { data: { phone, purpose: "REGISTER", code: s.body.devCode === "000000" ? "111111" : "000000" } });
  expect(bad.status()).toBe(400);
  // ارسال مجدد زودهنگام ۴۲۹
  const again = await otpApi(request, phone, "REGISTER");
  expect(again.status).toBe(429);
});

test("UI: ثبت نام کامل با OTP، خطای inline و ورود", async ({ page }) => {
  const phone = phoneFor(2);
  const username = `e2e_ui_${Date.now() % 100000}`;
  await page.goto("/register");

  // خطای inline در مرحله اول
  await page.getByRole("button", { name: "بعدی" }).click();
  await expect(page.getByText("شماره موبایل معتبر نیست")).toBeVisible();
  await expect(page.getByText("پذیرش قوانین و تایید ۱۸ سال تمام الزامی است")).toBeVisible();

  // ارقام فارسی نرمال می شوند
  await page.getByLabel("شماره موبایل").fill("۰۹۱۹" + phone.slice(4));
  await expect(page.getByLabel("شماره موبایل")).toHaveValue(phone);
  await page.getByLabel("رمز عبور").fill("1357913");
  await page.getByRole("radio", { name: "مرد" }).click();
  await page.getByRole("checkbox").check();

  // پاسخ ارسال کد را برای دریافت devCode شنود می کنیم
  const sent = page.waitForResponse((r) => r.url().includes("/api/auth/otp/send"));
  await page.getByRole("button", { name: "بعدی" }).click();
  const code = (await (await sent).json()).devCode as string;
  expect(code).toMatch(/^\d{6}$/);

  // کد اشتباه
  await page.getByLabel("کد تایید").fill(code === "123456" ? "654321" : "123456");
  await page.getByRole("button", { name: "تایید کد" }).click();
  await expect(page.getByText("کد تایید اشتباه است")).toBeVisible();

  await page.getByLabel("کد تایید").fill(code);
  await page.getByRole("button", { name: "تایید کد" }).click();

  // مرحله مشخصات + چک یوزرنیم
  await page.getByLabel("یوزرنیم (انگلیسی)").fill(username);
  await expect(page.getByText("این یوزرنیم آزاد است")).toBeVisible();
  await page.getByLabel("نام", { exact: true }).fill("تست");
  await page.getByLabel("نام خانوادگی").fill("ثبت نام");
  // SelectMenu سفارشی است — دکمه را باز می کنیم و گزینه را می زنیم
  const pick = async (label: string, option: string | RegExp) => {
    await page.getByLabel(label).click();
    await page.getByRole("option", { name: option }).first().click();
  };
  await pick("استان", "تهران");
  await pick("شهر", "تهران");
  await pick("سال تولد", /سال\)$/);
  await pick("قد", /سانتی متر/);
  await pick("وزن", /کیلوگرم/);
  await pick("درآمد ماهانه", /تومان/);
  await page.getByRole("button", { name: "تکمیل ثبت نام" }).click();
  await expect(page).toHaveURL(/\/dashboard/);

  // بررسی و پاک سازی کاربر
  const rows = await query<{ phoneVerified: boolean; termsAcceptedAt: Date | null }>(
    'select "phoneVerified", "termsAcceptedAt" from "User" where phone = $1',
    [phone]
  );
  expect(rows[0]?.phoneVerified).toBe(true);
  expect(rows[0]?.termsAcceptedAt).not.toBeNull();
  await query('delete from "User" where phone = $1', [phone]);
});

test("ورود: نمایش رمز، لینک فراموشی و خطای نادرست", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("link", { name: "رمز عبور را فراموش کرده ام" })).toBeVisible();
  await page.getByLabel("شماره موبایل").fill("۰۹۱۱۱۱۱۱۱۱۱");
  await page.getByLabel("رمز عبور", { exact: true }).fill("99999");
  await page.getByRole("button", { name: "نمایش رمز" }).click();
  await expect(page.getByLabel("رمز عبور", { exact: true })).toHaveAttribute("type", "text");
  await page.getByRole("button", { name: "ورود" }).click();
  await expect(page.getByRole("alert")).toBeVisible();
});

test("بازیابی رمز: کد → رمز جدید → ورود با رمز جدید", async ({ page, request }) => {
  const phone = phoneFor(3);
  const created = await query<{ id: string }>(
    `insert into "User" (id, phone, username, password, gender, "firstName", "lastName", province, city, age, height, weight, income, "phoneVerified", "isActive", role, "updatedAt")
     values (('e2e' || replace(gen_random_uuid()::text, '-', ''))::varchar(25), $1, $2, $3, 'FEMALE', 'بازیابی', 'تست', 'تهران', 'تهران', 28, 165, 55, 0, true, true, 'USER', now())
     returning id`,
    [phone, `e2e_rst_${Date.now() % 100000}`, await bcrypt.hash("135791", 10)]
  );
  const userId = created[0].id;
  try {
    await page.goto("/forgot-password");
    await page.getByLabel("شماره موبایل").fill(phone);
    const sent = page.waitForResponse((r) => r.url().includes("/api/auth/otp/send"));
    await page.getByRole("button", { name: "ارسال کد" }).click();
    const code = (await (await sent).json()).devCode as string;
    await page.getByLabel("کد تایید").fill(code);
    await page.getByRole("button", { name: "تایید کد" }).click();
    await page.getByLabel("رمز عبور جدید", { exact: true }).fill("246810");
    await page.getByRole("button", { name: "ذخیره رمز جدید" }).click();
    await expect(page.getByText("رمز عبور تغییر کرد")).toBeVisible();

    const login = await request.post("/api/auth/login", { data: { phone, password: "246810" } });
    expect(login.status()).toBe(200);
    const oldLogin = await request.post("/api/auth/login", { data: { phone, password: "135791" } });
    expect(oldLogin.status()).toBe(401);

    // شماره ناشناس: پاسخ یکسان و بدون افشای وجود حساب
    const unknown = await otpApi(request, "09190000000", "RESET");
    expect(unknown.status).toBe(200);
    expect(unknown.body.devCode).toBeUndefined();
  } finally {
    await query('delete from "User" where id = $1', [userId]).catch(() => {});
  }
});
