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
