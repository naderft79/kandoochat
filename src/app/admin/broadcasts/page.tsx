// صفحه پیام گروهی ادمین
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/format";
import { Megaphone } from "lucide-react";
import BroadcastForm from "@/components/admin/BroadcastForm";

export default async function AdminBroadcastsPage() {
  const broadcasts = await prisma.notification.findMany({
    where: { type: "ADMIN_BROADCAST" },
    include: {
      user: { select: { firstName: true, lastName: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return (
    <div className="space-y-6">
      <div className="lux-card p-5">
        <h1 className="text-lg font-black text-[#e8e8e8] flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-[#d4af37]" />
          پیام گروهی
        </h1>
        <p className="text-[#888] mt-1 text-xs">
          ارسال نوتیفیکیشن به همه کاربران
        </p>
      </div>

      <BroadcastForm />

      {broadcasts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-[#d4af37]">تاریخچه پیام ها</h2>
          {broadcasts.map((b) => (
            <div key={b.id} className="lux-card p-4">
              <p className="text-sm font-bold text-[#e8e8e8]">{b.title}</p>
              <p className="text-sm text-[#bbb] mt-1">{b.body}</p>
              <p className="text-xs text-[#888] mt-2">
                {formatDateTime(b.createdAt)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
