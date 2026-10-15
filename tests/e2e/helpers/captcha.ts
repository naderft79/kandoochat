// کمکی تست E2E برای کپچا — در محیط dev با توکن bypass پاس می شود
import type { APIRequestContext } from "@playwright/test";

export const CAPTCHA_BYPASS = process.env.CAPTCHA_BYPASS_TOKEN ?? "KNDTEST";

// یک شناسه کپچای واقعی از سرور می گیرد و متن bypass برمی گرداند
export async function captchaFields(request: APIRequestContext) {
  const r = await request.get("/api/captcha");
  const { id } = (await r.json()) as { id: string };
  return { captchaId: id, captchaText: CAPTCHA_BYPASS };
}
