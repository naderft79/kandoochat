// نوار بخش ویژه بالای صفحه خانه: حلقه افقی پروفایل های برگزیده
import Link from "next/link";
import Image from "next/image";
import { Sparkles } from "lucide-react";
import DefaultAvatar from "@/components/dashboard/DefaultAvatar";
import VerifiedBadge from "@/components/dashboard/VerifiedBadge";

export type FeaturedUser = { id: string; username: string; firstName: string; isVerified: boolean; photo: string | null };

export default function FeaturedRail({ users }: { users: FeaturedUser[] }) {
  if (!users.length) return null;
  return (
    <section aria-label="بخش ویژه" className="border-b border-ig-divider py-3">
      <h2 className="px-4 mb-2 flex items-center gap-1.5 text-sm font-black text-foreground">
        <Sparkles className="w-4 h-4" strokeWidth={2} aria-hidden />
        بخش ویژه
      </h2>
      <ul className="flex gap-4 overflow-x-auto px-4 pb-1">
        {users.map((u) => (
          <li key={u.id} className="shrink-0 w-[72px]">
            <Link href={`/profile/${u.username}`} className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform">
              <span className="w-[68px] h-[68px] rounded-full border-2 border-ig-blue p-0.5 flex">
                <span className="relative w-full h-full rounded-full overflow-hidden bg-ig-btn2 flex items-center justify-center">
                  {u.photo ? <Image src={u.photo} alt="" fill sizes="64px" className="object-cover" /> : <DefaultAvatar size={60} />}
                </span>
              </span>
              <span className="flex items-center gap-0.5 max-w-full text-xs text-foreground">
                <span className="truncate">{u.firstName}</span>
                {u.isVerified && <VerifiedBadge className="w-3 h-3 shrink-0" />}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
