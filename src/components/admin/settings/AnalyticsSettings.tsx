"use client";

import { useState } from "react";
import { useSettingsSave, SaveButton, MessageBanner, SettingsCard, ToggleRow, TextField } from "./shared";

type Props = {
  analyticsEnabled: boolean;
  analyticsDailyReport: boolean;
  analyticsAdminEmail: string;
  analyticsNewUsersDaily: boolean;
  analyticsRevenueDaily: boolean;
  analyticsNewChatsDaily: boolean;
  analyticsNewMatchesDaily: boolean;
  analyticsUserDeletions: boolean;
  analyticsSystemErrors: boolean;
  analyticsCoinUsage: boolean;
  analyticsBotPerformance: boolean;
  analyticsPageViews: boolean;
};

export default function AnalyticsSettings(props: Props) {
  const { save, message, loading } = useSettingsSave();
  const [f, setF] = useState({
    analyticsEnabled: props.analyticsEnabled,
    analyticsDailyReport: props.analyticsDailyReport,
    analyticsAdminEmail: props.analyticsAdminEmail,
    analyticsNewUsersDaily: props.analyticsNewUsersDaily,
    analyticsRevenueDaily: props.analyticsRevenueDaily,
    analyticsNewChatsDaily: props.analyticsNewChatsDaily,
    analyticsNewMatchesDaily: props.analyticsNewMatchesDaily,
    analyticsUserDeletions: props.analyticsUserDeletions,
    analyticsSystemErrors: props.analyticsSystemErrors,
    analyticsCoinUsage: props.analyticsCoinUsage,
    analyticsBotPerformance: props.analyticsBotPerformance,
    analyticsPageViews: props.analyticsPageViews,
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    save(f);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <SettingsCard>
        <div className="mb-4">
          <TextField label="ایمیل دریافت گزارش" value={f.analyticsAdminEmail} onChange={(v) => setF({ ...f, analyticsAdminEmail: v })} />
        </div>
        <div className="space-y-2">
          <ToggleRow label="فعال بودن آمارگیری" checked={f.analyticsEnabled} onChange={(v) => setF({ ...f, analyticsEnabled: v })} />
          <ToggleRow label="گزارش روزانه" checked={f.analyticsDailyReport} onChange={(v) => setF({ ...f, analyticsDailyReport: v })} />
          <ToggleRow label="آمار کاربران جدید روزانه" checked={f.analyticsNewUsersDaily} onChange={(v) => setF({ ...f, analyticsNewUsersDaily: v })} />
          <ToggleRow label="آمار درآمد روزانه" checked={f.analyticsRevenueDaily} onChange={(v) => setF({ ...f, analyticsRevenueDaily: v })} />
          <ToggleRow label="آمار چت های جدید روزانه" checked={f.analyticsNewChatsDaily} onChange={(v) => setF({ ...f, analyticsNewChatsDaily: v })} />
          <ToggleRow label="آمار تطابق های جدید روزانه" checked={f.analyticsNewMatchesDaily} onChange={(v) => setF({ ...f, analyticsNewMatchesDaily: v })} />
          <ToggleRow label="آمار حذف کاربران" checked={f.analyticsUserDeletions} onChange={(v) => setF({ ...f, analyticsUserDeletions: v })} />
          <ToggleRow label="آمار خطاهای سیستمی" checked={f.analyticsSystemErrors} onChange={(v) => setF({ ...f, analyticsSystemErrors: v })} />
          <ToggleRow label="آمار مصرف سکه" checked={f.analyticsCoinUsage} onChange={(v) => setF({ ...f, analyticsCoinUsage: v })} />
          <ToggleRow label="آمار عملکرد ربات" checked={f.analyticsBotPerformance} onChange={(v) => setF({ ...f, analyticsBotPerformance: v })} />
          <ToggleRow label="آمار بازدید صفحات" checked={f.analyticsPageViews} onChange={(v) => setF({ ...f, analyticsPageViews: v })} />
        </div>
      </SettingsCard>
      <MessageBanner message={message} />
      <SaveButton loading={loading} />
    </form>
  );
}
