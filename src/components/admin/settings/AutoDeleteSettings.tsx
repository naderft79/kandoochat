"use client";

import { useState } from "react";
import { useSettingsSave, SaveButton, MessageBanner, SettingsCard, ToggleRow, NumberField } from "./shared";

type Props = {
  autoDeleteInactiveDays: number;
  autoDeleteOldChatsDays: number;
  autoDeleteOldMessagesDays: number;
  autoDeleteExpiredStory: boolean;
  autoDeleteRemovedUserPhotos: boolean;
  autoDeleteResolvedReportsDays: number;
  autoDeleteOldLogsDays: number;
  autoDeleteExpiredCoupons: boolean;
  autoDeleteWarnDays: number;
  archiveBeforeDelete: boolean;
  autoDeleteExpiredTokens: boolean;
  autoDeleteOldNotificationsDays: number;
};

export default function AutoDeleteSettings(props: Props) {
  const { save, message, loading } = useSettingsSave();
  const [f, setF] = useState({
    autoDeleteInactiveDays: String(props.autoDeleteInactiveDays),
    autoDeleteOldChatsDays: String(props.autoDeleteOldChatsDays),
    autoDeleteOldMessagesDays: String(props.autoDeleteOldMessagesDays),
    autoDeleteExpiredStory: props.autoDeleteExpiredStory,
    autoDeleteRemovedUserPhotos: props.autoDeleteRemovedUserPhotos,
    autoDeleteResolvedReportsDays: String(props.autoDeleteResolvedReportsDays),
    autoDeleteOldLogsDays: String(props.autoDeleteOldLogsDays),
    autoDeleteExpiredCoupons: props.autoDeleteExpiredCoupons,
    autoDeleteWarnDays: String(props.autoDeleteWarnDays),
    archiveBeforeDelete: props.archiveBeforeDelete,
    autoDeleteExpiredTokens: props.autoDeleteExpiredTokens,
    autoDeleteOldNotificationsDays: String(props.autoDeleteOldNotificationsDays),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    save({
      autoDeleteInactiveDays: parseInt(f.autoDeleteInactiveDays),
      autoDeleteOldChatsDays: parseInt(f.autoDeleteOldChatsDays),
      autoDeleteOldMessagesDays: parseInt(f.autoDeleteOldMessagesDays),
      autoDeleteExpiredStory: f.autoDeleteExpiredStory,
      autoDeleteRemovedUserPhotos: f.autoDeleteRemovedUserPhotos,
      autoDeleteResolvedReportsDays: parseInt(f.autoDeleteResolvedReportsDays),
      autoDeleteOldLogsDays: parseInt(f.autoDeleteOldLogsDays),
      autoDeleteExpiredCoupons: f.autoDeleteExpiredCoupons,
      autoDeleteWarnDays: parseInt(f.autoDeleteWarnDays),
      archiveBeforeDelete: f.archiveBeforeDelete,
      autoDeleteExpiredTokens: f.autoDeleteExpiredTokens,
      autoDeleteOldNotificationsDays: parseInt(f.autoDeleteOldNotificationsDays),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <SettingsCard>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <NumberField label="حذف کاربران غیرفعال بعد از (روز)" value={f.autoDeleteInactiveDays} onChange={(v) => setF({ ...f, autoDeleteInactiveDays: v })} hint="0 یعنی غیرفعال" />
          <NumberField label="حذف چت های قدیمی بعد از (روز)" value={f.autoDeleteOldChatsDays} onChange={(v) => setF({ ...f, autoDeleteOldChatsDays: v })} hint="0 یعنی غیرفعال" />
          <NumberField label="حذف پیام های قدیمی بعد از (روز)" value={f.autoDeleteOldMessagesDays} onChange={(v) => setF({ ...f, autoDeleteOldMessagesDays: v })} hint="0 یعنی غیرفعال" />
          <NumberField label="حذف گزارش های حل شده بعد از (روز)" value={f.autoDeleteResolvedReportsDays} onChange={(v) => setF({ ...f, autoDeleteResolvedReportsDays: v })} />
          <NumberField label="حذف لاگ های قدیمی بعد از (روز)" value={f.autoDeleteOldLogsDays} onChange={(v) => setF({ ...f, autoDeleteOldLogsDays: v })} />
          <NumberField label="هشدار قبل از حذف کاربر (روز)" value={f.autoDeleteWarnDays} onChange={(v) => setF({ ...f, autoDeleteWarnDays: v })} />
          <NumberField label="حذف اعلان های قدیمی بعد از (روز)" value={f.autoDeleteOldNotificationsDays} onChange={(v) => setF({ ...f, autoDeleteOldNotificationsDays: v })} />
        </div>
        <div className="space-y-2 mt-4">
          <ToggleRow label="حذف خودکار استوری منقضی شده" checked={f.autoDeleteExpiredStory} onChange={(v) => setF({ ...f, autoDeleteExpiredStory: v })} />
          <ToggleRow label="حذف عکس های کاربر حذف شده" checked={f.autoDeleteRemovedUserPhotos} onChange={(v) => setF({ ...f, autoDeleteRemovedUserPhotos: v })} />
          <ToggleRow label="حذف خودکار کد های تخفیف منقضی" checked={f.autoDeleteExpiredCoupons} onChange={(v) => setF({ ...f, autoDeleteExpiredCoupons: v })} />
          <ToggleRow label="آرشیو قبل از حذف" checked={f.archiveBeforeDelete} onChange={(v) => setF({ ...f, archiveBeforeDelete: v })} />
          <ToggleRow label="حذف توکن های منقضی" checked={f.autoDeleteExpiredTokens} onChange={(v) => setF({ ...f, autoDeleteExpiredTokens: v })} />
        </div>
      </SettingsCard>
      <MessageBanner message={message} />
      <SaveButton loading={loading} />
    </form>
  );
}
