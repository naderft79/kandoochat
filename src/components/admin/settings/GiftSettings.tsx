"use client";

import { useState } from "react";
import { useSettingsSave, SaveButton, MessageBanner, SettingsCard, ToggleRow, NumberField } from "./shared";

type Props = {
  maxDailyGiftCoins: number;
  minTierForGift: number;
  giftMessageRequired: boolean;
  giftMessageMaxLength: number;
  giftTransferFeePercent: number;
  minTransferCoins: number;
  maxTransferCoins: number;
  giftToNonMatch: boolean;
  showGiftInProfile: boolean;
  giftHistoryEnabled: boolean;
  groupGiftEnabled: boolean;
  giftFreeDisabled: boolean;
};

export default function GiftSettings(props: Props) {
  const { save, message, loading } = useSettingsSave();
  const [f, setF] = useState({
    maxDailyGiftCoins: String(props.maxDailyGiftCoins),
    minTierForGift: String(props.minTierForGift),
    giftMessageRequired: props.giftMessageRequired,
    giftMessageMaxLength: String(props.giftMessageMaxLength),
    giftTransferFeePercent: String(props.giftTransferFeePercent),
    minTransferCoins: String(props.minTransferCoins),
    maxTransferCoins: String(props.maxTransferCoins),
    giftToNonMatch: props.giftToNonMatch,
    showGiftInProfile: props.showGiftInProfile,
    giftHistoryEnabled: props.giftHistoryEnabled,
    groupGiftEnabled: props.groupGiftEnabled,
    giftFreeDisabled: props.giftFreeDisabled,
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    save({
      maxDailyGiftCoins: parseInt(f.maxDailyGiftCoins),
      minTierForGift: parseInt(f.minTierForGift),
      giftMessageRequired: f.giftMessageRequired,
      giftMessageMaxLength: parseInt(f.giftMessageMaxLength),
      giftTransferFeePercent: parseInt(f.giftTransferFeePercent),
      minTransferCoins: parseInt(f.minTransferCoins),
      maxTransferCoins: parseInt(f.maxTransferCoins),
      giftToNonMatch: f.giftToNonMatch,
      showGiftInProfile: f.showGiftInProfile,
      giftHistoryEnabled: f.giftHistoryEnabled,
      groupGiftEnabled: f.groupGiftEnabled,
      giftFreeDisabled: f.giftFreeDisabled,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <SettingsCard>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <NumberField label="حداکثر هدیه روزانه (سکه)" value={f.maxDailyGiftCoins} onChange={(v) => setF({ ...f, maxDailyGiftCoins: v })} />
          <NumberField label="حداقل سطح برای هدیه دادن" value={f.minTierForGift} onChange={(v) => setF({ ...f, minTierForGift: v })} hint="0 یعنی همه" />
          <NumberField label="حداکثر طول پیام هدیه" value={f.giftMessageMaxLength} onChange={(v) => setF({ ...f, giftMessageMaxLength: v })} />
          <NumberField label="کارمزد انتقال سکه (درصد)" value={f.giftTransferFeePercent} onChange={(v) => setF({ ...f, giftTransferFeePercent: v })} />
          <NumberField label="حداقل سکه قابل انتقال" value={f.minTransferCoins} onChange={(v) => setF({ ...f, minTransferCoins: v })} />
          <NumberField label="حداکثر سکه قابل انتقال" value={f.maxTransferCoins} onChange={(v) => setF({ ...f, maxTransferCoins: v })} />
        </div>
        <div className="space-y-2 mt-4">
          <ToggleRow label="الزام پیام هنگام هدیه" checked={f.giftMessageRequired} onChange={(v) => setF({ ...f, giftMessageRequired: v })} />
          <ToggleRow label="اجازه هدیه به غیر تطابق" checked={f.giftToNonMatch} onChange={(v) => setF({ ...f, giftToNonMatch: v })} />
          <ToggleRow label="نمایش هدیه در پروفایل" checked={f.showGiftInProfile} onChange={(v) => setF({ ...f, showGiftInProfile: v })} />
          <ToggleRow label="فعال بودن تاریخچه هدیه" checked={f.giftHistoryEnabled} onChange={(v) => setF({ ...f, giftHistoryEnabled: v })} />
          <ToggleRow label="هدیه گروهی" checked={f.groupGiftEnabled} onChange={(v) => setF({ ...f, groupGiftEnabled: v })} />
          <ToggleRow label="غیرفعال کردن هدیه برای کاربران رایگان" checked={f.giftFreeDisabled} onChange={(v) => setF({ ...f, giftFreeDisabled: v })} />
        </div>
      </SettingsCard>
      <MessageBanner message={message} />
      <SaveButton loading={loading} />
    </form>
  );
}
