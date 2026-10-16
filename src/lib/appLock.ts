// قفل برنامه: پین ۴ رقمی + بیومتریک (اثر انگشت/چهره) در اپ اندروید
// پین فقط به صورت هش SHA-256 با salt تصادفی در localStorage همان دستگاه نگه داری می شود
// و هیچ وقت به سرور ارسال نمی شود — قفل محلی هر دستگاه است
const KEY = "kandoo.applock.v1";

export type AppLockConfig = {
  salt: string;
  hash: string;
  bio: boolean;
};

async function digest(text: string): Promise<string> {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const buf = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(text)
    );
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  // fallback برای context های ناامن (dev روی http) — امنیت واقعی فقط در https اپ است
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

function randomSalt(): string {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    return Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  return `${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`;
}

export function getLockConfig(): AppLockConfig | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const cfg = JSON.parse(raw) as AppLockConfig;
    if (typeof cfg.salt !== "string" || typeof cfg.hash !== "string") return null;
    return cfg;
  } catch {
    return null;
  }
}

export async function setLock(pin: string, bio: boolean): Promise<void> {
  const salt = randomSalt();
  const hash = await digest(`${salt}:${pin}`);
  localStorage.setItem(KEY, JSON.stringify({ salt, hash, bio }));
}

export async function verifyPin(pin: string): Promise<boolean> {
  const cfg = getLockConfig();
  if (!cfg) return false;
  return (await digest(`${cfg.salt}:${pin}`)) === cfg.hash;
}

export async function setBioEnabled(bio: boolean): Promise<void> {
  const cfg = getLockConfig();
  if (!cfg) return;
  localStorage.setItem(KEY, JSON.stringify({ ...cfg, bio }));
}

export function clearLock(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

export type BiometryKind = "fingerprint" | "face" | "none";

// فقط در اپ بومی معنا دارد — در مرورگر همیشه none
export async function checkBiometry(): Promise<{ available: boolean; kind: BiometryKind }> {
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (!Capacitor.isNativePlatform()) return { available: false, kind: "none" };
    const { BiometricAuth, BiometryType } = await import(
      "@aparajita/capacitor-biometric-auth"
    );
    const res = await BiometricAuth.checkBiometry();
    if (!res.isAvailable) return { available: false, kind: "none" };
    const kind: BiometryKind =
      res.biometryType === BiometryType.faceAuthentication ||
      res.biometryType === BiometryType.faceId
        ? "face"
        : "fingerprint";
    return { available: true, kind };
  } catch {
    return { available: false, kind: "none" };
  }
}

// باز کردن قفل با بیومتریک یا رمز دستگاه (پین/الگوی خود گوشی)
export async function biometricUnlock(): Promise<boolean> {
  try {
    const { BiometricAuth } = await import("@aparajita/capacitor-biometric-auth");
    await BiometricAuth.authenticate({
      reason: "باز کردن قفل کندو",
      cancelTitle: "انصراف",
      androidTitle: "قفل کندو",
      androidSubtitle: "برای ورود هویت خود را تایید کنید",
      allowDeviceCredential: true,
    });
    return true;
  } catch {
    return false;
  }
}
