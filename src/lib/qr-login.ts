// ابزار لاگین خودکار ادمین با QR — فقط برای تست روی شبکه محلی
import os from "os";
import crypto from "crypto";
import dgram from "dgram";

// فعال بودن: در محیط غیر پروداکشن همیشه؛ در پروداکشن فقط با ADMIN_QR_LOGIN=1
export function qrLoginEnabled(): boolean {
  if (process.env.ADMIN_QR_LOGIN === "1") return true;
  return process.env.NODE_ENV !== "production";
}

// نام آداپتورهای مجازی که باید نادیده گرفته شوند
const VIRTUAL_ADAPTER =
  /vethernet|vmware|virtualbox|wsl|hyper-v|loopback|bluetooth|zerotier|tailscale|hamachi|vpn|tun|tap/i;

// پیدا کردن IP داخلی سیستم روی شبکه محلی برای دسترسی گوشی
// اول آداپتور فیزیکی (وای فای/اترنت)، بعد رنج های شبکه خانگی، در انتها هر IP دیگر
function scanLanIp(): string | null {
  const physical: string[] = [];
  const rest: string[] = [];
  for (const [name, infos] of Object.entries(os.networkInterfaces())) {
    for (const info of infos ?? []) {
      if (info.family !== "IPv4" || info.internal) continue;
      (VIRTUAL_ADAPTER.test(name) ? rest : physical).push(info.address);
    }
  }
  const byRange = (list: string[]) =>
    list.find((ip) => ip.startsWith("192.168.")) ??
    list.find((ip) => ip.startsWith("10.")) ??
    list.find((ip) => /^172\.(1[6-9]|2\d|3[01])\./.test(ip)) ??
    list[0];
  return byRange(physical) ?? byRange(rest) ?? null;
}

// جایگزین: سوکت UDP به سمت اینترنت — IP آداپتور مسیر پیش فرض را می دهد
function detectLanIp(): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      const socket = dgram.createSocket("udp4");
      const done = (ip: string | null) => {
        try { socket.close(); } catch { /* ignore */ }
        resolve(ip);
      };
      socket.once("error", () => done(null));
      socket.connect(53, "8.8.8.8", () => {
        const addr = socket.address();
        done(addr && typeof addr === "object" && "address" in addr ? String(addr.address) : null);
      });
      setTimeout(() => done(null), 1000);
    } catch {
      resolve(null);
    }
  });
}

export async function getLanAddress(): Promise<string> {
  const port = process.env.PORT || "3000";
  // اسکن آداپتورهای فیزیکی مهم تر است — سوکت ممکن است آداپتور VPN/مجازی را بدهد
  const scanned = scanLanIp();
  const host = scanned ?? (await detectLanIp()) ?? "localhost";
  return `http://${host}:${port}`;
}

// توکن روزانه لاگین — بر اساس JWT_SECRET تا آدرس قابل حدس نباشد
function tokenFor(date: Date): string {
  const secret = process.env.JWT_SECRET ?? "kandoo-qr";
  const day = date.toISOString().slice(0, 10);
  return crypto
    .createHmac("sha256", secret)
    .update(`qr-login:${day}`)
    .digest("hex")
    .slice(0, 24);
}

export function qrLoginToken(): string {
  return tokenFor(new Date());
}

// بررسی توکن — دیروز هم پذیرفته می شود تا نیمه شب نشکند
export function verifyQrToken(token: string): boolean {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const valid = [tokenFor(new Date()), tokenFor(yesterday)];
  return valid.some(
    (v) => v.length === token.length && crypto.timingSafeEqual(Buffer.from(v), Buffer.from(token))
  );
}

// مسیر کامل لاگین خودکار که داخل QR قرار می گیرد
export async function qrLoginUrl(): Promise<string> {
  return `${await getLanAddress()}/api/qr-login?t=${qrLoginToken()}`;
}
