// تست بار: شبیه سازی 200 کاربر همزمان
import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { SignJWT } from "jose";
import * as fs from "fs";
import * as path from "path";

const BASE = "http://localhost:3000";
const JWT_SECRET = process.env.JWT_SECRET!;
const N_USERS = 200;
const DURATION_MS = 60_000;
const PHOTO_FILE = "scripts/face-detector/test-lena.jpg";

type Stat = { n: number; err: number; times: number[]; codes: Record<number, number> };
const stats: Record<string, Stat> = {};
function rec(name: string, ms: number, status: number) {
  const s = (stats[name] ??= { n: 0, err: 0, times: [], codes: {} });
  s.n++;
  s.times.push(ms);
  s.codes[status] = (s.codes[status] ?? 0) + 1;
  if (status >= 400) s.err++;
}

async function call(name: string, url: string, init: RequestInit) {
  const t0 = performance.now();
  try {
    const res = await fetch(url, init);
    await res.arrayBuffer();
    rec(name, performance.now() - t0, res.status);
    return res.status;
  } catch {
    rec(name, performance.now() - t0, 0);
    return 0;
  }
}

function jwtFor(userId: string, role = "USER") {
  return new SignJWT({ userId, role })
    .setProtectedHeader({ alg: "HS512" })
    .setIssuedAt().setIssuer("kandoo").setAudience("kandoo-web")
    .setExpirationTime("2h").sign(new TextEncoder().encode(JWT_SECRET));
}

