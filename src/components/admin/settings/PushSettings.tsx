"use client";

import { useState } from "react";
import { useSettingsSave, SaveButton, MessageBanner, SettingsCard, ToggleRow, NumberField, TextField } from "./shared";

type Props = {
  pushEnabled: boolean;
  pushDefaultTitle: string;
  pushDefaultBody: string;
  pushIntervalMinutes: number;
  pushMaxDaily: number;
  pushQuietHours: boolean;
  pushQuietStart: string;
  pushQuietEnd: string;
  pushOnlineOnly: boolean;
  pushWithPhoto: boolean;
  pushCustomSound: boolean;
  pushFreeDisabled: boolean;
};

export default function PushSettings(props: Props) {
  const { save, message, loading } = useSettingsSave();
  const [f, setF] = useState({
    pushEnabled: props.pushEnabled,
    pushDefaultTitle: props.pushDefaultTitle,
    pushDefaultBody: props.pushDefaultBody,
    pushIntervalMinutes: String(props.pushIntervalMinutes),
    pushMaxDaily: String(props.pushMaxDaily),
    pushQuietHours: props.pushQuietHours,
    pushQuietStart: props.pushQuietStart,
    pushQuietEnd: props.pushQuietEnd,
    pushOnlineOnly: props.pushOnlineOnly,
    pushWithPhoto: props.pushWithPhoto,
    pushCustomSound: props.pushCustomSound,
    pushFreeDisabled: props.pushFreeDisabled,
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    save({
      pushEnabled: f.pushEnabled,
      pushDefaultTitle: f.pushDefaultTitle,
      pushDefaultBody: f.pushDefaultBody,
      pushIntervalMinutes: parseInt(f.pushIntervalMinutes),
      pushMaxDaily: parseInt(f.pushMaxDaily),
      pushQuietHours: f.pushQuietHours,
      pushQuietStart: f.pushQuietStart,
      pushQuietEnd: f.pushQuietEnd,
      pushOnlineOnly: f.pushOnlineOnly,
      pushWithPhoto: f.pushWithPhoto,
      pushCustomSound: f.pushCustomSound,
      pushFreeDisabled: f.pushFreeDisabled,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <SettingsCard>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField label="عنوان پیش فرض نوتیفیکیشن" value={f.pushDefaultTitle} onChange={(v) => setF({ ...f, pushDefaultTitle: v })} />
          <TextField label="متن پیش فرض نوتیفیکیشن" value={f.pushDefaultBody} onChange={(v) => setF({ ...f, pushDefaultBody: v })} />
          <NumberField label="فاصله بین نوتیفیکیشن ها (دقیقه)" value={f.pushIntervalMinutes} onChange={(v) => setF({ ...f, pushIntervalMinutes: v })} />
          <NumberField label="حداکثر نوتیفیکیشن در روز" value={f.pushMaxDaily} onChange={(v) => setF({ ...f, pushMaxDaily: v })} />
          <TextField label="شروع ساعات آرامش" value={f.pushQuietStart} onChange={(v) => setF({ ...f, pushQuietStart: v })} hint="مثال: 23:00" />
          <TextField label="پایان ساعات آرامش" value={f.pushQuietEnd} onChange={(v) => setF({ ...f, pushQuietEnd: v })} hint="مثال: 08:00" />
        </div>
        <div className="space-y-2 mt-4">
          <ToggleRow label="فعال بودن push notification" checked={f.pushEnabled} onChange={(v) => setF({ ...f, pushEnabled: v })} />
          <ToggleRow label="نوتیفیکیشن ساعات آرامش (شب)" checked={f.pushQuietHours} onChange={(v) => setF({ ...f, pushQuietHours: v })} />
          <ToggleRow label="نوتیفیکیشن فقط برای کاربران آنلاین" checked={f.pushOnlineOnly} onChange={(v) => setF({ ...f, pushOnlineOnly: v })} />
          <ToggleRow label="نوتیفیکیشن با عکس پروفایل" checked={f.pushWithPhoto} onChange={(v) => setF({ ...f, pushWithPhoto: v })} />
          <ToggleRow label="نوتیفیکیشن با صدای دلخواه" checked={f.pushCustomSound} onChange={(v) => setF({ ...f, pushCustomSound: v })} />
          <ToggleRow label="غیرفعال کردن push برای کاربران رایگان" checked={f.pushFreeDisabled} onChange={(v) => setF({ ...f, pushFreeDisabled: v })} />
        </div>
      </SettingsCard>
      <MessageBanner message={message} />
      <SaveButton loading={loading} />
    </form>
  );
}
