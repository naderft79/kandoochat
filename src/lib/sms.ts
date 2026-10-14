// ارسال کد تایید از طریق KandooPay — کلید صبانوین فقط روی سرور کندوپی است و اینجا نیست
// کد با توکن JWT امضاشده با کلید مشترک KANDOOPAY_SHARED_SECRET به کندوپی فرستاده می شود
import { SignJWT } from "jose";

const TIMEOUT_MS = 10000;
const OTP_AUDIENCE = "kandoopay-sms";

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
