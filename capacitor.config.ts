import type { CapacitorConfig } from "@capacitor/cli";

// اپلیکیشن اندروید کندو — wrapper وب ویو روی سرور اصلی
// آدرس سرور را با CAPACITOR_SERVER_URL مشخص کنید (پیش فرض دامنه production)
const serverUrl =
  process.env.CAPACITOR_SERVER_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://kandoochat.top";

// برای آدرس http (مثل IP شبکه در dev) باید cleartext فعال باشد
const isHttp = serverUrl.startsWith("http:");

const config: CapacitorConfig = {
  appId: "com.kandoochats.app",
  appName: "کندو",
  // webDir مینیمال — محتوای اصلی از server.url ریموت لود می شود؛
  // این فقط صفحه آفلاین است تا public/uploads (صدها مگ) داخل اپ کپی نشود
  webDir: "app-web",
  server: {
    url: serverUrl,
    cleartext: isHttp,
  },
  android: {
    allowMixedContent: isHttp,
    // توکن KandooApp در User-Agent اپ قرار می گیرد تا بازدیدهای اپ از وب جدا شمرده شوند
    appendUserAgent: "KandooApp/1.0",
  },
  plugins: {
    // کیبورد: خودِ WebView کوچک می شود تا هدر و باکس تایپ چت بالای کیبورد بمانند
    // و فقط ناحیه پیام ها کوچک شود (resize: native + resizeOnFullScreen)
    Keyboard: {
      resize: "native",
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
