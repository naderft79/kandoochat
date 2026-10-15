// API مدیریت عکس های پروفایل — آپلود، حذف، مرتب سازی
import { NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadFile, deleteFile, safeExtension } from "@/lib/storage";
import { detectFaces, detectNsfw } from "@/lib/face";
import { isMediaSignatureValid } from "@/lib/file-guard";
import { optimizeImage } from "@/lib/image";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 50 * 1024 * 1024;
const MAX_GALLERY = 3;

// GET — لیست عکس های کاربر
export async function GET() {
  try {
    const user = await requireUser();
    const photos = await prisma.profilePhoto.findMany({
      where: { userId: user.id, isRejected: false, isDeletedByUser: false },
      orderBy: { order: "asc" },
    });
    return NextResponse.json({ photos });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

// POST — آپلود عکس جدید
export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const type = (formData.get("type") as string) ?? "gallery";
    const isProfile = type === "profile";

    if (!file) {
      return NextResponse.json({ error: "فایل یافت نشد" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "فرمت فایل مجاز نیست (jpg, png, webp)" }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "حجم عکس بیش از حد مجاز است" }, { status: 400 });
    }

    if (!isMediaSignatureValid(Buffer.from(await file.slice(0, 16).arrayBuffer()), file.type)) {
      return NextResponse.json({ error: "محتوای فایل با فرمت آن مطابقت ندارد" }, { status: 400 });
    }

    if (!isProfile) {
      // حداکثر 3 عکس گالری
      const galleryCount = await prisma.profilePhoto.count({
        where: { userId: user.id, isProfile: false, isRejected: false, isDeletedByUser: false },
      });
      if (galleryCount >= MAX_GALLERY) {
        return NextResponse.json({ error: `حداکثر ${MAX_GALLERY} عکس در گالری مجاز است` }, { status: 400 });
      }
    }

    // بهینه سازی و تشخیص چهره قبل از ذخیره — در production اجباری است؛ عکس بدون چهره یا سرویس از کارافتاده پذیرفته نمی شود
    const optimized = await optimizeImage(Buffer.from(await file.arrayBuffer()), file.type);
    const faceResult = await detectFaces(optimized.buffer, optimized.type);

    if (faceResult === null) {
      // هر وقت سرویس چهره پیکربندی شده (لوکال یا production) آپلود بدون بررسی انجام نمی شود
      if (process.env.NODE_ENV === "production" || process.env.FACE_DETECTOR_URL) {
        return NextResponse.json(
          { error: "سرویس بررسی عکس موقتا در دسترس نیست؛ چند دقیقه بعد دوباره تلاش کنید" },
          { status: 503 }
        );
      }
    } else if (faceResult.faces === 0) {
      return NextResponse.json(
        { error: "چهره ای در این عکس تشخیص داده نشد. لطفا عکسی آپلود کنید که چهره شما در آن مشخص باشد" },
        { status: 400 }
      );
    } else if (faceResult.faces > 1) {
      // عکس های پروفایل و گالری باید تکنفره باشند
      return NextResponse.json(
        { error: "عکس باید تکنفره باشد و فقط چهره خودتان در آن باشد" },
        { status: 400 }
      );
    } else if (faceResult.score < 0.6) {
      return NextResponse.json(
        { error: "کیفیت عکس برای تشخیص چهره کافی نیست. لطفا عکس واضح تری از چهره خودتان آپلود کنید" },
        { status: 400 }
      );
    }

    // رد عکس های خیلی تار — حساسیت کم؛ فقط وقتی سرویس امتیاز وضوح بفرستد اعمال می شود
    if (faceResult !== null && typeof faceResult.sharpness === "number" && faceResult.sharpness < 50) {
      return NextResponse.json(
        { error: "عکس تار یا بی کیفیت است. لطفا عکس واضح تری آپلود کنید" },
        { status: 400 }
      );
    }

    // رد عکس های لخت و بسیار سکسی — فقط وقتی موتور NSFW پاسخ بدهد اعمال می شود
    const nsfw = await detectNsfw(optimized.buffer, optimized.type);
    if (nsfw?.nsfw) {
      return NextResponse.json(
        { error: "این عکس با قوانین محتوایی سایت مغایرت دارد. لطفا عکس مناسب تری انتخاب کنید" },
        { status: 400 }
      );
    }

    // ذخیره فایل — S3 در production، دیسک محلی در توسعه
    const ext = safeExtension(file.name, file.type);
    const prefix = isProfile ? "profile" : "gallery";
    const fileName = `${prefix}/${prefix}-${user.id}-${Date.now()}.${ext}`;
    const url = await uploadFile(fileName, optimized.buffer, optimized.type);

    // ثبت در دیتابیس — برای عکس پروفایل، حذف نرم عکس های قبلی و ایجاد رکورد جدید در یک تراکنش
    const order = isProfile ? 0 : await prisma.profilePhoto.count({ where: { userId: user.id, isDeletedByUser: false } });
    let photo;
    try {
      photo = await prisma.$transaction(async (tx) => {
        if (isProfile) {
          // فقط یک عکس پروفایل فعال — حذف نرم عکس های قبلی (حتی در انتظار تایید)
          await tx.profilePhoto.updateMany({
            where: { userId: user.id, isProfile: true, isDeletedByUser: false },
            data: { isDeletedByUser: true },
          });
        }
        return tx.profilePhoto.create({
          data: {
            userId: user.id,
            url,
            order,
            isProfile,
            isVerified: false,
          },
        });
      });
    } catch (txErr) {
      // اگر تراکنش شکست خورد، فایل آپلود شده یتیم نماند
      await deleteFile(url).catch(() => {});
      throw txErr;
    }

    console.log(`[profile/photos] user ${user.id} uploaded ${type} photo ${photo.id}`);
    return NextResponse.json({ ok: true, photo });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[profile/photos] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

// DELETE — حذف عکس
export async function DELETE(request: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const photoId = searchParams.get("id");
    const type = searchParams.get("type");

    if (type === "profile") {
      // حذف نرم همه عکس های پروفایل کاربر — کاربر مالک عکس خودش است حتی اگر در انتظار تایید باشد
      const result = await prisma.profilePhoto.updateMany({
        where: { userId: user.id, isProfile: true, isDeletedByUser: false },
        data: { isDeletedByUser: true },
      });

      console.log(`[profile/photos] user ${user.id} deleted ${result.count} profile photo(s)`);
      return NextResponse.json({ ok: true });
    }

    if (!photoId) {
      return NextResponse.json({ error: "شناسه عکس لازم است" }, { status: 400 });
    }

    const photo = await prisma.profilePhoto.findUnique({
      where: { id: photoId },
    });

    if (!photo || photo.userId !== user.id) {
      return NextResponse.json({ error: "عکس یافت نشد" }, { status: 404 });
    }

    // حذف نرم — علامت گذاری به عنوان حذف شده توسط کاربر
    await prisma.profilePhoto.update({
      where: { id: photoId },
      data: { isDeletedByUser: true },
    });

    console.log(`[profile/photos] user ${user.id} soft-deleted photo ${photoId}`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[profile/photos DELETE] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
