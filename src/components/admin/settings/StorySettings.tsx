"use client";

import { useState } from "react";
import { useSettingsSave, SaveButton, MessageBanner, SettingsCard, ToggleRow, NumberField, TextField } from "./shared";

type Props = {
  storyDurationHours: number;
  storyMaxDaily: number;
  autoApproveStory: boolean;
  storyMaxSizeMb: number;
  storyAllowVideo: boolean;
  storyVideoMaxSeconds: number;
  storyAllowText: boolean;
  storyMaxTextLength: number;
  storyVisibleTo: string;
  storyAllowReply: boolean;
  storyShowViewers: boolean;
  storyAutoDeleteExpired: boolean;
};

export default function StorySettings(props: Props) {
  const { save, message, loading } = useSettingsSave();
  const [f, setF] = useState({
    storyDurationHours: String(props.storyDurationHours),
    storyMaxDaily: String(props.storyMaxDaily),
    autoApproveStory: props.autoApproveStory,
    storyMaxSizeMb: String(props.storyMaxSizeMb),
    storyAllowVideo: props.storyAllowVideo,
    storyVideoMaxSeconds: String(props.storyVideoMaxSeconds),
    storyAllowText: props.storyAllowText,
    storyMaxTextLength: String(props.storyMaxTextLength),
    storyVisibleTo: props.storyVisibleTo,
    storyAllowReply: props.storyAllowReply,
    storyShowViewers: props.storyShowViewers,
    storyAutoDeleteExpired: props.storyAutoDeleteExpired,
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    save({
      storyDurationHours: parseInt(f.storyDurationHours),
      storyMaxDaily: parseInt(f.storyMaxDaily),
      autoApproveStory: f.autoApproveStory,
      storyMaxSizeMb: parseInt(f.storyMaxSizeMb),
      storyAllowVideo: f.storyAllowVideo,
      storyVideoMaxSeconds: parseInt(f.storyVideoMaxSeconds),
      storyAllowText: f.storyAllowText,
      storyMaxTextLength: parseInt(f.storyMaxTextLength),
      storyVisibleTo: f.storyVisibleTo,
      storyAllowReply: f.storyAllowReply,
      storyShowViewers: f.storyShowViewers,
      storyAutoDeleteExpired: f.storyAutoDeleteExpired,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <SettingsCard>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <NumberField label="مدت نمایش استوری (ساعت)" value={f.storyDurationHours} onChange={(v) => setF({ ...f, storyDurationHours: v })} />
          <NumberField label="حداکثر استوری روزانه" value={f.storyMaxDaily} onChange={(v) => setF({ ...f, storyMaxDaily: v })} />
          <NumberField label="حداکثر حجم استوری (MB)" value={f.storyMaxSizeMb} onChange={(v) => setF({ ...f, storyMaxSizeMb: v })} />
          <NumberField label="حداکثر مدت ویدیو استوری (ثانیه)" value={f.storyVideoMaxSeconds} onChange={(v) => setF({ ...f, storyVideoMaxSeconds: v })} />
          <NumberField label="حداکثر طول متن استوری" value={f.storyMaxTextLength} onChange={(v) => setF({ ...f, storyMaxTextLength: v })} />
          <TextField label="نمایش استوری به" value={f.storyVisibleTo} onChange={(v) => setF({ ...f, storyVisibleTo: v })} hint="all یا matches" />
        </div>
        <div className="space-y-2 mt-4">
          <ToggleRow label="تایید خودکار استوری" checked={f.autoApproveStory} onChange={(v) => setF({ ...f, autoApproveStory: v })} />
          <ToggleRow label="اجازه استوری ویدیویی" checked={f.storyAllowVideo} onChange={(v) => setF({ ...f, storyAllowVideo: v })} />
          <ToggleRow label="اجازه استوری متنی" checked={f.storyAllowText} onChange={(v) => setF({ ...f, storyAllowText: v })} />
          <ToggleRow label="اجازه ریپلای روی استوری" checked={f.storyAllowReply} onChange={(v) => setF({ ...f, storyAllowReply: v })} />
          <ToggleRow label="نمایش لیست بینندگان" checked={f.storyShowViewers} onChange={(v) => setF({ ...f, storyShowViewers: v })} />
          <ToggleRow label="حذف خودکار استوری منقضی شده" checked={f.storyAutoDeleteExpired} onChange={(v) => setF({ ...f, storyAutoDeleteExpired: v })} />
        </div>
      </SettingsCard>
      <MessageBanner message={message} />
      <SaveButton loading={loading} />
    </form>
  );
}
