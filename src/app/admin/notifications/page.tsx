"use client";

// پنل نوتیفیکیشن های ادمین — مشاهده و فیلتر
import { useEffect, useState, useCallback } from "react";
import { Bell, Filter, ChevronRight, ChevronLeft } from "lucide-react";
import { toPersianDigits, formatLastSeen } from "@/lib/format";

type NotificationItem = {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
  };
};

const TYPE_LABELS: Record<string, string> = {
  LIKE: "لایک",
  SUPER_LIKE: "سوپر لایک",
  MATCH: "مچ",
  GIFT_RECEIVED: "هدیه",
  REQUEST_RECEIVED: "درخواست سکه",
  REQUEST_APPROVED: "تایید درخواست",
  REQUEST_REJECTED: "رد درخواست",
  SUBSCRIPTION_ENDING: "پایان اشتراک",
  BOOST_ACTIVATED: "بوست",
  ADMIN_BROADCAST: "پیام ادمین",
  PROFILE_VIEW: "بازدید پروفایل",
};

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filterType, setFilterType] = useState("");
  const [filterRead, setFilterRead] = useState("");

  const fetchNotifications = useCallback(async (p: number) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p) });
    if (filterType) params.set("type", filterType);
    if (filterRead) params.set("isRead", filterRead);
    try {
      const res = await fetch(`/api/admin/notifications?${params}`);
      const data = await res.json();
      if (res.ok) {
        setNotifications(data.notifications);
        setTotal(data.total);
        setTotalPages(data.totalPages);
        setPage(data.page);
      }
    } catch {
      // خطای شبکه
    } finally {
      setLoading(false);
    }
  }, [filterType, filterRead]);

  useEffect(() => {
    fetchNotifications(1);
  }, [fetchNotifications]);

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl lux-btn-gold flex items-center justify-center">
          <Bell className="w-5 h-5 text-[#0d0d0d]" />
        </div>
        <div>
          <h1 className="text-lg font-black text-[#e8e8e8]">نوتیفیکیشن ها</h1>
          <p className="text-xs text-[#888]">{toPersianDigits(total)} نوتیفیکیشن</p>
        </div>
      </div>

      {/* فیلترها */}
      <div className="flex flex-wrap gap-2 mb-4">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 rounded-xl bg-[#0d0d0d] border border-[rgba(212,175,55,0.15)] text-xs font-bold text-[#e8e8e8] outline-none focus:border-[rgba(212,175,55,0.4)]"
        >
          <option value="">همه انواع</option>
          {Object.entries(TYPE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <select
          value={filterRead}
          onChange={(e) => setFilterRead(e.target.value)}
          className="px-3 py-2 rounded-xl bg-[#0d0d0d] border border-[rgba(212,175,55,0.15)] text-xs font-bold text-[#e8e8e8] outline-none focus:border-[rgba(212,175,55,0.4)]"
        >
          <option value="">همه</option>
          <option value="false">خوانده نشده</option>
          <option value="true">خوانده شده</option>
        </select>
      </div>

      {/* لیست */}
      {loading ? (
        <div className="text-center py-10">
          <p className="text-sm text-[#888]">در حال بارگذاری...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="lux-card p-8 text-center">
          <Filter className="w-8 h-8 text-[rgba(212,175,55,0.3)] mx-auto mb-2" strokeWidth={1.5} />
          <p className="text-sm text-[#888]">نوتیفیکیشنی یافت نشد</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`lux-card p-3 flex items-start gap-3 ${
                  n.isRead ? "" : "border-[rgba(212,175,55,0.3)]"
                }`}
              >
                <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${n.isRead ? "bg-[#555]" : "bg-[#d4af37]"}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-[#e8e8e8]">{n.title}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[rgba(212,175,55,0.06)] text-[#d4af37] font-bold">
                      {TYPE_LABELS[n.type] || n.type}
                    </span>
                  </div>
                  <p className="text-xs text-[#bbb] leading-5 mb-1">{n.body}</p>
                  <div className="flex items-center gap-2 text-[10px] text-[#888]">
                    <span>کاربر: {n.user.firstName} {n.user.lastName}</span>
                    <span>·</span>
                    <span>{formatLastSeen(new Date(n.createdAt))}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* صفحه بندی */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                onClick={() => fetchNotifications(page - 1)}
                disabled={page <= 1}
                className="p-2 rounded-lg lux-card disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4 text-[#d4af37]" />
              </button>
              <span className="text-xs font-bold text-[#e8e8e8]">
                {toPersianDigits(page)} از {toPersianDigits(totalPages)}
              </span>
              <button
                onClick={() => fetchNotifications(page + 1)}
                disabled={page >= totalPages}
                className="p-2 rounded-lg lux-card disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4 text-[#d4af37]" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
