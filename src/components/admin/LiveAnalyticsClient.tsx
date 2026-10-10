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
  Loader2,
  Activity,
  CircleDot,
} from "lucide-react";
import LiveChatClient from "@/components/admin/LiveChatClient";
import LivePhotosClient from "@/components/admin/LivePhotosClient";
import LiveStoriesClient from "@/components/admin/LiveStoriesClient";

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

function ComingSoon({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Loader2 className="w-8 h-8 text-[rgba(212,175,55,0.3)] mb-3 animate-spin" />
      <p className="text-sm font-bold text-[#888]">{label}</p>
      <p className="text-xs text-[#666] mt-1">بزودی راه اندازی می شود</p>
    </div>
  );
}

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
        {activeTab === "chat" && <LiveChatClient />}
        {activeTab === "liveStories" && <LiveStoriesClient />}
        {activeTab === "livePhotos" && <LivePhotosClient />}
        {activeTab === "newUsers" && <ComingSoon label="اعضای جدید" />}
        {activeTab === "liveVideos" && <ComingSoon label="فیلم زنده" />}
        {activeTab === "liveVoice" && <ComingSoon label="ویس زنده" />}
        {activeTab === "coinPurchases" && <ComingSoon label="خرید سکه" />}
        {activeTab === "coinTransfers" && <ComingSoon label="انتقال سکه" />}
        {activeTab === "coinWithdrawals" && <ComingSoon label="برداشت سکه" />}
        {activeTab === "newSubscriptions" && <ComingSoon label="خرید اشتراک جدید" />}
      </div>
    </div>
  );
}
