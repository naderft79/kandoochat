// گرفتن اسکرین شات واقعی UI برای فروشگاه گوگل پلی — خروجی در store/screenshots/
// پیش نیاز: npm run dev:kandoo در حال اجرا + npm run e2e:seed (کاربر تستی)
// استفاده: npx tsx scripts/generate-store-shots.ts
import "dotenv/config";
import path from "path";
import fs from "fs";
import { chromium } from "@playwright/test";
import { sessionToken } from "../tests/e2e/helpers/auth";
import { e2eData } from "../tests/e2e/helpers/data";

const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
const OUT = path.join(process.cwd(), "store", "screenshots");

// ابعاد استاندارد اسکرین شات پلی — موبایل واقعی با رزولوشن بالا
// ۴۱۲×۹۱۵ CSS px با DSF ۲.۵ → خروجی ~۱۰۳۰×۲۲۸۸ پیکسل
const VIEW = { width: 412, height: 915 };

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: VIEW,
    deviceScaleFactor: 2.5,
    isMobile: true,
    hasTouch: true,
    locale: "fa-IR",
  });
  const page = await context.newPage();

  async function shot(name: string, url: string, wait = 2500) {
    await page.goto(`${BASE}${url}`, { waitUntil: "networkidle", timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(wait);
    await page.screenshot({ path: path.join(OUT, `${name}.png`) });
    console.log(`[shots] ${name}.png  <-  ${url}`);
  }

  // صفحات عمومی
  await shot("01-landing", "/landing");
  await shot("02-login", "/login", 1500);

  // ورود با کاربر تستی E2E (JWT مستقیم — بدون UI)
  const data = e2eData();
  const token = await sessionToken(data.me);
  const host = new URL(BASE).hostname;
  await context.addCookies([
    { name: "kandoo_session", value: token, domain: host, path: "/", httpOnly: true, sameSite: "Lax" },
  ]);

  await shot("03-home", "/dashboard", 3500);
  await shot("04-chats", "/dashboard/chat", 2500);
  await shot("05-conversation", `/dashboard/chat/${data.conversationId}`, 3000);
  await shot("06-search", "/dashboard/search", 2500);
  await shot("07-profile", "/dashboard/profile", 3000);
  await shot("08-likes", "/dashboard/likes", 2500);

  await browser.close();
  console.log("[shots] done → store/screenshots/");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
