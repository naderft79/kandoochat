// صفحه پاسخ به تیکت — پنل ادمین
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import TicketPanel from "@/components/admin/TicketPanel";

export default async function AdminTicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/tickets"
          className="p-2 rounded-lg hover:bg-[rgba(212,175,55,0.08)] transition-colors"
        >
          <ArrowRight className="w-5 h-5 text-[#d4af37]" />
        </Link>
        <h1 className="text-lg font-black text-[#e8e8e8]">پاسخ به تیکت</h1>
      </div>
      <TicketPanel ticketId={id} />
    </div>
  );
}
