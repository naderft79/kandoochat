// مدیریت اطلاعیه های سراسری — بنر قابل بستن بالای پنل کاربر
import { prisma } from "@/lib/prisma";
import { Megaphone } from "lucide-react";
import AnnouncementsClient from "@/components/admin/AnnouncementsClient";

export const dynamic = "force-dynamic";

// آیا اطلاعیه الان در بازه نمایش است؟
function isLive(a: { isActive: boolean; startsAt: Date; endsAt: Date | null }): boolean {
  const now = Date.now();
  return a.isActive && a.startsAt.getTime() <= now && (!a.endsAt || a.endsAt.getTime() > now);
}

export default async function AdminAnnouncementsPage() {
  const items = await prisma.announcement.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <div className="lux-card p-5">
        <h1 className="text-lg font-black text-[#e8e8e8] flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-[#d4af37]" />
          اطلاعیه های سراسری
        </h1>
        <p className="text-[#888] mt-1 text-xs">
          بنری که بالای پنل کاربر به همه نمایش داده می شود و کاربر می تواند آن را ببندد
        </p>
      </div>

      <AnnouncementsClient
        items={items.map((a) => ({
          id: a.id,
          title: a.title,
          body: a.body,
          type: a.type,
          isActive: a.isActive,
          startsAt: a.startsAt.toISOString(),
          endsAt: a.endsAt?.toISOString() ?? null,
          createdAt: a.createdAt.toISOString(),
          live: isLive(a),
        }))}
      />
    </div>
  );
}
