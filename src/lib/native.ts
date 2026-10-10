"use client";

// لایه نیتوو اندروید (Capacitor) — در مرورگر عادی همه توابع fallback وب دارند
import { Capacitor } from "@capacitor/core";

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
