// صفحه لایک های دریافتی — کاربران ویژه هویت کامل را می بینند؛ کاربران رایگان فقط تعداد و عکس بلرشده
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { hasActiveSubscription } from "@/lib/finance";
import LikesClient, { type LikeItem } from "@/components/dashboard/LikesClient";

export default async function LikesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const premium = await hasActiveSubscription(user.id);

  const photoSelect = {
    where: { isRejected: false, isDeletedByUser: false },
    orderBy: [{ isProfile: "desc" as const }, { order: "asc" as const }],
    take: 1,
    select: { url: true },
  };

  const [likes, total, superTotal] = await Promise.all([
    prisma.like.findMany({
      where: { receiverId: user.id },
      orderBy: { createdAt: "desc" },
      take: 60,
      select: {
        id: true,
        type: true,
        isMatched: true,
        createdAt: true,
        sender: {
          select: {
            id: true,
            firstName: true,
            username: true,
            age: true,
            city: true,
            gender: true,
            isVerified: true,
            isOnline: true,
            photos: photoSelect,
          },
        },
      },
    }),
    prisma.like.count({ where: { receiverId: user.id } }),
    prisma.like.count({ where: { receiverId: user.id, type: "SUPER_LIKE" } }),
  ]);

  // برای کاربر رایگان هویت فرستنده اصلاً به کلاینت ارسال نمی شود — فقط id لایک برای عکس بلر
  const items: LikeItem[] = likes.map((l) =>
    premium
      ? {
          id: l.id,
          type: l.type,
          isMatched: l.isMatched,
          createdAt: l.createdAt.toISOString(),
          sender: {
            id: l.sender.id,
            firstName: l.sender.firstName,
            username: l.sender.username,
            age: l.sender.age,
            city: l.sender.city,
            gender: l.sender.gender,
            isVerified: l.sender.isVerified,
            isOnline: l.sender.isOnline,
            photoUrl: l.sender.photos[0]?.url ?? null,
          },
        }
      : { id: l.id, type: l.type, isMatched: l.isMatched, createdAt: l.createdAt.toISOString() }
  );

  return <LikesClient premium={premium} items={items} total={total} superTotal={superTotal} />;
}
