// مدیریت کاربران: سبک اینستاگرام
import { Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { toPersianDigits } from "@/lib/format";
import { getAllSettings } from "@/lib/settings";
import { getCurrentUser } from "@/lib/auth";
import { canViewIp } from "@/lib/permissions";
import { lookupCountry } from "@/lib/geo";
import { getUserStatsMap } from "@/lib/user-stats";
import AdminUsersClient from "@/components/admin/AdminUsersClient";
import SpecialRegisterLink from "@/components/admin/SpecialRegisterLink";
import ExportButton from "@/components/admin/ExportButton";

export default async function AdminUsersPage() {
  const settings = await getAllSettings();
  const currentAdmin = await getCurrentUser();
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where: { role: "USER", deletedAt: null },
      include: {
        wallet: true,
        photos: { select: { id: true, url: true, isProfile: true }, where: { isDeletedByUser: false }, orderBy: { order: "asc" } },
        subscriptions: { where: { endsAt: { gt: new Date() } }, take: 1 },
        // دعوت کننده کاربر — برای نمایش «دعوت شده توسط» در لیست
        receivedReferral: { select: { referrer: { select: { phone: true, username: true } } } },
      },
      orderBy: [{ createdAt: "desc" }],
      take: 50,
    }),
    prisma.user.count({ where: { role: "USER", deletedAt: null } }),
  ]);

  const statsMap = await getUserStatsMap(users.map((u) => u.id));
  const usersWithSubscription = users.map(({ password: _password, receivedReferral, ...u }) => ({
    ...u,
    messageLockUntil: u.messageLockUntil ? u.messageLockUntil.toISOString() : null,
    lastIpAt: u.lastIpAt ? u.lastIpAt.toISOString() : null,
    lastIp: canViewIp(currentAdmin?.role) ? u.lastIp : null,
    lastCountry: lookupCountry(u.lastIp),
    deletedAt: u.deletedAt ? u.deletedAt.toISOString() : null,
    deletePurgeAfter: u.deletePurgeAfter ? u.deletePurgeAfter.toISOString() : null,
    hasSubscription: u.subscriptions.length > 0,
    subscription: u.subscriptions[0]
      ? { startsAt: u.subscriptions[0].startsAt.toISOString(), endsAt: u.subscriptions[0].endsAt.toISOString() }
      : null,
    referredBy: receivedReferral?.referrer
      ? { phone: receivedReferral.referrer.phone, username: receivedReferral.referrer.username }
      : null,
    stats: statsMap[u.id],
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="lux-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-black text-[#e8e8e8] flex items-center gap-2">
                <Users className="w-5 h-5 text-[#d4af37]" />
                مدیریت کاربران
              </h1>
              <p className="text-[#888] mt-1 text-xs">
                {toPersianDigits(total)} کاربر — جدیدترین در ابتدا
              </p>
            </div>
            <ExportButton type="users" label="خروجی CSV" />
          </div>
        </div>

        <SpecialRegisterLink slug={settings.specialRegisterSlug} />
      </div>

      <AdminUsersClient
        initialUsers={usersWithSubscription}
        total={total}
        hasMore={total > users.length}
        canSetRole={currentAdmin?.role === "SUPER_ADMIN"}
        canSeeIp={canViewIp(currentAdmin?.role)}
      />
    </div>
  );
}
