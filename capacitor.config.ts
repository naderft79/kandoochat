import type { CapacitorConfig } from "@capacitor/cli";

// اپلیکیشن اندروید کندو — wrapper وب ویو روی سرور اصلی
// آدرس سرور را با CAPACITOR_SERVER_URL مشخص کنید (پیش فرض دامنه production)
const serverUrl =
  process.env.CAPACITOR_SERVER_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://kandoochat.com";

// برای آدرس http (مثل IP شبکه در dev) باید cleartext فعال باشد
const isHttp = serverUrl.startsWith("http:");

const config: CapacitorConfig = {
  appId: "com.kandoo.app",
  appName: "کندو",
  webDir: "public",
  server: {
    url: serverUrl,
    cleartext: isHttp,
  },
  android: {
    allowMixedContent: isHttp,
  },
  plugins: {
    // کیبورد: تغییر اندازه وب ویو تا اینپوت زیر کیبورد نرود (چت)
    Keyboard: {
      resize: "body",
      resizeOnFullScreen: true,
    },
    // اسپلش: بعد از لود وب خودش محو می شود
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 0,
      backgroundColor: "#ffffff",
    },
  },
};

export default config;
