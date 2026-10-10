"use client";

import { useState } from "react";
import { useSettingsSave, SaveButton, MessageBanner, SettingsCard, ToggleRow, NumberField, TextField } from "./shared";

type Props = {
  discoveryDefaultRadius: number;
  discoveryMinAgeGap: number;
  discoveryMaxAgeGap: number;
  discoveryOnlineFirst: boolean;
  discoveryResultsPerPage: number;
  discoveryShowNoPhoto: boolean;
  discoveryShowUnverified: boolean;
  discoveryMaxRadius: number;
  discoveryShowEmptyBio: boolean;
  discoveryVipPriority: boolean;
  discoveryDistanceUnit: string;
  discoveryShowExactAge: boolean;
};

export default function DiscoverySettings(props: Props) {
  const { save, message, loading } = useSettingsSave();
  const [f, setF] = useState({
    discoveryDefaultRadius: String(props.discoveryDefaultRadius),
    discoveryMinAgeGap: String(props.discoveryMinAgeGap),
    discoveryMaxAgeGap: String(props.discoveryMaxAgeGap),
    discoveryOnlineFirst: props.discoveryOnlineFirst,
    discoveryResultsPerPage: String(props.discoveryResultsPerPage),
    discoveryShowNoPhoto: props.discoveryShowNoPhoto,
    discoveryShowUnverified: props.discoveryShowUnverified,
    discoveryMaxRadius: String(props.discoveryMaxRadius),
    discoveryShowEmptyBio: props.discoveryShowEmptyBio,
    discoveryVipPriority: props.discoveryVipPriority,
    discoveryDistanceUnit: props.discoveryDistanceUnit,
    discoveryShowExactAge: props.discoveryShowExactAge,
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    save({
      discoveryDefaultRadius: parseInt(f.discoveryDefaultRadius),
      discoveryMinAgeGap: parseInt(f.discoveryMinAgeGap),
      discoveryMaxAgeGap: parseInt(f.discoveryMaxAgeGap),
      discoveryOnlineFirst: f.discoveryOnlineFirst,
      discoveryResultsPerPage: parseInt(f.discoveryResultsPerPage),
      discoveryShowNoPhoto: f.discoveryShowNoPhoto,
      discoveryShowUnverified: f.discoveryShowUnverified,
      discoveryMaxRadius: parseInt(f.discoveryMaxRadius),
      discoveryShowEmptyBio: f.discoveryShowEmptyBio,
      discoveryVipPriority: f.discoveryVipPriority,
      discoveryDistanceUnit: f.discoveryDistanceUnit,
      discoveryShowExactAge: f.discoveryShowExactAge,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <SettingsCard>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <NumberField label="شعاع جستجوی پیش فرض (کیلومتر)" value={f.discoveryDefaultRadius} onChange={(v) => setF({ ...f, discoveryDefaultRadius: v })} />
          <NumberField label="حداقل فاصله سنی قابل تنظیم" value={f.discoveryMinAgeGap} onChange={(v) => setF({ ...f, discoveryMinAgeGap: v })} />
          <NumberField label="حداکثر فاصله سنی قابل تنظیم" value={f.discoveryMaxAgeGap} onChange={(v) => setF({ ...f, discoveryMaxAgeGap: v })} />
          <NumberField label="تعداد نتایج در هر صفحه" value={f.discoveryResultsPerPage} onChange={(v) => setF({ ...f, discoveryResultsPerPage: v })} />
          <NumberField label="حداکثر فاصله جغرافیایی (کیلومتر)" value={f.discoveryMaxRadius} onChange={(v) => setF({ ...f, discoveryMaxRadius: v })} />
          <TextField label="واحد فاصله" value={f.discoveryDistanceUnit} onChange={(v) => setF({ ...f, discoveryDistanceUnit: v })} hint="km یا mile" />
        </div>
        <div className="space-y-2 mt-4">
          <ToggleRow label="نمایش کاربران آنلاین اول" checked={f.discoveryOnlineFirst} onChange={(v) => setF({ ...f, discoveryOnlineFirst: v })} />
          <ToggleRow label="نمایش کاربران بدون عکس" checked={f.discoveryShowNoPhoto} onChange={(v) => setF({ ...f, discoveryShowNoPhoto: v })} />
          <ToggleRow label="نمایش کاربران تایید نشده" checked={f.discoveryShowUnverified} onChange={(v) => setF({ ...f, discoveryShowUnverified: v })} />
          <ToggleRow label="نمایش کاربران با بیو خالی" checked={f.discoveryShowEmptyBio} onChange={(v) => setF({ ...f, discoveryShowEmptyBio: v })} />
          <ToggleRow label="اولویت نمایش کاربران VIP" checked={f.discoveryVipPriority} onChange={(v) => setF({ ...f, discoveryVipPriority: v })} />
          <ToggleRow label="نمایش سن دقیق (نه بازه سنی)" checked={f.discoveryShowExactAge} onChange={(v) => setF({ ...f, discoveryShowExactAge: v })} />
        </div>
      </SettingsCard>
      <MessageBanner message={message} />
      <SaveButton loading={loading} />
    </form>
  );
}
