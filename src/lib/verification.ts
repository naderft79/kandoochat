// توابع مشترک احراز هویت — اعتبارسنجی فایل، آپلود و تشخیص چهره سلفی ها
import { uploadFile, safeExtension } from "@/lib/storage";
import { detectFaces } from "@/lib/face";

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const AUDIO_TYPES = [
  "audio/webm",
  "audio/mp3",
  "audio/wav",
  "audio/ogg",
  "audio/mpeg",
  "audio/mp4",
];
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // ۱۰ مگابایت

// اعتبارسنجی یک فایل — در صورت مشکل، پیام خطا برمی گردد
export function validateUpload(
  file: File | null,
  types: string[],
  label: string
): string | null {
  if (!file || file.size === 0) return `${label} الزامی است`;
  if (!types.includes(file.type)) return `فرمت ${label} مجاز نیست`;
  if (file.size > MAX_FILE_SIZE) return "حداکثر حجم هر فایل ۱۰ مگابایت است";
  return null;
}

// آپلود فایل مربوط به احراز هویت و برگرداندن URL
export async function uploadVerifyFile(
  userId: string,
  buffer: Buffer,
  mimeType: string,
  fileName: string,
  tag: string
): Promise<string> {
  const ext = safeExtension(fileName, mimeType);
  const rand = Math.random().toString(36).slice(2, 8);
  const key = `verify/${tag}-${userId}-${Date.now()}-${rand}.${ext}`;
  return uploadFile(key, buffer, mimeType);
}

// بررسی چهره در همه سلفی ها — فقط وقتی سرویس تشخیص چهره فعال باشد اعمال می شود
export async function checkSelfieFaces(
  selfies: { buffer: Buffer; type: string }[]
): Promise<{
  error: string | null;
  faceScore: number | null;
  faceCount: number | null;
  autoResult: string;
}> {
  let sawService = false;
  let minScore = 1;
  let maxFaces = 0;

  for (const s of selfies) {
    const result = await detectFaces(s.buffer, s.type);
    if (result === null) continue; // سرویس در دسترس نیست — بررسی دستی
    sawService = true;
    maxFaces = Math.max(maxFaces, result.faces);
    minScore = Math.min(minScore, result.score);

    if (result.faces === 0) {
      return {
        error:
          "در یکی از عکس های سلفی چهره ای تشخیص داده نشد. لطفا عکس های واضحی از چهره خودتان بفرستید",
        faceScore: null,
        faceCount: null,
        autoResult: "FACE_NOT_FOUND",
      };
    }
    if (result.faces > 1) {
      return {
        error:
          "در یکی از عکس های سلفی بیش از یک چهره دیده می شود. لطفا عکس هایی بفرستید که فقط چهره خودتان در آن باشد",
        faceScore: null,
        faceCount: null,
        autoResult: "FACE_NOT_FOUND",
      };
    }
    if (result.score < 0.6) {
      return {
        error:
          "کیفیت یکی از عکس های سلفی برای تشخیص چهره کافی نیست. لطفا عکس واضح تری آپلود کنید",
        faceScore: null,
        faceCount: null,
        autoResult: "FACE_NOT_FOUND",
      };
    }
  }

  return {
    error: null,
    faceScore: sawService ? minScore : null,
    faceCount: sawService ? maxFaces : null,
    autoResult: sawService ? "FACE_OK" : "MANUAL",
  };
}

// اعتبارسنجی کد ملی ایران (۱۰ رقم + رقم کنترل)
export function isValidNationalCode(code: string): boolean {
  if (!/^\d{10}$/.test(code)) return false;
  if (/^(\d)\1{9}$/.test(code)) return false; // همه ارقام یکسان
  const check = parseInt(code[9], 10);
  const sum = code
    .slice(0, 9)
    .split("")
    .reduce((s, d, i) => s + parseInt(d, 10) * (10 - i), 0);
  const rem = sum % 11;
  return rem < 2 ? check === rem : check === 11 - rem;
}
