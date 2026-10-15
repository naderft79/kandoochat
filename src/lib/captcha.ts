// کپچای خودمیزبان SVG — بدون وابستگی خارجی (گوگل/کلاودفلر ممکن است فیلتر باشد)
// توکن امضا شده شامل هش پاسخ و انقضا + مصرف یکبار در Redis/حافظه تا replay نشود
import { createHmac, randomInt, timingSafeEqual } from "crypto";
import { getRedis } from "@/lib/redis";

const SECRET = () => process.env.JWT_SECRET ?? "kandoo-captcha-fallback";
const TTL_MS = 10 * 60 * 1000; // ۱۰ دقیقه اعتبار
// حروف بدون ابهام — بدون 0/O/1/I/L تا کاربر اشتباه نگیرد
const CHARS = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

const b64url = (s: string) => Buffer.from(s, "utf8").toString("base64url");
const sign = (data: string) => createHmac("sha256", SECRET()).update(data).digest("base64url");
const hashAnswer = (text: string) => createHmac("sha256", SECRET()).update("ans:" + text).digest("base64url");
const hashId = (id: string) => createHmac("sha256", SECRET()).update("id:" + id).digest("base64url");

const usedIds = new Map<string, number>(); // حافظه محلی برای محیط بدون Redis

function normalizeAnswer(text: string): string {
  // ارقام فارسی/عربی به لاتین، فاصله حذف، حروف بزرگ
  return text
    .replace(/[۰-۹]/g, (c) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(c)))
    .replace(/[٠-٩]/g, (c) => String("٠١٢٣٤٥٦٧٨٩".indexOf(c)))
    .replace(/\s+/g, "")
    .toUpperCase();
}

export function createCaptcha(): { id: string; svg: string } {
  // سه حرف، بزرگ و خوانا — بدون حساسیت به بزرگ/کوچک در بررسی
  const code = Array.from({ length: 3 }, () => CHARS[randomInt(0, CHARS.length)]).join("");
  const payload = b64url(JSON.stringify({ h: hashAnswer(code), exp: Date.now() + TTL_MS }));
  const id = `${payload}.${sign(payload)}`;

  const w = 150;
  const h = 64;
  const parts: string[] = [
    `<rect width="${w}" height="${h}" fill="#fafafa" rx="10"/>`,
  ];
  // یک منحنی خیلی کم رنگ فقط برای امنیت پایه
  const y1 = randomInt(10, h - 10), y2 = randomInt(10, h - 10);
  parts.push(
    `<path d="M0 ${y1} Q ${w / 2} ${randomInt(15, h - 15)} ${w} ${y2}" stroke="#ddd" stroke-width="1" fill="none"/>`
  );
  // حروف بزرگ، تقریبا صاف، با رنگ تیره
  const step = w / (code.length + 1);
  for (let i = 0; i < code.length; i++) {
    const x = step * (i + 1);
    const y = h / 2 + 11;
    const rot = randomInt(-12, 12);
    parts.push(
      `<text x="${x}" y="${y}" text-anchor="middle" transform="rotate(${rot} ${x} ${y})" font-family="Verdana,sans-serif" font-size="36" font-weight="700" fill="#333">${code[i]}</text>`
    );
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${parts.join("")}</svg>`;
  return { id, svg };
}

// تلاش برای مصرف کردن توکن — اگر قبلا استفاده شده باشد false برمی گردد
async function consumeId(id: string): Promise<boolean> {
  const key = `captcha:used:${hashId(id)}`;
  const redis = getRedis();
  if (redis) {
    try {
      const res = await redis.set(key, "1", "PX", TTL_MS, "NX");
      return res === "OK";
    } catch {
      // ادامه با حافظه محلی
    }
  }
  const now = Date.now();
  if (usedIds.has(key)) return false;
  usedIds.set(key, now + TTL_MS);
  // پاکسازی دوره ای ساده
  if (usedIds.size > 5000) {
    for (const [k, exp] of usedIds) if (exp < now) usedIds.delete(k);
  }
  return true;
}

export async function verifyCaptcha(id: string | undefined, text: string | undefined): Promise<boolean> {
  if (!id || !text) return false;
  // راه میان بر تست E2E — فقط در محیط غیر production فعال است
  if (process.env.NODE_ENV !== "production" && text === (process.env.CAPTCHA_BYPASS_TOKEN ?? "KNDTEST")) {
    return true;
  }
  const dot = id.lastIndexOf(".");
  if (dot <= 0) return false;
  const payload = id.slice(0, dot);
  const sig = id.slice(dot + 1);
  // امضا را با مقایسه ثابت-زمان چک می کنیم
  const expected = sign(payload);
  if (sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    return false;
  }
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { h: string; exp: number };
    if (typeof data.exp !== "number" || Date.now() > data.exp) return false;
    const answerHash = hashAnswer(normalizeAnswer(text));
    if (answerHash.length !== data.h.length || !timingSafeEqual(Buffer.from(answerHash), Buffer.from(data.h))) {
      return false;
    }
    // پاسخ درست — توکن را مصرف می کنیم تا دوباره استفاده نشود
    return consumeId(id);
  } catch {
    return false;
  }
}
