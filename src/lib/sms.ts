// ارسال SMS با کاوه نگار — در صورت نبود API key فقط لاگ می کند
const API_KEY = () => {
  const key = process.env.KAVENEGAR_API_KEY;
  if (!key) throw new Error("KAVENEGAR_API_KEY is not set");
  return key;
};

export async function sendSms(phone: string, message: string): Promise<boolean> {
  const apiKey = process.env.KAVENEGAR_API_KEY;
  if (!apiKey && process.env.NODE_ENV === "production") {
    console.error("[sms] KAVENEGAR_API_KEY is not set in production; SMS not sent");
    return false;
  }
  if (!apiKey) {
    // حالت توسعه: SMS واقعی ارسال نمی شود، فقط لاگ
    console.log(`[sms] dev-mode SMS to ${phone}: ${message}`);
    return true;
  }

  try {
    const url = `https://api.kavenegar.com/v1/${apiKey}/sms/send.json`;
    const params = new URLSearchParams({ receptor: phone, message });
    const res = await fetch(url, { method: "POST", body: params });
    const data = await res.json();
    if (res.ok && data?.return?.status === 200) {
      console.log(`[sms] sent to ${phone}`);
      return true;
    }
    console.error("[sms] send failed:", data);
    return false;
  } catch (err) {
    console.error("[sms] error:", err);
    return false;
  }
}

export async function sendOtpSms(phone: string, code: string): Promise<boolean> {
  return sendSms(phone, `کد تایید کندو: ${code}\nاعتبار: ۲ دقیقه`);
}
