// ذخیره سازی فایل — S3 compatible در production، دیسک محلی در توسعه
import { writeFile, mkdir, unlink } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const {
  S3_ENDPOINT,
  S3_BUCKET,
  S3_REGION,
  S3_ACCESS_KEY_ID,
  S3_SECRET_ACCESS_KEY,
  S3_PUBLIC_URL,
} = process.env;

// آیا S3 پیکربندی شده؟
export function isS3Enabled(): boolean {
  return !!(S3_ENDPOINT && S3_BUCKET && S3_ACCESS_KEY_ID && S3_SECRET_ACCESS_KEY && S3_PUBLIC_URL);
}

let s3Client: import("@aws-sdk/client-s3").S3Client | null = null;

function getS3() {
  if (!s3Client) {
    const { S3Client } = require("@aws-sdk/client-s3") as typeof import("@aws-sdk/client-s3");
    s3Client = new S3Client({
      endpoint: S3_ENDPOINT,
      region: S3_REGION || "us-east-1",
      credentials: {
        accessKeyId: S3_ACCESS_KEY_ID!,
        secretAccessKey: S3_SECRET_ACCESS_KEY!,
      },
      forcePathStyle: true, // بیشتر سرویس های S3 compatible ایرانی path-style می خواهند
    });
  }
  return s3Client;
}

/**
 * آپلود فایل و برگرداندن URL عمومی.
 * در production به S3 می رود؛ در توسعه به public/uploads.
 * @param key مسیر داخل باکت/پوشه، مثل "verify/user123.jpg"
 */
export async function uploadFile(
  key: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  // پاکسازی key از کاراکترهای خطرناک
  const safeKey = key.replace(/[^a-zA-Z0-9\-_./]/g, "").replace(/\.\./g, "");

  // اگر S3 پیکربندی شده به باکت می رود، در غیر این صورت fallback محلی public/uploads
  // (public توسط next start از دیسک سرو می شود و فایل های جدید هم دیده می شوند)
  if (isS3Enabled()) {
    const { PutObjectCommand } = await import("@aws-sdk/client-s3");
    await getS3().send(
      new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: safeKey,
        Body: buffer,
        ContentType: contentType,
      })
    );
    return `${S3_PUBLIC_URL!.replace(/\/$/, "")}/${safeKey}`;
  }

  // fallback محلی — public/uploads
  const filePath = path.join(process.cwd(), "public", "uploads", safeKey);
  const dir = path.dirname(filePath);
  if (!existsSync(dir)) await mkdir(dir, { recursive: true });
  await writeFile(filePath, buffer);
  return `/uploads/${safeKey}`;
}

// حذف فایل — محلی یا S3 بر اساس URL
export async function deleteFile(url: string) {
  try {
    if (url.startsWith("/uploads/")) {
      const filePath = path.join(process.cwd(), "public", url);
      if (existsSync(filePath)) await unlink(filePath);
      return;
    }
    if (isS3Enabled() && url.startsWith(S3_PUBLIC_URL!)) {
      const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
      const key = url.slice(S3_PUBLIC_URL!.replace(/\/$/, "").length + 1);
      await getS3().send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: key }));
    }
  } catch (err) {
    console.error("[storage] delete failed:", url, err);
  }
}

// گرفتن پسوند امن از نام یا MIME فایل
export function safeExtension(fileName: string, mimeType: string): string {
  const fromName = (fileName.split(".").pop() || "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase()
    .slice(0, 5);
  if (fromName) return fromName;
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "video/mp4": "mp4",
    "video/webm": "webm",
    "audio/mpeg": "mp3",
    "audio/ogg": "ogg",
    "audio/webm": "webm",
  };
  return map[mimeType] || "bin";
}
