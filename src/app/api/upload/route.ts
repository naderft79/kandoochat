// API آپلود عکس پروفایل و عکس در چت
import { NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { uploadFile, safeExtension } from "@/lib/storage";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm"];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // ۱۰ مگابایت
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // ۵۰ مگابایت

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "فایل یافت نشد" }, { status: 400 });
    }

    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
    const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);
    if (!isImage && !isVideo) {
      return NextResponse.json({ error: "فرمت فایل مجاز نیست (jpg, png, webp, mp4, webm)" }, { status: 400 });
    }

    const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
    if (file.size > maxSize) {
      return NextResponse.json({ error: isVideo ? "حداکثر حجم ویدیو ۵۰ مگابایت است" : "حداکثر حجم عکس ۱۰ مگابایت است" }, { status: 400 });
    }

    // ذخیره در S3 یا دیسک محلی
    const ext = safeExtension(file.name, file.type);
    const fileName = `${user.id}-${Date.now()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadFile(fileName, buffer, file.type);
    console.log(`[upload] user ${user.id} uploaded ${fileName}`);
    return NextResponse.json({ ok: true, url });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[upload] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
