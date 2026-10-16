// API تایید عکس های پروفایل و گالری توسط ادمین
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAction } from "@/lib/audit";
import { sendAdminMessage } from "@/lib/adminProfile";
import { getUserBrandName } from "@/lib/brand-server";

export async function GET(request: Request) {
  const user = await requireAdmin();

  const { searchParams } = new URL(request.url);
  const filter = searchParams.get("filter") || "all";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const profilePageSize = Math.min(250, Math.max(1, parseInt(searchParams.get("profilePageSize") || "250", 10)));
  const galleryPageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("galleryPageSize") || "50", 10)));

  const baseWhere = filter === "unverified"
    ? { isVerified: false, isRejected: false, isDeletedByUser: false }
    : filter === "verified"
    ? { isVerified: true, isDeletedByUser: false }
    : filter === "rejected"
    ? { isRejected: true, isDeletedByUser: false }
    : filter === "deleted"
    ? { isDeletedByUser: true }
    : { isDeletedByUser: false };

  const profileWhere = { ...baseWhere, isProfile: true };
  const galleryWhere = { ...baseWhere, isProfile: false };

  // اجرای همزمان: عکس های پروفایل صفحه بندی شده + آمار + عکس های گالری
  const [profilePhotos, profileTotal, galleryPhotos, galleryTotal, globalStats] = await Promise.all([
    // عکس های پروفایل صفحه بندی شده
    prisma.profilePhoto.findMany({
      where: profileWhere,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, username: true, gender: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * profilePageSize,
      take: profilePageSize,
    }),
    // تعداد کل عکس های پروفایل (با فیلتر فعلی)
    prisma.profilePhoto.count({ where: profileWhere }),
    // عکس های گالری (فقط صفحه فعلی — گروه بندی در حافظه)
    prisma.profilePhoto.findMany({
      where: galleryWhere,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, username: true, gender: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * galleryPageSize * 10,
      take: galleryPageSize * 10,
    }),
    // تعداد کل گالری (با فیلتر فعلی)
    prisma.profilePhoto.count({ where: galleryWhere }),
    // آمار کامل (بدون فیلتر) — استفاده از groupBy به جای بارگذاری همه رکوردها
    prisma.profilePhoto.groupBy({
      by: ["isVerified", "isRejected", "isProfile", "isDeletedByUser"],
      _count: true,
    }),
  ]);

  // گروه بندی گالری بر اساس کاربر
  const galleryByUser = new Map<string, { user: typeof galleryPhotos[number]["user"]; photos: typeof galleryPhotos }>();
  for (const photo of galleryPhotos) {
    const existing = galleryByUser.get(photo.userId);
    if (existing) {
      existing.photos.push(photo);
    } else {
      galleryByUser.set(photo.userId, { user: photo.user, photos: [photo] });
    }
  }

  const galleryGroups = Array.from(galleryByUser.entries()).map(([userId, data]) => ({
    userId,
    user: data.user,
    photos: data.photos.sort((a, b) => a.order - b.order),
  })).slice(0, galleryPageSize);

  // محاسبه آمار از groupBy
  const stats = {
    total: 0, unverified: 0, verified: 0, rejected: 0, deleted: 0,
    profileUnverified: 0, galleryUnverified: 0,
  };
  for (const g of globalStats) {
    if (g.isDeletedByUser) {
      stats.deleted += g._count;
      continue;
    }
    stats.total += g._count;
    if (g.isVerified) stats.verified += g._count;
    if (g.isRejected) stats.rejected += g._count;
    if (!g.isVerified && !g.isRejected) stats.unverified += g._count;
    if (!g.isVerified && !g.isRejected) {
      if (g.isProfile) stats.profileUnverified += g._count;
      else stats.galleryUnverified += g._count;
    }
  }

  return NextResponse.json({
    profilePhotos: profilePhotos.map((p) => ({
      id: p.id, url: p.url, isVerified: p.isVerified, isRejected: p.isRejected,
      createdAt: p.createdAt, user: p.user,
    })),
    galleryGroups: galleryGroups.map((g) => ({
      userId: g.userId, user: g.user,
      photos: g.photos.map((p) => ({
        id: p.id, url: p.url, isVerified: p.isVerified, isRejected: p.isRejected,
        order: p.order, createdAt: p.createdAt,
      })),
    })),
    stats: {
      totalProfile: profileTotal,
      unverifiedProfile: filter === "unverified" ? profileTotal : 0,
      totalGallery: galleryTotal,
      unverifiedGallery: filter === "unverified" ? galleryTotal : 0,
      profileTotal,
      galleryTotal: galleryGroups.length,
      page,
      profilePageSize,
      galleryPageSize,
      totalPages: Math.max(
        Math.ceil(profileTotal / profilePageSize),
        Math.ceil(galleryGroups.length / galleryPageSize)
      ),
      global: stats,
    },
  });
}

export async function PUT(request: Request) {
  const user = await requireAdmin();

  const { photoId, action, reason } = await request.json();
  if (!photoId || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "پارامتر نامعتبر" }, { status: 400 });
  }

  if (action === "approve") {
    const photo = await prisma.profilePhoto.update({
      where: { id: photoId },
      data: { isVerified: true, isRejected: false },
    });
    console.log(`[admin] photo ${photoId} approved by admin ${user.id}`);
    await logAction(user.id, "APPROVE_PHOTO", "PHOTO", photoId, photo.userId);
    return NextResponse.json({ ok: true, photo });
  } else {
    // reject — عکس حذف نمی شود، فقط isRejected=true می شود
    const photo = await prisma.profilePhoto.update({
      where: { id: photoId },
      data: { isVerified: false, isRejected: true },
    });
    console.log(`[admin] photo ${photoId} rejected by admin ${user.id}`);
    await logAction(user.id, "REJECT_PHOTO", "PHOTO", photoId, photo.userId);

    // ارسال پیام مدیریتی به کاربر با دلیل رد
    if (reason) {
      const photoType = photo.isProfile ? "عکس پروفایل" : "عکس گالری";
      const brandName = await getUserBrandName(photo.userId);
      const adminMsg = `سلام،\n\n${photoType} شما در ${brandName} بررسی شد و متاسفانه تایید نشد.\n\nدلیل رد شدن:\n${reason}\n\nلطفا با رعایت قوانین سایت، عکس جدید و بدون مشکل آپلود کنید تا تایید شود. در صورت داشتن سوال می توانید با پشتیبانی در ارتباط باشید.\n\nبا احترام،\nتیم مدیریت ${brandName}`;
      await sendAdminMessage(photo.userId, adminMsg);
    }

    return NextResponse.json({ ok: true, photo });
  }
}
