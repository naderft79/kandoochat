"use client";

import { useState } from "react";
import { useSettingsSave, SaveButton, MessageBanner, SettingsCard, ToggleRow, NumberField } from "./shared";

type Props = {
  chatAllowPhoto: boolean;
  chatAllowVoice: boolean;
  chatAllowVideo: boolean;
  chatMaxFileSizeMb: number;
  chatPhotoQuality: number;
  chatMaxVoiceSeconds: number;
  chatMaxVideoSeconds: number;
  chatAllowFile: boolean;
  chatPhotoCostCoins: number;
  chatVoiceCostCoins: number;
  chatMediaFreeDisabled: boolean;
  chatPhotoPreview: boolean;
};

export default function ChatMediaSettings(props: Props) {
  const { save, message, loading } = useSettingsSave();
  const [f, setF] = useState({
    chatAllowPhoto: props.chatAllowPhoto,
    chatAllowVoice: props.chatAllowVoice,
    chatAllowVideo: props.chatAllowVideo,
    chatMaxFileSizeMb: String(props.chatMaxFileSizeMb),
    chatPhotoQuality: String(props.chatPhotoQuality),
    chatMaxVoiceSeconds: String(props.chatMaxVoiceSeconds),
    chatMaxVideoSeconds: String(props.chatMaxVideoSeconds),
    chatAllowFile: props.chatAllowFile,
    chatPhotoCostCoins: String(props.chatPhotoCostCoins),
    chatVoiceCostCoins: String(props.chatVoiceCostCoins),
    chatMediaFreeDisabled: props.chatMediaFreeDisabled,
    chatPhotoPreview: props.chatPhotoPreview,
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    save({
      chatAllowPhoto: f.chatAllowPhoto,
      chatAllowVoice: f.chatAllowVoice,
      chatAllowVideo: f.chatAllowVideo,
      chatMaxFileSizeMb: parseInt(f.chatMaxFileSizeMb),
      chatPhotoQuality: parseInt(f.chatPhotoQuality),
      chatMaxVoiceSeconds: parseInt(f.chatMaxVoiceSeconds),
      chatMaxVideoSeconds: parseInt(f.chatMaxVideoSeconds),
      chatAllowFile: f.chatAllowFile,
      chatPhotoCostCoins: parseInt(f.chatPhotoCostCoins),
      chatVoiceCostCoins: parseInt(f.chatVoiceCostCoins),
      chatMediaFreeDisabled: f.chatMediaFreeDisabled,
      chatPhotoPreview: f.chatPhotoPreview,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <SettingsCard>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <NumberField label="حداکثر حجم فایل (MB)" value={f.chatMaxFileSizeMb} onChange={(v) => setF({ ...f, chatMaxFileSizeMb: v })} />
          <NumberField label="کیفیت فشرده سازی عکس (1-100)" value={f.chatPhotoQuality} onChange={(v) => setF({ ...f, chatPhotoQuality: v })} />
          <NumberField label="حداکثر مدت ویس (ثانیه)" value={f.chatMaxVoiceSeconds} onChange={(v) => setF({ ...f, chatMaxVoiceSeconds: v })} />
          <NumberField label="حداکثر مدت ویدیو (ثانیه)" value={f.chatMaxVideoSeconds} onChange={(v) => setF({ ...f, chatMaxVideoSeconds: v })} />
          <NumberField label="هزینه ارسال عکس (سکه)" value={f.chatPhotoCostCoins} onChange={(v) => setF({ ...f, chatPhotoCostCoins: v })} />
          <NumberField label="هزینه ارسال ویس (سکه)" value={f.chatVoiceCostCoins} onChange={(v) => setF({ ...f, chatVoiceCostCoins: v })} />
        </div>
        <div className="space-y-2 mt-4">
          <ToggleRow label="اجازه ارسال عکس در چت" checked={f.chatAllowPhoto} onChange={(v) => setF({ ...f, chatAllowPhoto: v })} />
          <ToggleRow label="اجازه ارسال ویس در چت" checked={f.chatAllowVoice} onChange={(v) => setF({ ...f, chatAllowVoice: v })} />
          <ToggleRow label="اجازه ارسال ویدیو در چت" checked={f.chatAllowVideo} onChange={(v) => setF({ ...f, chatAllowVideo: v })} />
          <ToggleRow label="اجازه ارسال فایل (PDF و...)" checked={f.chatAllowFile} onChange={(v) => setF({ ...f, chatAllowFile: v })} />
          <ToggleRow label="غیرفعال کردن مدیا برای کاربران رایگان" checked={f.chatMediaFreeDisabled} onChange={(v) => setF({ ...f, chatMediaFreeDisabled: v })} />
          <ToggleRow label="پیش نمایش عکس قبل از ارسال" checked={f.chatPhotoPreview} onChange={(v) => setF({ ...f, chatPhotoPreview: v })} />
        </div>
      </SettingsCard>
      <MessageBanner message={message} />
      <SaveButton loading={loading} />
    </form>
  );
}
