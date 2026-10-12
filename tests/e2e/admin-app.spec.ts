// جداسازی اپ کاربر و اپ مدیریت: ورود مدیر در اپ کاربر و ورود کاربر عادی در اپ مدیریت
// با همان پاسخ رمز اشتباه رد می شود + رفتار صفحه /admin-login
import { test, expect } from "@playwright/test";
import bcrypt from "bcryptjs";
import { loginAs } from "./helpers/auth";
import { query } from "./helpers/db";

const WRONG_PASS_MSG = "شماره موبایل یا رمز عبور اشتباه است";
const USER_UA = "KandooTest KandooApp/1.0";
const ADMIN_UA = "KandooTest KandooAdminApp/1.0";

test.describe("جداسازی ورود اپ کاربر و اپ مدیریت", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-1920", "تست سطح API — یک اجرا کافی است");
  });

  let ids: string[] = [];
  const suffix = Date.now() % 100000;

  test.beforeAll(async () => {
    const pw = await bcrypt.hash("Admin-pass-9", 10);
    const upw = await bcrypt.hash("User-pass-9", 10);
    const base = `(('e2e' || replace(gen_random_uuid()::text, '-', ''))::varchar(25), $1, $2, $3, 'MALE', 'تست', 'اپ', 'تهران', 'تهران', 30, 180, 75, 0, true, true, $4, now())`;
    const cols = `insert into "User" (id, phone, username, password, gender, "firstName", "lastName", province, city, age, height, weight, income, "phoneVerified", "isActive", role, "updatedAt")`;
    const admin = await query<{ id: string }>(`${cols} values ${base} returning id`, [`0919${String(suffix).padStart(7, "0")}`, `e2e_aadm_${suffix}`, pw, "ADMIN"]);
    const user = await query<{ id: string }>(`${cols} values ${base} returning id`, [`0918${String(suffix).padStart(7, "0")}`, `e2e_ausr_${suffix}`, upw, "USER"]);
    ids = [admin[0].id, user[0].id];
  });

  test.afterAll(async () => {
    for (const id of ids) await query('delete from "User" where id = $1', [id]).catch(() => {});
  });

  function creds(role: "admin" | "user", password: string) {
    const phone = `09${role === "admin" ? "19" : "18"}${String(suffix).padStart(7, "0")}`;
    return { phone, password };
  }

  test("مدیر در اپ کاربر با ارور رمز اشتباه رد می شود و در اپ مدیریت وارد می شود", async ({ request }) => {
    // مدیر + اپ کاربر → همان پاسخ رمز اشتباه
    const blocked = await request.post("/api/auth/login", {
      data: creds("admin", "Admin-pass-9"),
      headers: { "user-agent": USER_UA },
    });
    expect(blocked.status()).toBe(401);
    const blockedBody = await blocked.json();
    expect(blockedBody.error).toBe(WRONG_PASS_MSG);

    // پاسخ باید عیناً با پاسخ رمز غلط یکسان باشد
    const wrong = await request.post("/api/auth/login", {
      data: creds("admin", "wrong-password"),
      headers: { "user-agent": USER_UA },
    });
    expect(blockedBody).toEqual(await wrong.json());

    // مدیر + اپ مدیریت → ورود موفق
    const ok = await request.post("/api/auth/login", {
      data: creds("admin", "Admin-pass-9"),
      headers: { "user-agent": ADMIN_UA },
    });
    expect(ok.status()).toBe(200);

    // مدیر + مرورگر معمولی → ورود موفق (محدودیت فقط روی APK است)
    const browser = await request.post("/api/auth/login", {
      data: creds("admin", "Admin-pass-9"),
    });
    expect(browser.status()).toBe(200);
  });

  test("کاربر عادی در اپ مدیریت با ارور رمز اشتباه رد می شود", async ({ request }) => {
    const blocked = await request.post("/api/auth/login", {
      data: creds("user", "User-pass-9"),
      headers: { "user-agent": ADMIN_UA },
    });
    expect(blocked.status()).toBe(401);
    expect((await blocked.json()).error).toBe(WRONG_PASS_MSG);

    // همان کاربر در اپ کاربر وارد می شود
    const ok = await request.post("/api/auth/login", {
      data: creds("user", "User-pass-9"),
      headers: { "user-agent": USER_UA },
    });
    expect(ok.status()).toBe(200);
  });

  test("صفحه /admin-login فرم تیره دارد و با سشن به مقصد درست می رود", async ({ browser, baseURL }) => {
    // بدون سشن: فرم ورود مدیریت
    const guest = await browser.newContext({ baseURL });
    try {
      const page = await guest.newPage();
      await page.goto("/admin-login");
      await expect(page.getByRole("heading", { name: "مدیریت کندو" })).toBeVisible();
      await expect(page.getByLabel("شماره موبایل")).toBeVisible();
      await expect(page.getByLabel("رمز عبور", { exact: true })).toBeVisible();
      await expect(page.getByRole("link", { name: /ثبت نام|فراموش/ })).toHaveCount(0);
    } finally {
      await guest.close();
    }

    // سشن مدیر → ریدایرکت به پنل
    const admin = await browser.newContext({ baseURL });
    try {
      await loginAs(admin, ids[0], baseURL, "ADMIN");
      const page = await admin.newPage();
      await page.goto("/admin-login");
      await expect(page).toHaveURL(/\/admin/);
    } finally {
      await admin.close();
    }

    // سشن کاربر عادی → ریدایرکت به داشبورد
    const user = await browser.newContext({ baseURL });
    try {
      await loginAs(user, ids[1], baseURL, "USER");
      const page = await user.newPage();
      await page.goto("/admin-login");
      await expect(page).toHaveURL(/\/dashboard/);
    } finally {
      await user.close();
    }
  });
});
