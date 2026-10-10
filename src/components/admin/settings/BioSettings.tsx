"use client";

import { useState } from "react";
import { useSettingsSave, SaveButton, MessageBanner, SettingsCard, ToggleRow, NumberField } from "./shared";

type Props = {
  bioMaxLength: number;
  bioMinLength: number;
  bioFilterWords: boolean;
  bioAllowEmoji: boolean;
  bioAllowLink: boolean;
  bioAllowPhone: boolean;
  bioAllowInterestTags: boolean;
  bioMaxInterests: number;
  bioEditableAfterApproval: boolean;
  bioShowCompletionPercent: boolean;
  bioRequired: boolean;
  bioAllowMultiline: boolean;
};

export default function BioSettings(props: Props) {
  const { save, message, loading } = useSettingsSave();
  const [f, setF] = useState({
    bioMaxLength: String(props.bioMaxLength),
    bioMinLength: String(props.bioMinLength),
    bioFilterWords: props.bioFilterWords,
    bioAllowEmoji: props.bioAllowEmoji,
    bioAllowLink: props.bioAllowLink,
    bioAllowPhone: props.bioAllowPhone,
    bioAllowInterestTags: props.bioAllowInterestTags,
    bioMaxInterests: String(props.bioMaxInterests),
    bioEditableAfterApproval: props.bioEditableAfterApproval,
    bioShowCompletionPercent: props.bioShowCompletionPercent,
    bioRequired: props.bioRequired,
    bioAllowMultiline: props.bioAllowMultiline,
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    save({
      bioMaxLength: parseInt(f.bioMaxLength),
      bioMinLength: parseInt(f.bioMinLength),
      bioFilterWords: f.bioFilterWords,
      bioAllowEmoji: f.bioAllowEmoji,
      bioAllowLink: f.bioAllowLink,
      bioAllowPhone: f.bioAllowPhone,
      bioAllowInterestTags: f.bioAllowInterestTags,
      bioMaxInterests: parseInt(f.bioMaxInterests),
      bioEditableAfterApproval: f.bioEditableAfterApproval,
      bioShowCompletionPercent: f.bioShowCompletionPercent,
      bioRequired: f.bioRequired,
      bioAllowMultiline: f.bioAllowMultiline,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <SettingsCard>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <NumberField label="حداکثر طول بیو" value={f.bioMaxLength} onChange={(v) => setF({ ...f, bioMaxLength: v })} />
          <NumberField label="حداقل طول بیو" value={f.bioMinLength} onChange={(v) => setF({ ...f, bioMinLength: v })} />
          <NumberField label="حداکثر تعداد علایق" value={f.bioMaxInterests} onChange={(v) => setF({ ...f, bioMaxInterests: v })} />
        </div>
        <div className="space-y-2 mt-4">
          <ToggleRow label="فیلتر کلمات ممنوعه در بیو" checked={f.bioFilterWords} onChange={(v) => setF({ ...f, bioFilterWords: v })} />
          <ToggleRow label="اجازه ایموجی در بیو" checked={f.bioAllowEmoji} onChange={(v) => setF({ ...f, bioAllowEmoji: v })} />
          <ToggleRow label="اجازه لینک در بیو" checked={f.bioAllowLink} onChange={(v) => setF({ ...f, bioAllowLink: v })} />
          <ToggleRow label="اجازه شماره تماس در بیو" checked={f.bioAllowPhone} onChange={(v) => setF({ ...f, bioAllowPhone: v })} />
          <ToggleRow label="اجازه تگ علایق" checked={f.bioAllowInterestTags} onChange={(v) => setF({ ...f, bioAllowInterestTags: v })} />
          <ToggleRow label="اجازه ویرایش بیو بعد از تایید" checked={f.bioEditableAfterApproval} onChange={(v) => setF({ ...f, bioEditableAfterApproval: v })} />
          <ToggleRow label="نمایش درصد تکمیل بیو" checked={f.bioShowCompletionPercent} onChange={(v) => setF({ ...f, bioShowCompletionPercent: v })} />
          <ToggleRow label="الزام بیو برای کاربران" checked={f.bioRequired} onChange={(v) => setF({ ...f, bioRequired: v })} />
          <ToggleRow label="اجازه چند خطی بودن بیو" checked={f.bioAllowMultiline} onChange={(v) => setF({ ...f, bioAllowMultiline: v })} />
        </div>
      </SettingsCard>
      <MessageBanner message={message} />
      <SaveButton loading={loading} />
    </form>
  );
}
