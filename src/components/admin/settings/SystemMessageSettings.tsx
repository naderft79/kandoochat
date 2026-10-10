"use client";

import { useState } from "react";
import { useSettingsSave, SaveButton, MessageBanner, SettingsCard, TextAreaField } from "./shared";

type Props = {
  sysmsgWelcome: string;
  sysmsgNewMatch: string;
  sysmsgBan: string;
  sysmsgIdentityApproved: string;
  sysmsgIdentityRejected: string;
  sysmsgSubscriptionExpiry: string;
  sysmsgGiftReceived: string;
  sysmsgReportReceived: string;
  sysmsgPasswordChange: string;
  sysmsgNewDeviceLogin: string;
  sysmsgReject: string;
  sysmsgReferralReward: string;
};

export default function SystemMessageSettings(props: Props) {
  const { save, message, loading } = useSettingsSave();
  const [f, setF] = useState({
    sysmsgWelcome: props.sysmsgWelcome,
    sysmsgNewMatch: props.sysmsgNewMatch,
    sysmsgBan: props.sysmsgBan,
    sysmsgIdentityApproved: props.sysmsgIdentityApproved,
    sysmsgIdentityRejected: props.sysmsgIdentityRejected,
    sysmsgSubscriptionExpiry: props.sysmsgSubscriptionExpiry,
    sysmsgGiftReceived: props.sysmsgGiftReceived,
    sysmsgReportReceived: props.sysmsgReportReceived,
    sysmsgPasswordChange: props.sysmsgPasswordChange,
    sysmsgNewDeviceLogin: props.sysmsgNewDeviceLogin,
    sysmsgReject: props.sysmsgReject,
    sysmsgReferralReward: props.sysmsgReferralReward,
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    save(f);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <SettingsCard>
        <div className="space-y-4">
          <TextAreaField label="پیام خوش آمدگویی" value={f.sysmsgWelcome} onChange={(v) => setF({ ...f, sysmsgWelcome: v })} />
          <TextAreaField label="پیام تطابق جدید" value={f.sysmsgNewMatch} onChange={(v) => setF({ ...f, sysmsgNewMatch: v })} />
          <TextAreaField label="پیام بن" value={f.sysmsgBan} onChange={(v) => setF({ ...f, sysmsgBan: v })} />
          <TextAreaField label="پیام تایید هویت" value={f.sysmsgIdentityApproved} onChange={(v) => setF({ ...f, sysmsgIdentityApproved: v })} />
          <TextAreaField label="پیام رد تایید هویت" value={f.sysmsgIdentityRejected} onChange={(v) => setF({ ...f, sysmsgIdentityRejected: v })} />
          <TextAreaField label="پیام انقضای اشتراک" value={f.sysmsgSubscriptionExpiry} onChange={(v) => setF({ ...f, sysmsgSubscriptionExpiry: v })} />
          <TextAreaField label="پیام هدیه دریافتی" value={f.sysmsgGiftReceived} onChange={(v) => setF({ ...f, sysmsgGiftReceived: v })} />
          <TextAreaField label="پیام گزارش دریافت شد" value={f.sysmsgReportReceived} onChange={(v) => setF({ ...f, sysmsgReportReceived: v })} />
          <TextAreaField label="پیام تغییر رمز" value={f.sysmsgPasswordChange} onChange={(v) => setF({ ...f, sysmsgPasswordChange: v })} />
          <TextAreaField label="پیام ورود از دستگاه جدید" value={f.sysmsgNewDeviceLogin} onChange={(v) => setF({ ...f, sysmsgNewDeviceLogin: v })} />
          <TextAreaField label="پیام ریجکت" value={f.sysmsgReject} onChange={(v) => setF({ ...f, sysmsgReject: v })} />
          <TextAreaField label="پیام پاداش دعوت" value={f.sysmsgReferralReward} onChange={(v) => setF({ ...f, sysmsgReferralReward: v })} />
        </div>
      </SettingsCard>
      <MessageBanner message={message} />
      <SaveButton loading={loading} />
    </form>
  );
}
