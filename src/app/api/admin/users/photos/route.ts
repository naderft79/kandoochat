// API مدیریت عکس کاربران توسط مدیر
import { NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadFile, deleteFile, safeExtension } from "@/lib/storage";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 10 * 1024 * 1024;
const MAX_GALLERY = 3;

// POST — آپلود عکس برای کاربر (پروفایل یا گالری)
export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const userId = formData.get("userId") as string | null;
    const type = (formData.get("type") as string) ?? "gallery";
    const replaceId = (formData.get("replaceId") as string) ?? null;
    const isProfile = type === "profile";

    if (!userId) {
      return NextResponse.json({ error: "شناسه کاربر لازم است" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "کاربر یافت نشد" }, { status: 404 });
    }

    if (!file) {
      return NextResponse.json({ error: "فایل یافت نشد" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "فرمت فایل مجاز نیست (jpg, png, webp)" }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "حداکثر حجم فایل ۱۰ مگابایت است" }, { status: 400 });
    }

    // حذف عکس قبلی در صورت جایگزینی
    if (replaceId) {
      const existing = await prisma.profilePhoto.findUnique({ where: { id: replaceId } });
      if (existing && existing.userId === userId) {
        await deleteFile(existing.url);
        await prisma.profilePhoto.delete({ where: { id: replaceId } });
      }
    }

    if (isProfile) {
      await prisma.profilePhoto.deleteMany({
        where: { userId, isProfile: true },
      });
    } else if (!replaceId) {
      const galleryCount = await prisma.profilePhoto.count({
        where: { userId, isProfile: false },
      });
      if (galleryCount >= MAX_GALLERY) {
        return NextResponse.json({ error: `حداکثر ${MAX_GALLERY} عکس در گالری مجاز است` }, { status: 400 });
      }
    }

    // ذخیره فایل — S3 در production، دیسک محلی در توسعه
    const ext = safeExtension(file.name, file.type);
    const prefix = isProfile ? "profile" : "gallery";
    const fileName = `${prefix}/${prefix}-${userId}-${Date.now()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadFile(fileName, buffer, file.type);

    const order = isProfile ? 0 : await prisma.profilePhoto.count({ where: { userId } });
    const photo = await prisma.profilePhoto.create({
      data: {
        userId,
        url,
        order,
        isProfile,
      },
    });

    console.log(`[admin/users/photos] admin ${admin.id} uploaded ${type} photo for user ${userId}: ${photo.id}`);
    return NextResponse.json({ ok: true, photo });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    console.error("[admin/users/photos POST] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

// DELETE — حذف عکس کاربر
export async function DELETE(request: Request) {
  try {
    const admin = await requireAdmin();
    const { searchParams } = new URL(request.url);
    const photoId = searchParams.get("id");
    const userId = searchParams.get("userId");

    if (!photoId || !userId) {
      return NextResponse.json({ error: "شناسه عکس و کاربر لازم است" }, { status: 400 });
    }

    const photo = await prisma.profilePhoto.findUnique({
      where: { id: photoId },
    });

    if (!photo || photo.userId !== userId) {
      return NextResponse.json({ error: "عکس یافت نشد" }, { status: 404 });
    }

    await deleteFile(photo.url);

    await prisma.profilePhoto.delete({
      where: { id: photoId },
    });

    console.log(`[admin/users/photos] admin ${admin.id} deleted photo ${photoId} for user ${userId}`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    console.error("[admin/users/photos DELETE] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
