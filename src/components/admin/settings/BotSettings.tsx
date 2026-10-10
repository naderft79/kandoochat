"use client";

import { useState } from "react";
import { useSettingsSave, SaveButton, MessageBanner, SettingsCard, ToggleRow, NumberField, TextAreaField } from "./shared";

type Props = {
  botFemaleCount: number;
  botMaleCount: number;
  botEnabled: boolean;
  botMessages: string;
  botPhotos: string;
  botCanLike: boolean;
  botCanMessage: boolean;
  botCanStory: boolean;
  botUserPercent: number;
  botNewUsersOnly: boolean;
  botActiveDays: number;
  botDisableAfterRealLikes: number;
};

export default function BotSettings(props: Props) {
  const { save, message, loading } = useSettingsSave();
  const [f, setF] = useState({
    botFemaleCount: String(props.botFemaleCount),
    botMaleCount: String(props.botMaleCount),
    botEnabled: props.botEnabled,
    botMessages: props.botMessages,
    botPhotos: props.botPhotos,
    botCanLike: props.botCanLike,
    botCanMessage: props.botCanMessage,
    botCanStory: props.botCanStory,
    botUserPercent: String(props.botUserPercent),
    botNewUsersOnly: props.botNewUsersOnly,
    botActiveDays: String(props.botActiveDays),
    botDisableAfterRealLikes: String(props.botDisableAfterRealLikes),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    save({
      botFemaleCount: parseInt(f.botFemaleCount),
      botMaleCount: parseInt(f.botMaleCount),
      botEnabled: f.botEnabled,
      botMessages: f.botMessages,
      botPhotos: f.botPhotos,
      botCanLike: f.botCanLike,
      botCanMessage: f.botCanMessage,
      botCanStory: f.botCanStory,
      botUserPercent: parseInt(f.botUserPercent),
      botNewUsersOnly: f.botNewUsersOnly,
      botActiveDays: parseInt(f.botActiveDays),
      botDisableAfterRealLikes: parseInt(f.botDisableAfterRealLikes),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <SettingsCard>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <NumberField label="تعداد ربات زن" value={f.botFemaleCount} onChange={(v) => setF({ ...f, botFemaleCount: v })} />
          <NumberField label="تعداد ربات مرد" value={f.botMaleCount} onChange={(v) => setF({ ...f, botMaleCount: v })} />
          <NumberField label="درصد ربات در نتایج (0-100)" value={f.botUserPercent} onChange={(v) => setF({ ...f, botUserPercent: v })} />
          <NumberField label="روزهای فعال بودن ربات" value={f.botActiveDays} onChange={(v) => setF({ ...f, botActiveDays: v })} />
          <NumberField label="غیرفعال شدن بعد از X لایک واقعی" value={f.botDisableAfterRealLikes} onChange={(v) => setF({ ...f, botDisableAfterRealLikes: v })} />
        </div>
        <div className="space-y-4 mt-4">
          <TextAreaField label="پیام های ربات (هر خط یک پیام)" value={f.botMessages} onChange={(v) => setF({ ...f, botMessages: v })} />
          <TextAreaField label="عکس ربات ها (JSON)" value={f.botPhotos} onChange={(v) => setF({ ...f, botPhotos: v })} />
        </div>
        <div className="space-y-2 mt-4">
          <ToggleRow label="فعال بودن ربات ها" checked={f.botEnabled} onChange={(v) => setF({ ...f, botEnabled: v })} />
          <ToggleRow label="اجازه لایک به ربات" checked={f.botCanLike} onChange={(v) => setF({ ...f, botCanLike: v })} />
          <ToggleRow label="اجازه پیام به ربات" checked={f.botCanMessage} onChange={(v) => setF({ ...f, botCanMessage: v })} />
          <ToggleRow label="اجازه استوری به ربات" checked={f.botCanStory} onChange={(v) => setF({ ...f, botCanStory: v })} />
          <ToggleRow label="فقط برای کاربران جدید" checked={f.botNewUsersOnly} onChange={(v) => setF({ ...f, botNewUsersOnly: v })} />
        </div>
      </SettingsCard>
      <MessageBanner message={message} />
      <SaveButton loading={loading} />
    </form>
  );
}
