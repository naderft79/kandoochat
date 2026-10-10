"use client";

import { useState } from "react";
import { useSettingsSave, SaveButton, MessageBanner, SettingsCard, ToggleRow, NumberField } from "./shared";

type Props = {
  freeDailyMessageLimit: number;
  chatStartCostCoins: number;
  maxMessageLength: number;
  vipDailyMessageLimit: number;
  freeMessageCostCoins: number;
  chatRequireVerified: boolean;
  chatRequireMatch: boolean;
  maxConcurrentChats: number;
  showTypingStatus: boolean;
  showReadReceipt: boolean;
  allowDeleteMessage: boolean;
  messageRateLimitPerMin: number;
};

export default function ChatSettings(props: Props) {
  const { save, message, loading } = useSettingsSave();
  const [f, setF] = useState({
    freeDailyMessageLimit: String(props.freeDailyMessageLimit),
    chatStartCostCoins: String(props.chatStartCostCoins),
    maxMessageLength: String(props.maxMessageLength),
    vipDailyMessageLimit: String(props.vipDailyMessageLimit),
    freeMessageCostCoins: String(props.freeMessageCostCoins),
    chatRequireVerified: props.chatRequireVerified,
    chatRequireMatch: props.chatRequireMatch,
    maxConcurrentChats: String(props.maxConcurrentChats),
    showTypingStatus: props.showTypingStatus,
    showReadReceipt: props.showReadReceipt,
    allowDeleteMessage: props.allowDeleteMessage,
    messageRateLimitPerMin: String(props.messageRateLimitPerMin),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    save({
      freeDailyMessageLimit: parseInt(f.freeDailyMessageLimit),
      chatStartCostCoins: parseInt(f.chatStartCostCoins),
      maxMessageLength: parseInt(f.maxMessageLength),
      vipDailyMessageLimit: parseInt(f.vipDailyMessageLimit),
      freeMessageCostCoins: parseInt(f.freeMessageCostCoins),
      chatRequireVerified: f.chatRequireVerified,
      chatRequireMatch: f.chatRequireMatch,
      maxConcurrentChats: parseInt(f.maxConcurrentChats),
      showTypingStatus: f.showTypingStatus,
      showReadReceipt: f.showReadReceipt,
      allowDeleteMessage: f.allowDeleteMessage,
      messageRateLimitPerMin: parseInt(f.messageRateLimitPerMin),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <SettingsCard>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <NumberField label="محدودیت پیام روزانه (رایگان)" value={f.freeDailyMessageLimit} onChange={(v) => setF({ ...f, freeDailyMessageLimit: v })} hint="0 یعنی نامحدود" />
          <NumberField label="محدودیت پیام روزانه VIP" value={f.vipDailyMessageLimit} onChange={(v) => setF({ ...f, vipDailyMessageLimit: v })} hint="0 یعنی نامحدود" />
          <NumberField label="هزینه شروع چت جدید (سکه)" value={f.chatStartCostCoins} onChange={(v) => setF({ ...f, chatStartCostCoins: v })} />
          <NumberField label="هزینه ارسال پیام (سکه)" value={f.freeMessageCostCoins} onChange={(v) => setF({ ...f, freeMessageCostCoins: v })} />
          <NumberField label="حداکثر طول پیام" value={f.maxMessageLength} onChange={(v) => setF({ ...f, maxMessageLength: v })} />
          <NumberField label="حداکثر چت های همزمان" value={f.maxConcurrentChats} onChange={(v) => setF({ ...f, maxConcurrentChats: v })} hint="0 یعنی نامحدود" />
          <NumberField label="محدودیت پیام در دقیقه" value={f.messageRateLimitPerMin} onChange={(v) => setF({ ...f, messageRateLimitPerMin: v })} hint="0 یعنی بدون محدودیت" />
        </div>
        <div className="space-y-2 mt-4">
          <ToggleRow label="غیرفعال کردن چت برای کاربران تایید نشده" checked={f.chatRequireVerified} onChange={(v) => setF({ ...f, chatRequireVerified: v })} />
          <ToggleRow label="الزام تطابق قبل از چت" checked={f.chatRequireMatch} onChange={(v) => setF({ ...f, chatRequireMatch: v })} />
          <ToggleRow label="نمایش وضعیت تایپ کردن" checked={f.showTypingStatus} onChange={(v) => setF({ ...f, showTypingStatus: v })} />
          <ToggleRow label="نمایش تیک خوانده شدن پیام" checked={f.showReadReceipt} onChange={(v) => setF({ ...f, showReadReceipt: v })} />
          <ToggleRow label="اجازه حذف پیام برای فرستنده" checked={f.allowDeleteMessage} onChange={(v) => setF({ ...f, allowDeleteMessage: v })} />
        </div>
      </SettingsCard>
      <MessageBanner message={message} />
      <SaveButton loading={loading} />
    </form>
  );
}
