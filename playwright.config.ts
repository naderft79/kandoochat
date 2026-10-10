// پیکربندی تست UI: ۶ پروفایل دستگاه روی Chromium و WebKit
import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 3000);
const BASE_URL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;
// دستگاه های اپل به صورت پیش فرض با Chromium شبیه سازی می شوند؛ با E2E_WEBKIT=1 از WebKit واقعی استفاده می شود
const apple = process.env.E2E_WEBKIT ? ("webkit" as const) : ("chromium" as const);

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 45_000,
  expect: { timeout: 8_000, toHaveScreenshot: { maxDiffPixelRatio: 0.02 } },
  fullyParallel: true,
  workers: process.env.CI ? 2 : 3,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never", outputFolder: "tests/report" }]],
  outputDir: "tests/results",
  // اجرای خودکار سرور در صورت نبود سرور در حال اجرا
  webServer: {
    command: "npm run dev:kandoo -- --port " + PORT,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  use: {
    baseURL: BASE_URL,
    locale: "fa-IR",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "iphone-se", use: { ...devices["iPhone SE"], defaultBrowserType: apple } },
    { name: "iphone-14", use: { ...devices["iPhone 14"], defaultBrowserType: apple } },
    { name: "pixel-7", use: { ...devices["Pixel 7"] } },
    { name: "ipad", use: { ...devices["iPad (gen 7)"], defaultBrowserType: apple } },
    { name: "laptop-1366", use: { ...devices["Desktop Chrome"], viewport: { width: 1366, height: 768 } } },
    { name: "desktop-1920", use: { ...devices["Desktop Chrome"], viewport: { width: 1920, height: 1080 } } },
  ],
});
