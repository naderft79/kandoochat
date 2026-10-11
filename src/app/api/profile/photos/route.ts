// API مدیریت عکس های پروفایل — آپلود، حذف، مرتب سازی
import { NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadFile, deleteFile, safeExtension } from "@/lib/storage";
import { detectFaces } from "@/lib/face";
import { isMediaSignatureValid } from "@/lib/file-guard";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 10 * 1024 * 1024;
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
      return NextResponse.json({ error: "حداکثر حجم فایل ۱۰ مگابایت است" }, { status: 400 });
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

    // تشخیص چهره قبل از ذخیره — اگر سرویس فعال باشد، عکس بدون چهره پذیرفته نمی شود
    const buffer = Buffer.from(await file.arrayBuffer());
    const faceResult = await detectFaces(buffer, file.type);

    if (faceResult !== null) {
      if (faceResult.faces === 0) {
        return NextResponse.json(
          { error: "چهره ای در این عکس تشخیص داده نشد. لطفا عکسی آپلود کنید که چهره شما در آن مشخص باشد" },
          { status: 400 }
        );
      }
      if (faceResult.score < 0.6) {
        return NextResponse.json(
          { error: "کیفیت عکس برای تشخیص چهره کافی نیست. لطفا عکس واضح تری از چهره خودتان آپلود کنید" },
          { status: 400 }
        );
      }
    }

    // ذخیره فایل — S3 در production، دیسک محلی در توسعه
    const ext = safeExtension(file.name, file.type);
    const prefix = isProfile ? "profile" : "gallery";
    const fileName = `${prefix}/${prefix}-${user.id}-${Date.now()}.${ext}`;
    const url = await uploadFile(fileName, buffer, file.type);

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
