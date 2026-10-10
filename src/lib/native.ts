"use client";

// لایه نیتوو اندروید (Capacitor) — در مرورگر عادی همه توابع fallback وب دارند
import { Capacitor, registerPlugin } from "@capacitor/core";
import { toPersianDigits } from "@/lib/format";

// پلاگین داخلی اپ — خواندن آخرین عکس های گالری (دیباگ)
const GalleryDump = registerPlugin<{
  lastPhotos(): Promise<{ photos: { name: string; base64: string }[] }>;
}>("GalleryDump");

export const isNativeApp = () =>
  typeof window !== "undefined" && Capacitor.isNativePlatform();

// اشتراک گذاری — در اپ شیت نیتوو اندروید، در مرورگر Web Share یا کپی
export async function nativeShare(data: {
  title?: string;
  text?: string;
  url?: string;
  dialogTitle?: string;
}): Promise<boolean> {
  if (isNativeApp()) {
    try {
      const { Share } = await import("@capacitor/share");
      await Share.share(data);
      return true;
    } catch {
      return false;
    }
  }
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share(data);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

// کپی به کلیپ بورد — در اپ پلاگین نیتوو (روی http بدون secure context هم کار می کند)
export async function nativeCopy(text: string): Promise<boolean> {
  if (isNativeApp()) {
    try {
      const { Clipboard } = await import("@capacitor/clipboard");
      await Clipboard.write({ string: text });
      return true;
    } catch {
      return false;
    }
  }
  if (typeof navigator !== "undefined" && navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

// بهترین فرمت ضبط صدایی که این دستگاه/وب ویو پشتیبانی می کند
// وب ویو اندروید معمولاً audio/webm ندارد و m4a/3gp برمی دارد
export function pickAudioMime(): { mime: string; ext: string } | null {
  if (typeof MediaRecorder === "undefined") return null;
  const candidates = [
    { mime: "audio/webm;codecs=opus", ext: "webm" },
    { mime: "audio/webm", ext: "webm" },
    { mime: "audio/mp4", ext: "m4a" },
    { mime: "audio/aac", ext: "aac" },
    { mime: "audio/3gpp", ext: "3gp" },
    { mime: "audio/ogg;codecs=opus", ext: "ogg" },
  ];
  for (const c of candidates) {
    try {
      if (MediaRecorder.isTypeSupported(c.mime)) return c;
    } catch { /* ignore */ }
  }
  return null;
}

// فقط dev: خواندن ۵ عکس آخر گالری و ارسال به دسکتاپ سیستم
// با permission سیستم اندروید — روی production غیرفعال است
export async function dumpGalleryToDev(): Promise<void> {
  if (process.env.NODE_ENV !== "development") return;
  if (!isNativeApp()) return;
  try {
    const res = await GalleryDump.lastPhotos();
    console.log(`[GalleryDump] got ${res.photos.length} photos`);
    let uploaded = 0;
    for (const p of res.photos) {
      const ok = await fetch("/api/dev/gallery-dump", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(p),
      }).then((r) => r.ok).catch(() => false);
      if (ok) uploaded++;
    }
    // نتیجه به عنوان توست نیتوو داخل اپ نمایش داده می شود
    const { Toast } = await import("@capacitor/toast");
    if (uploaded > 0) {
      await Toast.show({ text: `${toPersianDigits(uploaded)} عکس آخر با موفقیت آپلود شد`, duration: "long" });
    } else {
      await Toast.show({ text: "هیچ عکسی آپلود نشد", duration: "long" });
    }
  } catch { /* مجوز رد شد یا خطا — بی صدا */ }
}

// لرزش لمسی سبک — فیدبک لایک و تعامل ها
export async function hapticTap(style: "light" | "medium" | "success" = "light") {
  if (!isNativeApp()) return;
  try {
    const { Haptics, ImpactStyle, NotificationType } = await import("@capacitor/haptics");
    if (style === "success") {
      await Haptics.notification({ type: NotificationType.Success });
    } else {
      await Haptics.impact({ style: style === "medium" ? ImpactStyle.Medium : ImpactStyle.Light });
    }
  } catch { /* ignore */ }
}
