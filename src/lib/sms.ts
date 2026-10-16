// ارسال کد تایید از طریق KandooPay — کلید صبانوین فقط روی سرور کندوپی است و اینجا نیست
// کد با توکن JWT امضاشده با کلید مشترک KANDOOPAY_SHARED_SECRET به کندوپی فرستاده می شود
import { SignJWT } from "jose";

const TIMEOUT_MS = 10000;
const OTP_AUDIENCE = "kandoopay-sms";
const NOTIFY_AUDIENCE = "kandoopay-sms-notify";

// شماره های مدیران برای اطلاع رسانی پیامکی (ثبت نام، خرید و ...)
const ADMIN_PHONES = ["09182223196", "09181110283"];

function kandooPayConfig() {
  const url = process.env.KANDOOPAY_URL?.replace(/\/$/, "");
  const secret = process.env.KANDOOPAY_SHARED_SECRET;
  if (!url || !secret || secret.length < 32) return null;
  return { url, secret: new TextEncoder().encode(secret) };
}

export async function sendOtpSms(phone: string, code: string): Promise<boolean> {
  const cfg = kandooPayConfig();
  if (!cfg) {
    if (process.env.NODE_ENV === "production") {
      console.error("[sms] KANDOOPAY_URL or KANDOOPAY_SHARED_SECRET is not set in production; OTP not sent");
      return false;
    }
    // حالت توسعه: پیامک واقعی ارسال نمی شود، فقط لاگ (بدون شماره کامل)
    console.log(`[sms] dev-mode OTP for ${phone.slice(0, 4)}***: code=${code}`);
    return true;
  }

  const token = await new SignJWT({ phone, code })
    .setProtectedHeader({ alg: "HS512" })
    .setIssuer("kandoo")
    .setAudience(OTP_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime("2m")
    .sign(cfg.secret);

  try {
    const res = await fetch(`${cfg.url}/api/sms/otp`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (res.ok) return true;
    console.error(`[sms] kandoopay rejected OTP request: http=${res.status}`);
    return false;
  } catch (err) {
    console.error("[sms] kandoopay request error:", err instanceof Error ? err.name : "unknown");
    return false;
  }
}

// ارسال پیامک اطلاع رسانی به مدیران — «لغو11» در انتهای متن اجباری است
// بدون await صدا زده شود تا روند اصلی کند نشود
export function notifyAdminsSms(message: string): void {
  const cfg = kandooPayConfig();
  if (!cfg) {
    console.log(`[sms] dev-mode admin notify: ${message.replace(/\n/g, " | ")}`);
    return;
  }
  const text = `${message}\nلغو11`;
  void Promise.all(
    ADMIN_PHONES.map(async (phone) => {
      const token = await new SignJWT({ phone, text })
        .setProtectedHeader({ alg: "HS512" })
        .setIssuer("kandoo")
        .setAudience(NOTIFY_AUDIENCE)
        .setIssuedAt()
        .setExpirationTime("2m")
        .sign(cfg.secret);
      try {
        const res = await fetch(`${cfg.url}/api/sms/notify`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          signal: AbortSignal.timeout(TIMEOUT_MS),
        });
        if (!res.ok) console.error(`[sms] admin notify rejected: http=${res.status}`);
      } catch (err) {
        console.error("[sms] admin notify error:", err instanceof Error ? err.name : "unknown");
      }
    })
  ).catch(() => {});
}
