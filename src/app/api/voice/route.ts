// API آپلود پیام صوتی
import { NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { uploadFile, safeExtension } from "@/lib/storage";
import { isMediaSignatureValid } from "@/lib/file-guard";

const ALLOWED_TYPES = [
  "audio/webm", "audio/mp3", "audio/wav", "audio/ogg", "audio/mpeg",
  // فرمت هایی که وب ویو اندروید ممکن است تولید کند
  "audio/mp4", "audio/aac", "audio/3gpp", "audio/x-m4a", "audio/m4a",
];
const MAX_SIZE = 10 * 1024 * 1024; // ۱۰ مگابایت

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "فایل صوتی یافت نشد" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "فرمت صوتی مجاز نیست" }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "حداکثر حجم فایل صوتی ۱۰ مگابایت است" }, { status: 400 });
    }

    if (!isMediaSignatureValid(Buffer.from(await file.slice(0, 16).arrayBuffer()), file.type)) {
      return NextResponse.json({ error: "محتوای فایل با فرمت آن مطابقت ندارد" }, { status: 400 });
    }

    const ext = safeExtension(file.name, file.type);
    const fileName = `voice/${user.id}-${Date.now()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadFile(fileName, buffer, file.type);
    console.log(`[voice] user ${user.id} uploaded ${fileName}`);
    return NextResponse.json({ ok: true, url });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[voice] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
