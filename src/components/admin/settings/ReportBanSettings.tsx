"use client";

import { useState } from "react";
import { useSettingsSave, SaveButton, MessageBanner, SettingsCard, ToggleRow, NumberField, TextAreaField } from "./shared";

type Props = {
  autoBanReportCount: number;
  autoBanDurationHours: number;
  banWarningMessage: string;
  manualBanDefaultHours: number;
  allowBanAppeal: boolean;
  banAppealDays: number;
  banIpWithUser: boolean;
  reportPriorityByCount: boolean;
  banUserMessage: string;
  unbanUserMessage: string;
  minLevelToReport: number;
};

export default function ReportBanSettings(props: Props) {
  const { save, message, loading } = useSettingsSave();
  const [f, setF] = useState({
    autoBanReportCount: String(props.autoBanReportCount),
    autoBanDurationHours: String(props.autoBanDurationHours),
    banWarningMessage: props.banWarningMessage,
    manualBanDefaultHours: String(props.manualBanDefaultHours),
    allowBanAppeal: props.allowBanAppeal,
    banAppealDays: String(props.banAppealDays),
    banIpWithUser: props.banIpWithUser,
    reportPriorityByCount: props.reportPriorityByCount,
    banUserMessage: props.banUserMessage,
    unbanUserMessage: props.unbanUserMessage,
    minLevelToReport: String(props.minLevelToReport),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    save({
      autoBanReportCount: parseInt(f.autoBanReportCount),
      autoBanDurationHours: parseInt(f.autoBanDurationHours),
      banWarningMessage: f.banWarningMessage,
      manualBanDefaultHours: parseInt(f.manualBanDefaultHours),
      allowBanAppeal: f.allowBanAppeal,
      banAppealDays: parseInt(f.banAppealDays),
      banIpWithUser: f.banIpWithUser,
      reportPriorityByCount: f.reportPriorityByCount,
      banUserMessage: f.banUserMessage,
      unbanUserMessage: f.unbanUserMessage,
      minLevelToReport: parseInt(f.minLevelToReport),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <SettingsCard>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <NumberField label="تعداد گزارش لازم برای بن خودکار" value={f.autoBanReportCount} onChange={(v) => setF({ ...f, autoBanReportCount: v })} />
          <NumberField label="مدت بن خودکار (ساعت)" value={f.autoBanDurationHours} onChange={(v) => setF({ ...f, autoBanDurationHours: v })} />
          <NumberField label="مدت بن دستی پیش فرض (ساعت)" value={f.manualBanDefaultHours} onChange={(v) => setF({ ...f, manualBanDefaultHours: v })} />
          <NumberField label="مدت زمان اعتراض (روز)" value={f.banAppealDays} onChange={(v) => setF({ ...f, banAppealDays: v })} />
          <NumberField label="حداقل سطح کاربر برای گزارش" value={f.minLevelToReport} onChange={(v) => setF({ ...f, minLevelToReport: v })} hint="0 یعنی همه" />
        </div>
        <div className="space-y-4 mt-4">
          <TextAreaField label="پیام هشدار قبل از بن" value={f.banWarningMessage} onChange={(v) => setF({ ...f, banWarningMessage: v })} />
          <TextAreaField label="پیام بن به کاربر" value={f.banUserMessage} onChange={(v) => setF({ ...f, banUserMessage: v })} />
          <TextAreaField label="پیام رفع بن به کاربر" value={f.unbanUserMessage} onChange={(v) => setF({ ...f, unbanUserMessage: v })} />
        </div>
        <div className="space-y-2 mt-4">
          <ToggleRow label="اجازه اعتراض به بن" checked={f.allowBanAppeal} onChange={(v) => setF({ ...f, allowBanAppeal: v })} />
          <ToggleRow label="بن IP به همراه بن کاربر" checked={f.banIpWithUser} onChange={(v) => setF({ ...f, banIpWithUser: v })} />
          <ToggleRow label="اولویت گزارش بر اساس تعداد" checked={f.reportPriorityByCount} onChange={(v) => setF({ ...f, reportPriorityByCount: v })} />
        </div>
      </SettingsCard>
      <MessageBanner message={message} />
      <SaveButton loading={loading} />
    </form>
  );
}