const rnd = (n: number) => Math.floor(Math.random() * n);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  console.log("== پاک سازی کاربران تست قبلی");
  const oldPhotos = await prisma.profilePhoto.findMany({ where: { user: { phone: { startsWith: "LT" } } }, select: { url: true } });
  for (const p of oldPhotos) safeUnlink(p.url);
  await prisma.user.deleteMany({ where: { phone: { startsWith: "LT" } } });

  console.log("== ساخت 200 کاربر تست");
  const usersData = Array.from({ length: N_USERS }, (_, i) => ({
    phone: `LT${String(i).padStart(9, "0")}`,
    username: `loadtest_${i}`,
    password: "x",
    gender: i % 2 === 0 ? "MALE" : "FEMALE",
    firstName: `تست${i}`,
    lastName: "بار",
    province: "تهران",
    city: "تهران",
    age: 25 + (i % 20),
    height: 170,
    weight: 70,
    income: 0,
  }));
  await prisma.user.createMany({ data: usersData });
  const users = await prisma.user.findMany({ where: { phone: { startsWith: "LT" } }, select: { id: true, phone: true, gender: true } });
  console.log(`   ${users.length} کاربر ساخته شد`);

  const now = new Date();
  await prisma.wallet.createMany({ data: users.map((u) => ({ userId: u.id, balance: 100000 })) });
  await prisma.subscription.createMany({
    data: users.map((u) => ({ userId: u.id, startsAt: now, endsAt: new Date(now.getTime() + 30 * 86400000), coinsPaid: 0 })),
  });

  // جفت کردن مرد/زن برای گفتگو
  const males = users.filter((u) => u.gender === "MALE");
  const females = users.filter((u) => u.gender === "FEMALE");
  const pairCount = Math.min(males.length, females.length);
  const convData = Array.from({ length: pairCount }, (_, i) => {
    const [a, b] = [males[i].id, females[i].id].sort();
    return { userAId: a, userBId: b, startedBy: a };
  });
  await prisma.conversation.createMany({ data: convData });
  const convs = await prisma.conversation.findMany({ where: { userA: { phone: { startsWith: "LT" } } }, select: { id: true, userAId: true, userBId: true } });
  const convByUser = new Map<string, string>();
  for (const c of convs) { convByUser.set(c.userAId, c.id); convByUser.set(c.userBId, c.id); }

  const admin = await prisma.user.findFirst({ where: { role: { in: ["SUPER_ADMIN", "ADMIN"] } } });
  const tokens = new Map(users.map((u) => [u.id, `kandoo_session=${`TK_${u.id}`}`]));
  const jwts = new Map<string, string>();
  for (const u of users) jwts.set(u.id, await jwtFor(u.id));
  const adminJwt = admin ? await jwtFor(admin.id, admin.role) : null;

  const photoBuf = fs.readFileSync(PHOTO_FILE);
  const H = (uid: string) => ({ cookie: `kandoo_session=${jwts.get(uid)}` });
  const PH = () => ({ cookie: `kandoo_session=${adminJwt}` });

  // گرم کردن مسیرها (خارج کردن زمان کامپایل از آمار)
  console.log("== گرم کردن مسیرها");
  const wu = users[0];
  const wuConv = convByUser.get(wu.id)!;
  for (const p of ["/dashboard", "/dashboard/chat", "/dashboard/search", "/dashboard/profile", `/dashboard/chat/${wuConv}`, "/admin", "/admin/users", "/admin/verify"]) {
    await call("warmup", BASE + p, { headers: H(wu.id) });
  }
  await call("warmup", `${BASE}/api/messages?conversationId=${wuConv}&includeReadStatus=true`, { headers: H(wu.id) });
  await call("warmup", `${BASE}/api/notifications`, { headers: H(wu.id) });
  await call("warmup", `${BASE}/api/matches`, { headers: H(wu.id) });
  await call("warmup", `${BASE}/api/feed`, { headers: H(wu.id) });
  await call("warmup", `${BASE}/api/subscription`, { method: "POST", headers: H(wu.id) });
  await call("warmup", `${BASE}/api/tickets`, { method: "POST", headers: { ...H(wu.id), "content-type": "application/json" }, body: JSON.stringify({ subject: "تست", content: "تست" }) });
  const fd = new FormData();
  fd.append("file", new Blob([photoBuf], { type: "image/jpeg" }), "lena.jpg");
  fd.append("type", "gallery");
  await call("warmup", `${BASE}/api/profile/photos`, { method: "POST", headers: H(wu.id), body: fd });
  // پاک کردن آمار گرم کردن
  for (const k of Object.keys(stats)) delete stats[k];

  console.log(`== شروع تست بار: ${N_USERS} کاربر به مدت ${DURATION_MS / 1000} ثانیه`);
  const deadline = Date.now() + DURATION_MS;
  const uploadedCount = new Map<string, number>();
  const pages = ["/dashboard", "/dashboard/chat", "/dashboard/search", "/dashboard/profile", "/dashboard/activity", "/dashboard/likes"];
  const adminPages = ["/admin", "/admin/users", "/admin/verify", "/admin/reports", "/admin/finance"];

  async function worker(u: { id: string }) {
    const convId = convByUser.get(u.id);
    while (Date.now() < deadline) {
      const r = Math.random();
      try {
        if (r < 0.30) {
          // گشت و گذار در صفحات
          const p = pages[rnd(pages.length)];
          await call("page:" + p, BASE + p, { headers: H(u.id) });
        } else if (r < 0.42 && convId) {
          // باز کردن صفحه چت + خواندن پیام
          await call("chat:page", `${BASE}/dashboard/chat/${convId}`, { headers: H(u.id) });
          await call("chat:read", `${BASE}/api/messages?conversationId=${convId}&includeReadStatus=true`, { headers: H(u.id) });
        } else if (r < 0.58 && convId) {
          // ارسال پیام
          await call("chat:send", `${BASE}/api/messages`, {
            method: "POST",
            headers: { ...H(u.id), "content-type": "application/json" },
            body: JSON.stringify({ conversationId: convId, content: `پیام تست ${Date.now()}`, type: "TEXT" }),
          });
        } else if (r < 0.68) {
          await call("api:matches", `${BASE}/api/matches`, { headers: H(u.id) });
        } else if (r < 0.74) {
          await call("api:feed", `${BASE}/api/feed`, { headers: H(u.id) });
        } else if (r < 0.80) {
          await call("api:notifications", `${BASE}/api/notifications`, { headers: H(u.id) });
        } else if (r < 0.85) {
          // خرید اشتراک
          await call("sub:buy", `${BASE}/api/subscription`, { method: "POST", headers: H(u.id) });
        } else if (r < 0.90) {
          // تیکت پشتیبانی
          await call("ticket:new", `${BASE}/api/tickets`, {
            method: "POST",
            headers: { ...H(u.id), "content-type": "application/json" },
            body: JSON.stringify({ subject: `تیکت تست ${rnd(9999)}`, content: "متن تست بار", category: "فنی" }),
          });
        } else if (r < 0.97 && (uploadedCount.get(u.id) ?? 0) < 3) {
          // آپلود عکس گالری + تشخیص چهره
          uploadedCount.set(u.id, (uploadedCount.get(u.id) ?? 0) + 1);
          const fd = new FormData();
          fd.append("file", new Blob([photoBuf], { type: "image/jpeg" }), "lena.jpg");
          fd.append("type", "gallery");
          await call("photo:upload", `${BASE}/api/profile/photos`, { method: "POST", headers: H(u.id), body: fd });
        } else {
          await call("api:notifications", `${BASE}/api/notifications`, { headers: H(u.id) });
        }
      } catch { /* نادیده */ }
      await sleep(50 + rnd(400));
    }
  }

  async function adminWorker() {
    while (Date.now() < deadline && adminJwt) {
      const p = adminPages[rnd(adminPages.length)];
      await call("admin:" + p, BASE + p, { headers: PH() });
      await sleep(200 + rnd(500));
    }
  }

  await Promise.all([...users.map(worker), adminWorker(), adminWorker(), adminWorker()]);

  // گزارش
  console.log("\n===== نتایج =====");
  const rows = Object.entries(stats).sort((a, b) => b[1].n - a[1].n);
  let total = 0, totalErr = 0;
  for (const [name, s] of rows) {
    s.times.sort((a, b) => a - b);
    const p = (q: number) => Math.round(s.times[Math.min(s.times.length - 1, Math.floor(q * s.times.length))]);
    const max = Math.round(s.times[s.times.length - 1]);
    total += s.n; totalErr += s.err;
    console.log(
      `${name.padEnd(24)} n=${String(s.n).padStart(5)} err=${String(s.err).padStart(4)} p50=${p(0.5)}ms p95=${p(0.95)}ms p99=${p(0.99)}ms max=${max}ms codes=${JSON.stringify(s.codes)}`
    );
  }
  console.log(`\nمجموع: ${total} درخواست, ${totalErr} خطا (${((totalErr / total) * 100).toFixed(1)}%)`);

  // پاک سازی
  console.log("\n== پاک سازی داده های تست");
  const photos = await prisma.profilePhoto.findMany({ where: { user: { phone: { startsWith: "LT" } } }, select: { url: true } });
  for (const p of photos) safeUnlink(p.url);
  const { count } = await prisma.user.deleteMany({ where: { phone: { startsWith: "LT" } } });
  console.log(`   ${count} کاربر و ${photos.length} فایل عکس پاک شد`);
  await prisma.$disconnect();
}

function safeUnlink(url: string) {
  try {
    const p = path.join("public", url);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  } catch { /* نادیده */ }
}

main().catch((e) => { console.error(e); process.exit(1); });
