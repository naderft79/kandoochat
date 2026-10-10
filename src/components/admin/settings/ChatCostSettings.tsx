"use client";

import { useState } from "react";
import { useSettingsSave, SaveButton, MessageBanner, SettingsCard, ToggleRow, NumberField } from "./shared";

type Props = {
  chatOpenCostMale: number;
  chatOpenFreeFemale: boolean;
  chatOpenVipDiscount: number;
  chatOpenSamePersonCost: number;
  chatOpenRefundNoReply: boolean;
  chatOpenRefundWaitHours: number;
  chatOpenVipUserCost: number;
  chatOpenFirstFreeDaily: boolean;
  chatUnlimitedDailyCost: number;
  chatVideoCostCoins: number;
  chatOpenShowCostBefore: boolean;
  chatOpenRefundDisabled: boolean;
};

export default function ChatCostSettings(props: Props) {
  const { save, message, loading } = useSettingsSave();
  const [f, setF] = useState({
    chatOpenCostMale: String(props.chatOpenCostMale),
    chatOpenFreeFemale: props.chatOpenFreeFemale,
    chatOpenVipDiscount: String(props.chatOpenVipDiscount),
    chatOpenSamePersonCost: String(props.chatOpenSamePersonCost),
    chatOpenRefundNoReply: props.chatOpenRefundNoReply,
    chatOpenRefundWaitHours: String(props.chatOpenRefundWaitHours),
    chatOpenVipUserCost: String(props.chatOpenVipUserCost),
    chatOpenFirstFreeDaily: props.chatOpenFirstFreeDaily,
    chatUnlimitedDailyCost: String(props.chatUnlimitedDailyCost),
    chatVideoCostCoins: String(props.chatVideoCostCoins),
    chatOpenShowCostBefore: props.chatOpenShowCostBefore,
    chatOpenRefundDisabled: props.chatOpenRefundDisabled,
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    save({
      chatOpenCostMale: parseInt(f.chatOpenCostMale),
      chatOpenFreeFemale: f.chatOpenFreeFemale,
      chatOpenVipDiscount: parseInt(f.chatOpenVipDiscount),
      chatOpenSamePersonCost: parseInt(f.chatOpenSamePersonCost),
      chatOpenRefundNoReply: f.chatOpenRefundNoReply,
      chatOpenRefundWaitHours: parseInt(f.chatOpenRefundWaitHours),
      chatOpenVipUserCost: parseInt(f.chatOpenVipUserCost),
      chatOpenFirstFreeDaily: f.chatOpenFirstFreeDaily,
      chatUnlimitedDailyCost: parseInt(f.chatUnlimitedDailyCost),
      chatVideoCostCoins: parseInt(f.chatVideoCostCoins),
      chatOpenShowCostBefore: f.chatOpenShowCostBefore,
      chatOpenRefundDisabled: f.chatOpenRefundDisabled,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <SettingsCard>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <NumberField label="هزینه باز کردن چت برای مردان (سکه)" value={f.chatOpenCostMale} onChange={(v) => setF({ ...f, chatOpenCostMale: v })} />
          <NumberField label="تخفیف VIP (درصد)" value={f.chatOpenVipDiscount} onChange={(v) => setF({ ...f, chatOpenVipDiscount: v })} />
          <NumberField label="هزینه باز کردن چت دوم با همان شخص" value={f.chatOpenSamePersonCost} onChange={(v) => setF({ ...f, chatOpenSamePersonCost: v })} />
          <NumberField label="مدت انتظار برای بازگشت سکه (ساعت)" value={f.chatOpenRefundWaitHours} onChange={(v) => setF({ ...f, chatOpenRefundWaitHours: v })} />
          <NumberField label="هزینه چت با کاربران VIP (سکه)" value={f.chatOpenVipUserCost} onChange={(v) => setF({ ...f, chatOpenVipUserCost: v })} />
          <NumberField label="بسته چت نامحدود روزانه (سکه)" value={f.chatUnlimitedDailyCost} onChange={(v) => setF({ ...f, chatUnlimitedDailyCost: v })} />
          <NumberField label="هزینه چت تصویری (سکه)" value={f.chatVideoCostCoins} onChange={(v) => setF({ ...f, chatVideoCostCoins: v })} />
        </div>
        <div className="space-y-2 mt-4">
          <ToggleRow label="رایگان برای زنان" checked={f.chatOpenFreeFemale} onChange={(v) => setF({ ...f, chatOpenFreeFemale: v })} />
          <ToggleRow label="بازگشت سکه اگر پاسخ نداد" checked={f.chatOpenRefundNoReply} onChange={(v) => setF({ ...f, chatOpenRefundNoReply: v })} />
          <ToggleRow label="رایگان اولین چت روز" checked={f.chatOpenFirstFreeDaily} onChange={(v) => setF({ ...f, chatOpenFirstFreeDaily: v })} />
          <ToggleRow label="نمایش هزینه قبل از باز کردن چت" checked={f.chatOpenShowCostBefore} onChange={(v) => setF({ ...f, chatOpenShowCostBefore: v })} />
          <ToggleRow label="غیرفعال کردن بازگشت سکه" checked={f.chatOpenRefundDisabled} onChange={(v) => setF({ ...f, chatOpenRefundDisabled: v })} />
        </div>
      </SettingsCard>
      <MessageBanner message={message} />
      <SaveButton loading={loading} />
    </form>
  );
}
