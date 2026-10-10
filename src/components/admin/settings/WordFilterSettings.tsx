"use client";

import { useState } from "react";
import { useSettingsSave, SaveButton, MessageBanner, SettingsCard, ToggleRow, NumberField, TextAreaField, TextField } from "./shared";

type Props = {
  bannedWords: string;
  bannedWordReplacement: string;
  blockPhoneInMessage: boolean;
  blockLinkInMessage: boolean;
  blockEmailInMessage: boolean;
  bannedWordWarnCount: number;
  bannedWordAutoBanCount: number;
  filterBioWords: boolean;
  filterUsernameWords: boolean;
  filterStoryWords: boolean;
  softWarnWords: string;
};

export default function WordFilterSettings(props: Props) {
  const { save, message, loading } = useSettingsSave();
  const [f, setF] = useState({
    bannedWords: props.bannedWords,
    bannedWordReplacement: props.bannedWordReplacement,
    blockPhoneInMessage: props.blockPhoneInMessage,
    blockLinkInMessage: props.blockLinkInMessage,
    blockEmailInMessage: props.blockEmailInMessage,
    bannedWordWarnCount: String(props.bannedWordWarnCount),
    bannedWordAutoBanCount: String(props.bannedWordAutoBanCount),
    filterBioWords: props.filterBioWords,
    filterUsernameWords: props.filterUsernameWords,
    filterStoryWords: props.filterStoryWords,
    softWarnWords: props.softWarnWords,
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    save({
      bannedWords: f.bannedWords,
      bannedWordReplacement: f.bannedWordReplacement,
      blockPhoneInMessage: f.blockPhoneInMessage,
      blockLinkInMessage: f.blockLinkInMessage,
      blockEmailInMessage: f.blockEmailInMessage,
      bannedWordWarnCount: parseInt(f.bannedWordWarnCount),
      bannedWordAutoBanCount: parseInt(f.bannedWordAutoBanCount),
      filterBioWords: f.filterBioWords,
      filterUsernameWords: f.filterUsernameWords,
      filterStoryWords: f.filterStoryWords,
      softWarnWords: f.softWarnWords,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <SettingsCard>
        <div className="space-y-4">
          <TextAreaField label="لیست کلمات ممنوعه (با کاما جدا کنید)" value={f.bannedWords} onChange={(v) => setF({ ...f, bannedWords: v })} />
          <TextField label="جایگزینی کلمات ممنوعه با" value={f.bannedWordReplacement} onChange={(v) => setF({ ...f, bannedWordReplacement: v })} />
          <TextAreaField label="لیست کلمات اخطار نرم (هشدار بدون بستن)" value={f.softWarnWords} onChange={(v) => setF({ ...f, softWarnWords: v })} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <NumberField label="تعداد نقض قبل از هشدار" value={f.bannedWordWarnCount} onChange={(v) => setF({ ...f, bannedWordWarnCount: v })} />
            <NumberField label="تعداد نقض قبل از بن خودکار" value={f.bannedWordAutoBanCount} onChange={(v) => setF({ ...f, bannedWordAutoBanCount: v })} />
          </div>
        </div>
        <div className="space-y-2 mt-4">
          <ToggleRow label="بستن پیام حاوی شماره تماس" checked={f.blockPhoneInMessage} onChange={(v) => setF({ ...f, blockPhoneInMessage: v })} />
          <ToggleRow label="بستن پیام حاوی لینک" checked={f.blockLinkInMessage} onChange={(v) => setF({ ...f, blockLinkInMessage: v })} />
          <ToggleRow label="بستن پیام حاوی ایمیل" checked={f.blockEmailInMessage} onChange={(v) => setF({ ...f, blockEmailInMessage: v })} />
          <ToggleRow label="فیلتر کلمات در بیوگرافی" checked={f.filterBioWords} onChange={(v) => setF({ ...f, filterBioWords: v })} />
          <ToggleRow label="فیلتر کلمات در نام کاربری" checked={f.filterUsernameWords} onChange={(v) => setF({ ...f, filterUsernameWords: v })} />
          <ToggleRow label="فیلتر کلمات در استوری" checked={f.filterStoryWords} onChange={(v) => setF({ ...f, filterStoryWords: v })} />
        </div>
      </SettingsCard>
      <MessageBanner message={message} />
      <SaveButton loading={loading} />
    </form>
  );
}
