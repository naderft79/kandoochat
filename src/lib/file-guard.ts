// بررسی امضای فایل (magic bytes) — محتوای واقعی فایل را با MIME ادعایی کلاینت مقایسه می کند
// فقط ۱۶ بایت اول لازم است؛ استفاده: isMediaSignatureValid(Buffer.from(await file.slice(0, 16).arrayBuffer()), file.type)

type MediaFamily = "jpeg" | "png" | "webp" | "webm" | "mp4" | "ogg" | "mpeg" | "wav";

// خانواده فرمت برای هر MIME مجاز در آپلودها
const DECLARED_FAMILY: Record<string, MediaFamily> = {
  "image/jpeg": "jpeg",
  "image/png": "png",
  "image/webp": "webp",
  "video/webm": "webm",
  "audio/webm": "webm",
  "video/mp4": "mp4",
  "audio/mp4": "mp4",
  "audio/x-m4a": "mp4",
  "audio/m4a": "mp4",
  "audio/3gpp": "mp4",
  "audio/ogg": "ogg",
  "audio/mpeg": "mpeg",
  "audio/mp3": "mpeg",
  "audio/aac": "mpeg",
  "audio/wav": "wav",
};

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

// تشخیص خانواده فرمت از روی بایت های ابتدایی
function sniffFamily(head: Uint8Array): MediaFamily | null {
  if (head.length < 12) return null;
  const text = (from: number, to: number) => Buffer.from(head.subarray(from, to)).toString("ascii");

  if (head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) return "jpeg";
  if (PNG_SIGNATURE.every((b, i) => head[i] === b)) return "png";
  if (text(0, 4) === "RIFF") {
    if (text(8, 12) === "WEBP") return "webp";
    if (text(8, 12) === "WAVE") return "wav";
    return null;
  }
  // EBML header (WebM/Matroska)
  if (head[0] === 0x1a && head[1] === 0x45 && head[2] === 0xdf && head[3] === 0xa3) return "webm";
  // ftyp box (MP4/M4A/3GP)
  if (text(4, 8) === "ftyp") return "mp4";
  if (text(0, 4) === "OggS") return "ogg";
  // ID3 tag یا frame sync (MP3 / AAC ADTS)
  if (text(0, 3) === "ID3" || (head[0] === 0xff && (head[1] & 0xe0) === 0xe0)) return "mpeg";
  return null;
}

// آیا محتوای فایل با MIME اعلام شده هم خانواده است؟
export function isMediaSignatureValid(head: Uint8Array, declaredMime: string): boolean {
  const expected = DECLARED_FAMILY[declaredMime];
  return !!expected && sniffFamily(head) === expected;
}
