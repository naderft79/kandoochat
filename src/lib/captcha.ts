// کپچای خودمیزبان — حروف به صورت نقاط پیکسلی رسم و با sharp به PNG تبدیل می شوند
// تا خروجی تصویر واقعی باشد (نه متن قابل کپی/خواندن از DOM)؛ بدون وابستگی خارجی
import { createHmac, randomInt, timingSafeEqual } from "crypto";
import sharp from "sharp";
import { getRedis } from "@/lib/redis";

const SECRET = () => process.env.JWT_SECRET ?? "kandoo-captcha-fallback";
const TTL_MS = 10 * 60 * 1000; // ۱۰ دقیقه اعتبار
// حروف بدون ابهام — بدون 0/O/1/I/L تا کاربر اشتباه نگیرد
const CHARS = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

// فونت نقطه ای ۵×۷ برای هر کاراکتر — هر رشته یک سطر، بیت چپ به راست
const GLYPHS: Record<string, string[]> = {
  "2": ["01110", "10001", "00001", "00010", "00100", "01000", "11111"],
  "3": ["11111", "00010", "00100", "00010", "00001", "10001", "01110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
  "6": ["00110", "01000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00010", "01100"],
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01110", "10001", "10000", "10000", "10000", "10001", "01110"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  G: ["01110", "10001", "10000", "10111", "10001", "10001", "01111"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  J: ["00111", "00010", "00010", "00010", "00010", "10010", "01100"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  N: ["10001", "10001", "11001", "10101", "10011", "10001", "10001"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  W: ["10001", "10001", "10001", "10101", "10101", "10101", "01010"],
  X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
};

const b64url = (s: string) => Buffer.from(s, "utf8").toString("base64url");
const sign = (data: string) => createHmac("sha256", SECRET()).update(data).digest("base64url");
const hashAnswer = (text: string) => createHmac("sha256", SECRET()).update("ans:" + text).digest("base64url");
const hashId = (id: string) => createHmac("sha256", SECRET()).update("id:" + id).digest("base64url");

const usedIds = new Map<string, number>(); // حافظه محلی برای محیط بدون Redis

function normalizeAnswer(text: string): string {
  // ارقام فارسی/عربی به لاتین، فاصله حذف، حروف بزرگ — بدون حساسیت به کوچک/بزرگ
  return text
    .replace(/[۰-۹]/g, (c) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(c)))
    .replace(/[٠-٩]/g, (c) => String("٠١٢٣٤٥٦٧٨٩".indexOf(c)))
    .replace(/\s+/g, "")
    .toUpperCase();
}

export async function createCaptcha(): Promise<{ id: string; png: string }> {
  // سه کاراکتر خوانا
  const code = Array.from({ length: 3 }, () => CHARS[randomInt(0, CHARS.length)]).join("");
  const payload = b64url(JSON.stringify({ h: hashAnswer(code), exp: Date.now() + TTL_MS }));
  const id = `${payload}.${sign(payload)}`;

  const w = 170;
  const h = 64;
  const gap = 9; // فاصله نقاط
  const dotR = 3.6;
  const cellW = 5 * gap + 12;
  const parts: string[] = [`<rect width="${w}" height="${h}" fill="#f6f6f6" rx="10"/>`];

  // یک منحنی خیلی کم رنگ برای امنیت پایه
  parts.push(
    `<path d="M0 ${randomInt(12, h - 12)} Q ${w / 2} ${randomInt(10, h - 10)} ${w} ${randomInt(12, h - 12)}" stroke="#ddd" stroke-width="1" fill="none"/>`
  );

  // رسم هر کاراکتر به صورت نقطه چین با چرخش خفیف
  const totalW = code.length * cellW;
  const startX = (w - totalW) / 2;
  for (let i = 0; i < code.length; i++) {
    const glyph = GLYPHS[code[i]];
    const cx = startX + i * cellW + cellW / 2;
    const cy = h / 2;
    const rot = randomInt(-8, 8);
    const dots: string[] = [];
    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 5; col++) {
        if (glyph[row][col] !== "1") continue;
        const x = startX + i * cellW + col * gap + 6;
        const y = (h - 6 * gap) / 2 + row * gap;
        dots.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${dotR}" fill="#222"/>`);
      }
    }
    parts.push(`<g transform="rotate(${rot} ${cx} ${cy})">${dots.join("")}</g>`);
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w * 2}" height="${h * 2}" viewBox="0 0 ${w} ${h}">${parts.join("")}</svg>`;
  const png = (await sharp(Buffer.from(svg)).png().toBuffer()).toString("base64");
  return { id, png };
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
