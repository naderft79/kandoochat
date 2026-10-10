"use client";

import { useState } from "react";
import { useSettingsSave, SaveButton, MessageBanner, SettingsCard, ToggleRow, NumberField, TextField } from "./shared";

type Props = {
  logLevel: string;
  logRetentionDays: number;
  logAdminActions: boolean;
  logUserLogin: boolean;
  logSettingsChanges: boolean;
  logFinancialTransactions: boolean;
  logBansReports: boolean;
  logApiErrors: boolean;
  logDbChanges: boolean;
  logEmailEnabled: boolean;
  logToDb: boolean;
  logLiveView: boolean;
};

export default function LogSettings(props: Props) {
  const { save, message, loading } = useSettingsSave();
  const [f, setF] = useState({
    logLevel: props.logLevel,
    logRetentionDays: String(props.logRetentionDays),
    logAdminActions: props.logAdminActions,
    logUserLogin: props.logUserLogin,
    logSettingsChanges: props.logSettingsChanges,
    logFinancialTransactions: props.logFinancialTransactions,
    logBansReports: props.logBansReports,
    logApiErrors: props.logApiErrors,
    logDbChanges: props.logDbChanges,
    logEmailEnabled: props.logEmailEnabled,
    logToDb: props.logToDb,
    logLiveView: props.logLiveView,
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    save({
      logLevel: f.logLevel,
      logRetentionDays: parseInt(f.logRetentionDays),
      logAdminActions: f.logAdminActions,
      logUserLogin: f.logUserLogin,
      logSettingsChanges: f.logSettingsChanges,
      logFinancialTransactions: f.logFinancialTransactions,
      logBansReports: f.logBansReports,
      logApiErrors: f.logApiErrors,
      logDbChanges: f.logDbChanges,
      logEmailEnabled: f.logEmailEnabled,
      logToDb: f.logToDb,
      logLiveView: f.logLiveView,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <SettingsCard>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <TextField label="سطح لاگ" value={f.logLevel} onChange={(v) => setF({ ...f, logLevel: v })} hint="debug, info, warn, error" />
          <NumberField label="مدت نگهداری لاگ (روز)" value={f.logRetentionDays} onChange={(v) => setF({ ...f, logRetentionDays: v })} />
        </div>
        <div className="space-y-2">
          <ToggleRow label="لاگ عملیات ادمین" checked={f.logAdminActions} onChange={(v) => setF({ ...f, logAdminActions: v })} />
          <ToggleRow label="لاگ ورود کاربران" checked={f.logUserLogin} onChange={(v) => setF({ ...f, logUserLogin: v })} />
          <ToggleRow label="لاگ تغییرات تنظیمات" checked={f.logSettingsChanges} onChange={(v) => setF({ ...f, logSettingsChanges: v })} />
          <ToggleRow label="لاگ تراکنش های مالی" checked={f.logFinancialTransactions} onChange={(v) => setF({ ...f, logFinancialTransactions: v })} />
          <ToggleRow label="لاگ بن و گزارش" checked={f.logBansReports} onChange={(v) => setF({ ...f, logBansReports: v })} />
          <ToggleRow label="لاگ خطاهای API" checked={f.logApiErrors} onChange={(v) => setF({ ...f, logApiErrors: v })} />
          <ToggleRow label="لاگ تغییرات دیتابیس" checked={f.logDbChanges} onChange={(v) => setF({ ...f, logDbChanges: v })} />
          <ToggleRow label="ارسال لاگ به ایمیل" checked={f.logEmailEnabled} onChange={(v) => setF({ ...f, logEmailEnabled: v })} />
          <ToggleRow label="ذخیره لاگ در دیتابیس" checked={f.logToDb} onChange={(v) => setF({ ...f, logToDb: v })} />
          <ToggleRow label="نمایش زنده لاگ" checked={f.logLiveView} onChange={(v) => setF({ ...f, logLiveView: v })} />
        </div>
      </SettingsCard>
      <MessageBanner message={message} />
      <SaveButton loading={loading} />
    </form>
  );
}
