"use client";

import { useState } from "react";
import { useSettingsSave, SaveButton, MessageBanner, SettingsCard, ToggleRow } from "./shared";

type Props = {
  notifyNewLike: boolean;
  notifyNewMessage: boolean;
  notifyNewMatch: boolean;
  notifyNewStory: boolean;
  notifySuperLike: boolean;
  notifyGiftReceived: boolean;
  notifySubscriptionExpiry: boolean;
  notifySystemMessage: boolean;
  notifyCoinRefund: boolean;
  notifyIdentityResult: boolean;
  notifyBanWarning: boolean;
  notifyDisableAll: boolean;
};

export default function NotificationSettings(props: Props) {
  const { save, message, loading } = useSettingsSave();
  const [f, setF] = useState({
    notifyNewLike: props.notifyNewLike,
    notifyNewMessage: props.notifyNewMessage,
    notifyNewMatch: props.notifyNewMatch,
    notifyNewStory: props.notifyNewStory,
    notifySuperLike: props.notifySuperLike,
    notifyGiftReceived: props.notifyGiftReceived,
    notifySubscriptionExpiry: props.notifySubscriptionExpiry,
    notifySystemMessage: props.notifySystemMessage,
    notifyCoinRefund: props.notifyCoinRefund,
    notifyIdentityResult: props.notifyIdentityResult,
    notifyBanWarning: props.notifyBanWarning,
    notifyDisableAll: props.notifyDisableAll,
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    save(f);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <SettingsCard>
        <div className="space-y-2">
          <ToggleRow label="اعلان لایک جدید" checked={f.notifyNewLike} onChange={(v) => setF({ ...f, notifyNewLike: v })} />
          <ToggleRow label="اعلان پیام جدید" checked={f.notifyNewMessage} onChange={(v) => setF({ ...f, notifyNewMessage: v })} />
          <ToggleRow label="اعلان تطابق جدید" checked={f.notifyNewMatch} onChange={(v) => setF({ ...f, notifyNewMatch: v })} />
          <ToggleRow label="اعلان استوری جدید" checked={f.notifyNewStory} onChange={(v) => setF({ ...f, notifyNewStory: v })} />
          <ToggleRow label="اعلان سوپر لایک" checked={f.notifySuperLike} onChange={(v) => setF({ ...f, notifySuperLike: v })} />
          <ToggleRow label="اعلان هدیه دریافتی" checked={f.notifyGiftReceived} onChange={(v) => setF({ ...f, notifyGiftReceived: v })} />
          <ToggleRow label="اعلان انقضای اشتراک" checked={f.notifySubscriptionExpiry} onChange={(v) => setF({ ...f, notifySubscriptionExpiry: v })} />
          <ToggleRow label="اعلان پیام سیستمی" checked={f.notifySystemMessage} onChange={(v) => setF({ ...f, notifySystemMessage: v })} />
          <ToggleRow label="اعلان بازگشت سکه" checked={f.notifyCoinRefund} onChange={(v) => setF({ ...f, notifyCoinRefund: v })} />
          <ToggleRow label="اعلان نتیجه تایید هویت" checked={f.notifyIdentityResult} onChange={(v) => setF({ ...f, notifyIdentityResult: v })} />
          <ToggleRow label="اعلان بن/هشدار" checked={f.notifyBanWarning} onChange={(v) => setF({ ...f, notifyBanWarning: v })} />
          <ToggleRow label="غیرفعال کردن همه اعلان ها" checked={f.notifyDisableAll} onChange={(v) => setF({ ...f, notifyDisableAll: v })} />
        </div>
      </SettingsCard>
      <MessageBanner message={message} />
      <SaveButton loading={loading} />
    </form>
  );
}
