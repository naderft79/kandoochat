// تست دودی همه صفحات پنل کاربر: بدون خطا، بدون اسکرول افقی، اسکرین شات و گزارش axe
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import * as fs from "fs";
import * as path from "path";
import { loginAs } from "./helpers/auth";
import { e2eData } from "./helpers/data";

const PUBLIC_PAGES = ["/login", "/register"];
const AUTH_PAGES = [
  "/dashboard",
  "/dashboard/search",
  "/dashboard/chat",
  "/dashboard/coins",
  "/dashboard/profile",
  "/dashboard/subscription",
  "/dashboard/settings",
  "/dashboard/activity",
  "/dashboard/likes",
  "/dashboard/support",
  "/dashboard/referral",
  "/dashboard/blocked",
  "/dashboard/notifications",
];
const STRICT = !!process.env.A11Y_STRICT;

function slug(p: string) {
  return p.replace(/\//g, "_").replace(/^_/, "") || "root";
}

async function check(page: import("@playwright/test").Page, url: string, project: string) {
  const res = await page.goto(url, { waitUntil: "networkidle" });
  expect(res?.status(), url).toBeLessThan(400);

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, `${url} horizontal overflow`).toBeLessThanOrEqual(1);

  const dir = path.join("tests", "screens", process.env.E2E_TAG ?? "current", project);
  fs.mkdirSync(dir, { recursive: true });
  await page.screenshot({ path: path.join(dir, `${slug(url)}.png`), fullPage: false });

  const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  const serious = axe.violations.filter((v) => v.impact === "critical" || v.impact === "serious");
  fs.writeFileSync(
    path.join(dir, `${slug(url)}.axe.json`),
    JSON.stringify(serious.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length })), null, 2)
  );
  if (STRICT) expect(serious.map((v) => v.id), `${url} axe`).toEqual([]);
}

test.describe("صفحات عمومی", () => {
  for (const url of PUBLIC_PAGES) {
    test(`public ${url}`, async ({ page }, info) => {
      await check(page, url, info.project.name);
    });
  }
});

test.describe("صفحات کاربر", () => {
  for (const url of AUTH_PAGES) {
    test(`auth ${url}`, async ({ page, context, baseURL }, info) => {
      await loginAs(context, e2eData().me, baseURL);
      await check(page, url, info.project.name);
    });
  }

  test("auth chat room", async ({ page, context, baseURL }, info) => {
    const d = e2eData();
    await loginAs(context, d.me, baseURL);
    await check(page, `/dashboard/chat/${d.conversationId}`, info.project.name);
  });
});
