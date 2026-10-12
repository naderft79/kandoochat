// ارسال SMS با صبانوین (REST v1) — مستندات: https://sabanovin.com/documentation
// کد تایید از متد OTP هوشمند صبانوین ارسال می شود (gateway=otp)؛ در ارسال دوم در ۳ دقیقه، صبانوین خودش تماس صوتی می گیرد.
// کلید API فقط در مسیر URL است؛ هرگز در لاگ چاپ نمی شود.
const BASE_URL = "https://api.sabanovin.com/v1";
const TIMEOUT_MS = 10000;
const OTP_GATEWAY = "otp";

// کد وضعیت های موفق صبانوین
const OK_CODE = 200;

function apiKey(): string | null {
  return process.env.SABANOVIN_API_KEY || null;
}

async function callSabanovin(path: string, params: URLSearchParams): Promise<{ ok: boolean; code?: number }> {
  const key = apiKey();
  if (!key) return { ok: false };
  try {
    const res = await fetch(`${BASE_URL}/${encodeURIComponent(key)}/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const data = (await res.json().catch(() => null)) as { status?: { code?: number } } | null;
    const code = data?.status?.code;
    if (res.ok && code === OK_CODE) return { ok: true, code };
    console.error(`[sms] sabanovin rejected request: http=${res.status} code=${code ?? "unknown"}`);
    return { ok: false, code };
  } catch (err) {
    console.error("[sms] sabanovin request error:", err instanceof Error ? err.name : "unknown");
    return { ok: false };
  }
}

export async function sendSms(phone: string, message: string): Promise<boolean> {
  if (!apiKey()) {
    if (process.env.NODE_ENV === "production") {
      console.error("[sms] SABANOVIN_API_KEY is not set in production; SMS not sent");
      return false;
    }
    // حالت توسعه: SMS واقعی ارسال نمی شود، فقط لاگ (بدون متن پیام)
    console.log("[sms] dev-mode: SMS not sent (no SABANOVIN_API_KEY)");
    return true;
  }
  const gateway = process.env.SABANOVIN_GATEWAY;
  if (!gateway) {
    console.error("[sms] SABANOVIN_GATEWAY is not set; SMS not sent");
    return false;
  }
  const r = await callSabanovin("sms/send.json", new URLSearchParams({ gateway, to: phone, text: message }));
  if (r.ok) console.log("[sms] sent");
  return r.ok;
}

// کد تایید: متن باید ماهیت OTP داشته باشد و نام سایت را داشته باشد (الزام صبانوین)
export async function sendOtpSms(phone: string, code: string): Promise<boolean> {
  if (!apiKey()) {
    if (process.env.NODE_ENV === "production") {
      console.error("[sms] SABANOVIN_API_KEY is not set in production; OTP not sent");
      return false;
    }
    console.log(`[sms] dev-mode OTP for ${phone.slice(0, 4)}***: code=${code}`);
    return true;
  }
  // صبانوین برای متد OTP وجود عبارت «لغو11» در متن را الزامی کرده است (خطای ۴۲۲ در غیر این صورت)
  const text = `کد ورود به سیستم کندو : ${code} لغو11`;
  const r = await callSabanovin("sms/send.json", new URLSearchParams({ gateway: OTP_GATEWAY, to: phone, text }));
  if (r.ok) console.log("[sms] otp sent");
  return r.ok;
}
