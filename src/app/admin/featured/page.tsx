// صفحه مدیریت بخش ویژه: لیست انتظار و کاربران تایید شده
import { Sparkles } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDateTime, toPersianDigits } from "@/lib/format";
import FeaturedReviewClient from "./FeaturedReviewClient";

export default async function AdminFeaturedPage() {
  const [pending, approved] = await Promise.all([
    prisma.featuredListing.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      include: { user: { select: { id: true, firstName: true, lastName: true, username: true, city: true } } },
    }),
    prisma.featuredListing.findMany({
      where: { status: "APPROVED" },
      orderBy: { approvedAt: "desc" },
      take: 100,
      include: { user: { select: { id: true, firstName: true, lastName: true, username: true, city: true } } },
    }),
  ]);

  const toItem = (l: (typeof pending)[number], date: Date | null) => ({
    id: l.id,
    userId: l.user.id,
    name: `${l.user.firstName} ${l.user.lastName}`,
    username: l.user.username,
    city: l.user.city,
    date: date ? formatDateTime(date) : "",
  });

  return (
    <div className="space-y-6">
      <div className="lux-card p-5">
        <h1 className="text-lg font-black text-[#e8e8e8] flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#d4af37]" />
          بخش ویژه
        </h1>
        <p className="text-[#888] mt-1 text-xs">
          {toPersianDigits(pending.length)} درخواست در انتظار · {toPersianDigits(approved.length)} کاربر در بخش ویژه
        </p>
      </div>
      <FeaturedReviewClient pending={pending.map((l) => toItem(l, l.createdAt))} approved={approved.map((l) => toItem(l, l.approvedAt))} />
    </div>
  );
}
