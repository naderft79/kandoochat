// دامنه و آدرس سراسری سایت — فقط این یک جا تعریف می شود
// برای تغییر دامنه کافیست NEXT_PUBLIC_SITE_URL را در env عوض کنی؛ همه جا دنبالش می آید
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.NEXT_PUBLIC_BASE_URL ??
  "https://kandoochat.top"
).replace(/\/$/, "");

export const SITE_DOMAIN = new URL(SITE_URL).hostname;
export const SUPPORT_EMAIL = `support@${SITE_DOMAIN}`;
