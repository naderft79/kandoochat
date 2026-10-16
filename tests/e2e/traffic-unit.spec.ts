// تست واحد طبقه بندی منبع ورود و تشخیص صفحه (بدون مرورگر)
import { test, expect } from "@playwright/test";
import { classifyEntry, detectPlatform } from "../../src/lib/traffic";
import { resolvePage } from "../../src/lib/page-names";

const WEB_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0 Safari/537.36";
const IG_UA = "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Instagram 300.0.0.0";
const TG_UA = "Mozilla/5.0 (iPhone) Mobile Safari Telegram";
const WV_UA = "Mozilla/5.0 (Linux; Android 14; wv) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36";
const APP_UA = "Mozilla/5.0 (Linux; Android 14) KandooApp/1.0 Chrome/120";
const base = { ownHost: "kandoochat.top", utmSource: null, utmMedium: null };

test.describe("طبقه بندی منبع ورود", () => {
  test("موتور جستجو از روی ارجاع دهنده", () => {
    expect(classifyEntry({ ...base, ua: WEB_UA, referrer: "https://www.google.com/search?q=kandoo" })).toEqual({ channel: "SEARCH", source: "google", platform: "WEB" });
    expect(classifyEntry({ ...base, ua: WEB_UA, referrer: "https://www.google.co.uk/" }).source).toBe("google");
    expect(classifyEntry({ ...base, ua: WEB_UA, referrer: "https://www.bing.com/" }).source).toBe("bing");
  });

  test("شبکه اجتماعی از روی ارجاع دهنده", () => {
    expect(classifyEntry({ ...base, ua: WEB_UA, referrer: "https://t.me/somechannel" })).toEqual({ channel: "SOCIAL", source: "telegram", platform: "WEB" });
    expect(classifyEntry({ ...base, ua: WEB_UA, referrer: "https://l.instagram.com/" }).source).toBe("instagram");
  });

  test("مرورگر داخلی اینستاگرام و تلگرام بدون ارجاع دهنده شناخته می شود", () => {
    expect(classifyEntry({ ...base, ua: IG_UA, referrer: null })).toEqual({ channel: "SOCIAL", source: "instagram", platform: "WEB" });
    expect(classifyEntry({ ...base, ua: TG_UA, referrer: null })).toEqual({ channel: "SOCIAL", source: "telegram", platform: "WEB" });
  });

  test("utm_source برای منبع شناخته شده و تبلیغ", () => {
    expect(classifyEntry({ ...base, ua: WEB_UA, referrer: null, utmSource: "instagram", utmMedium: "social" }).channel).toBe("SOCIAL");
    expect(classifyEntry({ ...base, ua: WEB_UA, referrer: null, utmSource: "newsletter", utmMedium: "cpc" })).toEqual({ channel: "PAID", source: "newsletter", platform: "WEB" });
  });

  test("ارجاع از همان دامنه و بدون منبع، مستقیم است؛ دامنه ناشناس ارجاع است", () => {
    expect(classifyEntry({ ...base, ua: WEB_UA, referrer: "https://kandoochat.top/dashboard" }).channel).toBe("DIRECT");
    expect(classifyEntry({ ...base, ua: WEB_UA, referrer: null }).channel).toBe("DIRECT");
    expect(classifyEntry({ ...base, ua: WEB_UA, referrer: "https://blog.example.org/post" })).toEqual({ channel: "REFERRAL", source: "blog.example.org", platform: "WEB" });
  });

  test("وب ویو داخلی اپ های دیگر بدون ارجاع به عنوان شبکه اجتماعی ناشناس ثبت می شود", () => {
    // تلگرام و مشابه روی اندروید مرورگر داخلی wv دارند ولی ارجاع/توکن نمی فرستند
    expect(classifyEntry({ ...base, ua: WV_UA, referrer: null })).toEqual({ channel: "SOCIAL", source: "inapp", platform: "APP" });
    // اپ خودمان با توکن KandooApp اشتباه شبکه اجتماعی نشود
    const own = "Mozilla/5.0 (Linux; Android 14; wv) AppleWebKit/537.36 KandooApp/1.0";
    expect(classifyEntry({ ...base, ua: own, referrer: null }).channel).toBe("DIRECT");
    // وب ویو با ارجاع شناخته شده همان منبع دقیق را می گیرد
    expect(classifyEntry({ ...base, ua: WV_UA, referrer: "https://t.me/channel" }).source).toBe("telegram");
  });

  test("پلتفرم اپ اندروید از KandooApp یا وب ویوی اندروید", () => {
    expect(detectPlatform(APP_UA)).toBe("APP");
    expect(detectPlatform(WV_UA)).toBe("APP");
    expect(detectPlatform(WEB_UA)).toBe("WEB");
  });

  test("ورودی های نامعتبر امن هستند و utm با کاراکتر غیرمجاز پذیرفته نمی شود", () => {
    expect(classifyEntry({ ...base, ua: WEB_UA, referrer: "not a url", utmSource: "<script>" }).channel).toBe("DIRECT");
  });
});

test.describe("تشخیص صفحه", () => {
  test("نام فارسی صفحات سایت", () => {
    expect(resolvePage("/dashboard/subscription")?.name).toBe("صفحه خرید اشتراک");
    expect(resolvePage("/profile/some_user")).toEqual({ key: "profile", name: "صفحه پروفایل", path: "/profile/[username]" });
    expect(resolvePage("/dashboard/search")?.name).toBe("صفحه جستجو");
    expect(resolvePage("/dashboard/chat/abc123")?.key).toBe("chat");
    expect(resolvePage("/dashboard/chat")?.key).toBe("chat_list");
    expect(resolvePage("/register/special")?.key).toBe("register_special");
    expect(resolvePage("/register/some-slug")?.key).toBe("register_slug");
    expect(resolvePage("/")?.name).toBe("صفحه اصلی");
  });

  test("مسیرهای ناشناخته و داخلی شمرده نمی شوند", () => {
    expect(resolvePage("/ui-kit")).toBeNull();
    expect(resolvePage("/_next/static/x.js")).toBeNull();
    expect(resolvePage("/dashboard/unknown/deep/path")).toBeNull();
  });
});
