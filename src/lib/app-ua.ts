// تشخیص اپ های اندروید کندو از روی توکن User-Agent (android.appendUserAgent در capacitor)
// توجه: «KandooAdminApp» زیررشته «KandooApp» نیست و دو توکن مستقل تشخیص داده می شوند
export const USER_APP_UA = "KandooApp";
export const ADMIN_APP_UA = "KandooAdminApp";

export function isUserApp(userAgent: string | null | undefined): boolean {
  return !!userAgent?.includes(USER_APP_UA);
}

export function isAdminApp(userAgent: string | null | undefined): boolean {
  return !!userAgent?.includes(ADMIN_APP_UA);
}

// تشخیص اپ از روی هدر درخواست — برای دفاع سمت API و صفحات سرور
export function isUserAppRequest(request: Request): boolean {
  return isUserApp(request.headers.get("user-agent"));
}

// تشخیص اپ سمت کلاینت — توکن KandooApp در User-Agent وب ویو قرار می گیرد
// برای مخفی کردن خریدهای درون اپی (سیاست گوگل پلی: فروش کالای دیجیتال فقط با Play Billing)
export function isAppShellClient(): boolean {
  if (typeof navigator === "undefined") return false;
  return navigator.userAgent.includes(USER_APP_UA);
}
