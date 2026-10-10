"use client";

import { useState } from "react";
import { useSettingsSave, SaveButton, MessageBanner, SettingsCard, ToggleRow, NumberField } from "./shared";

type Props = {
  rewindCostCoins: number;
  rewindFreeDaily: number;
  vipRewindDaily: number;
  rewindTimeWindowMinutes: number;
  rewindExtraCostCoins: number;
  rewindDisabledFree: boolean;
  showRewindRemaining: boolean;
  rewindRejectOnly: boolean;
  rewindHourlyLimit: number;
  showLastRewindTime: boolean;
};

export default function RewindSettings(props: Props) {
  const { save, message, loading } = useSettingsSave();
  const [f, setF] = useState({
    rewindCostCoins: String(props.rewindCostCoins),
    rewindFreeDaily: String(props.rewindFreeDaily),
    vipRewindDaily: String(props.vipRewindDaily),
    rewindTimeWindowMinutes: String(props.rewindTimeWindowMinutes),
    rewindExtraCostCoins: String(props.rewindExtraCostCoins),
    rewindDisabledFree: props.rewindDisabledFree,
    showRewindRemaining: props.showRewindRemaining,
    rewindRejectOnly: props.rewindRejectOnly,
    rewindHourlyLimit: String(props.rewindHourlyLimit),
    showLastRewindTime: props.showLastRewindTime,
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    save({
      rewindCostCoins: parseInt(f.rewindCostCoins),
      rewindFreeDaily: parseInt(f.rewindFreeDaily),
      vipRewindDaily: parseInt(f.vipRewindDaily),
      rewindTimeWindowMinutes: parseInt(f.rewindTimeWindowMinutes),
      rewindExtraCostCoins: parseInt(f.rewindExtraCostCoins),
      rewindDisabledFree: f.rewindDisabledFree,
      showRewindRemaining: f.showRewindRemaining,
      rewindRejectOnly: f.rewindRejectOnly,
      rewindHourlyLimit: parseInt(f.rewindHourlyLimit),
      showLastRewindTime: f.showLastRewindTime,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <SettingsCard>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <NumberField label="هزینه بازگردانی آخرین لایک (سکه)" value={f.rewindCostCoins} onChange={(v) => setF({ ...f, rewindCostCoins: v })} />
          <NumberField label="تعداد rewind رایگان روزانه" value={f.rewindFreeDaily} onChange={(v) => setF({ ...f, rewindFreeDaily: v })} />
          <NumberField label="تعداد rewind روزانه VIP" value={f.vipRewindDaily} onChange={(v) => setF({ ...f, vipRewindDaily: v })} />
          <NumberField label="بازه زمانی مجاز برای rewind (دقیقه)" value={f.rewindTimeWindowMinutes} onChange={(v) => setF({ ...f, rewindTimeWindowMinutes: v })} />
          <NumberField label="هزینه خرید rewind اضافی (سکه)" value={f.rewindExtraCostCoins} onChange={(v) => setF({ ...f, rewindExtraCostCoins: v })} />
          <NumberField label="محدودیت rewind در ساعت" value={f.rewindHourlyLimit} onChange={(v) => setF({ ...f, rewindHourlyLimit: v })} hint="0 یعنی بدون محدودیت" />
        </div>
        <div className="space-y-2 mt-4">
          <ToggleRow label="غیرفعال کردن rewind برای کاربران رایگان" checked={f.rewindDisabledFree} onChange={(v) => setF({ ...f, rewindDisabledFree: v })} />
          <ToggleRow label="نمایش تعداد rewind باقی مانده" checked={f.showRewindRemaining} onChange={(v) => setF({ ...f, showRewindRemaining: v })} />
          <ToggleRow label="rewind فقط برای ریجکت (نه همه عملیات)" checked={f.rewindRejectOnly} onChange={(v) => setF({ ...f, rewindRejectOnly: v })} />
          <ToggleRow label="نمایش تاریخ آخرین rewind" checked={f.showLastRewindTime} onChange={(v) => setF({ ...f, showLastRewindTime: v })} />
        </div>
      </SettingsCard>
      <MessageBanner message={message} />
      <SaveButton loading={loading} />
    </form>
  );
}
