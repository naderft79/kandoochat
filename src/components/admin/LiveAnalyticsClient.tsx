"use client";

// آنالیز لحظه ای افراد — تب های زنده پنل مدیریت
import { useState } from "react";
import {
  MessageCircle,
  UserPlus,
  Circle,
  Image,
  Video,
  Mic,
  Coins,
  ArrowLeftRight,
  Banknote,
  CreditCard,
  Activity,
  CircleDot,
} from "lucide-react";
import LiveChatClient from "@/components/admin/LiveChatClient";
import LivePhotosClient from "@/components/admin/LivePhotosClient";
import LiveStoriesClient from "@/components/admin/LiveStoriesClient";
import LiveFeedClient from "@/components/admin/LiveFeedClient";

type TabId =
  | "chat"
  | "liveStories"
  | "newUsers"
  | "onlineUsers"
  | "livePhotos"
  | "liveVideos"
  | "liveVoice"
  | "coinPurchases"
  | "coinTransfers"
  | "coinWithdrawals"
  | "newSubscriptions";

const tabs: { id: TabId; label: string; icon: typeof MessageCircle }[] = [
  { id: "chat", label: "چت زنده", icon: MessageCircle },
  { id: "liveStories", label: "استوری زنده", icon: CircleDot },
  { id: "livePhotos", label: "عکس زنده", icon: Image },
  { id: "liveVideos", label: "فیلم زنده", icon: Video },
  { id: "liveVoice", label: "ویس زنده", icon: Mic },
  { id: "newUsers", label: "اعضای جدید", icon: UserPlus },
  { id: "onlineUsers", label: "لیست آنلاین ها", icon: Circle },
  { id: "coinPurchases", label: "خرید سکه", icon: Coins },
  { id: "coinTransfers", label: "انتقال سکه", icon: ArrowLeftRight },
  { id: "coinWithdrawals", label: "برداشت سکه", icon: Banknote },
  { id: "newSubscriptions", label: "خرید اشتراک جدید", icon: CreditCard },
];


export default function LiveAnalyticsClient() {
  const [activeTab, setActiveTab] = useState<TabId>("chat");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-black text-[#e8e8e8] flex items-center gap-2">
          <Activity className="w-5 h-5 text-[#d4af37]" />
          آنالیز لحظه ای
        </h1>
      </div>

      {/* تب ها */}
      <div className="flex gap-1 overflow-x-auto no-scrollbar border-b border-[rgba(212,175,55,0.1)] pb-px">
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-xs font-bold whitespace-nowrap transition-all ${
                active
                  ? "text-[#d4af37] border-b-2 border-[#d4af37] -mb-px"
                  : "text-[#888] hover:text-[#d4af37]"
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* محتوای تب فعال — فقط تب فعال mount می شود */}
      <div>
        {activeTab === "chat" && (
          // چت زنده و عکس زنده همزمان — در RTL ستون اول سمت راست می افتد
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
            <section>
              <h2 className="text-sm font-black text-[#e8e8e8] mb-3 flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4 text-[#d4af37]" />
                چت زنده
              </h2>
              <LiveChatClient compact />
            </section>
            <section>
              <h2 className="text-sm font-black text-[#e8e8e8] mb-3 flex items-center gap-1.5">
                <Image className="w-4 h-4 text-[#d4af37]" />
                عکس زنده
              </h2>
              <LivePhotosClient compact />
            </section>
          </div>
        )}
        {activeTab === "liveStories" && <LiveStoriesClient />}
        {activeTab === "livePhotos" && <LivePhotosClient />}
        {activeTab === "onlineUsers" && <LiveFeedClient channel="onlineUsers" emptyLabel="در حال حاضر کاربری آنلاین نیست" />}
        {activeTab === "newUsers" && <LiveFeedClient channel="newUsers" emptyLabel="هنوز عضو جدیدی ثبت نشده" />}
        {activeTab === "liveVideos" && <LiveFeedClient channel="liveVideos" emptyLabel="پیام ویدیویی ثبت نشده" />}
        {activeTab === "liveVoice" && <LiveFeedClient channel="liveVoice" emptyLabel="پیام صوتی ثبت نشده" />}
        {activeTab === "coinPurchases" && <LiveFeedClient channel="coinPurchases" emptyLabel="خریدی ثبت نشده" />}
        {activeTab === "coinTransfers" && <LiveFeedClient channel="coinTransfers" emptyLabel="انتقال سکه ای ثبت نشده" />}
        {activeTab === "coinWithdrawals" && <LiveFeedClient channel="coinWithdrawals" emptyLabel="درخواست برداشتی ثبت نشده" />}
        {activeTab === "newSubscriptions" && <LiveFeedClient channel="newSubscriptions" emptyLabel="اشتراک جدیدی ثبت نشده" />}
      </div>
    </div>
  );
}
