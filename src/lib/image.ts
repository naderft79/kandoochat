// بهینه سازی عکس های آپلودی — چرخش بر اساس EXIF، کوچک کردن ابعاد خیلی بزرگ و فشرده سازی ملایم
// کیفیت بصری حفظ می شود؛ در صورت خطا (فایل خراب/فرمت ناشناخته) همان بافر اصلی برمی گردد
import sharp from "sharp";

// حداکثر ضلع تصویر — برای نمایش در اپ و وب کافی است و حجم را به شدت کم می کند
const MAX_EDGE = 2048;

export async function optimizeImage(
  buffer: Buffer,
  mimeType: string
): Promise<{ buffer: Buffer; type: string }> {
  try {
    const img = sharp(buffer)
      .rotate() // اعمال چرخش EXIF تا عکس وارونه ذخیره نشود
      .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true });

    if (mimeType === "image/jpeg") {
      return { buffer: await img.jpeg({ quality: 90, mozjpeg: true }).toBuffer(), type: mimeType };
    }
    if (mimeType === "image/webp") {
      return { buffer: await img.webp({ quality: 92 }).toBuffer(), type: mimeType };
    }
    if (mimeType === "image/png") {
      // PNG بدون افت کیفیت است — فقط فشرده سازی بهتر
      return { buffer: await img.png({ compressionLevel: 9 }).toBuffer(), type: mimeType };
    }
    return { buffer, type: mimeType };
  } catch {
    return { buffer, type: mimeType };
  }
}
