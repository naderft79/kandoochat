// صفحه لندینگ عمومی — پروفایل های واقعی تایید شده + قیمت گذاری زنده از تنظیمات
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getAllSettings } from "@/lib/settings";
import LandingClient from "@/components/landing/LandingClient";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const [session, settings, userCount, profiles] = await Promise.all([
    getSession(),
    getAllSettings(),
    prisma.user.count({ where: { isActive: true, role: "USER" } }),
    prisma.user.findMany({
      where: {
        isActive: true,
        role: "USER",
        isVerified: true,
        deletedAt: null,
        photos: { some: { isRejected: false, isDeletedByUser: false } },
      },
      orderBy: { lastSeen: "desc" },
      take: 8,
      select: {
        id: true,
        firstName: true,
        gender: true,
        age: true,
        city: true,
        province: true,
        job: true,
        height: true,
        photos: {
          where: { isRejected: false, isDeletedByUser: false },
          orderBy: [{ isProfile: "desc" }, { order: "asc" }],
          take: 1,
          select: { url: true },
        },
      },
    }),
  ]);

  return (
    <LandingClient
      profiles={profiles}
      userCount={userCount}
      isLoggedIn={!!session}
      subscriptionPrice={settings.subscriptionPrice}
      coinValue={settings.coinValue}
    />
  );
}
