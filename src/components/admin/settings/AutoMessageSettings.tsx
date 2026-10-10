"use client";

import { useState } from "react";
import { useSettingsSave, SaveButton, MessageBanner, SettingsCard, TextAreaField } from "./shared";

type Props = {
  automsgBirthday: string;
  automsgAnniversary: string;
  automsgLongMembership: string;
  automsgWelcomeRegister: string;
  automsgCompleteProfile: string;
  automsgUploadPhoto: string;
  automsgBuySubscription: string;
  automsgInactiveReturn: string;
  automsgStreakReminder: string;
  automsgStreakReward: string;
  automsgInviteFriends: string;
  automsgSurvey: string;
};

export default function AutoMessageSettings(props: Props) {
  const { save, message, loading } = useSettingsSave();
  const [f, setF] = useState({
    automsgBirthday: props.automsgBirthday,
    automsgAnniversary: props.automsgAnniversary,
    automsgLongMembership: props.automsgLongMembership,
    automsgWelcomeRegister: props.automsgWelcomeRegister,
    automsgCompleteProfile: props.automsgCompleteProfile,
    automsgUploadPhoto: props.automsgUploadPhoto,
    automsgBuySubscription: props.automsgBuySubscription,
    automsgInactiveReturn: props.automsgInactiveReturn,
    automsgStreakReminder: props.automsgStreakReminder,
    automsgStreakReward: props.automsgStreakReward,
    automsgInviteFriends: props.automsgInviteFriends,
    automsgSurvey: props.automsgSurvey,
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    save(f);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <SettingsCard>
        <div className="space-y-4">
          <TextAreaField label="پیام تولد" value={f.automsgBirthday} onChange={(v) => setF({ ...f, automsgBirthday: v })} />
          <TextAreaField label="پیام سالگرد عضویت" value={f.automsgAnniversary} onChange={(v) => setF({ ...f, automsgAnniversary: v })} />
          <TextAreaField label="پیام عضویت طولانی مدت" value={f.automsgLongMembership} onChange={(v) => setF({ ...f, automsgLongMembership: v })} />
          <TextAreaField label="پیام خوش آمدگویی ثبت نام" value={f.automsgWelcomeRegister} onChange={(v) => setF({ ...f, automsgWelcomeRegister: v })} />
          <TextAreaField label="پیام تکمیل پروفایل" value={f.automsgCompleteProfile} onChange={(v) => setF({ ...f, automsgCompleteProfile: v })} />
          <TextAreaField label="پیام آپلود عکس" value={f.automsgUploadPhoto} onChange={(v) => setF({ ...f, automsgUploadPhoto: v })} />
          <TextAreaField label="پیام خرید اشتراک" value={f.automsgBuySubscription} onChange={(v) => setF({ ...f, automsgBuySubscription: v })} />
          <TextAreaField label="پیام بازگشت کاربر غیرفعال" value={f.automsgInactiveReturn} onChange={(v) => setF({ ...f, automsgInactiveReturn: v })} />
          <TextAreaField label="پیام یادآوری استریک" value={f.automsgStreakReminder} onChange={(v) => setF({ ...f, automsgStreakReminder: v })} />
          <TextAreaField label="پیام پاداش استریک" value={f.automsgStreakReward} onChange={(v) => setF({ ...f, automsgStreakReward: v })} />
          <TextAreaField label="پیام دعوت دوستان" value={f.automsgInviteFriends} onChange={(v) => setF({ ...f, automsgInviteFriends: v })} />
          <TextAreaField label="پیام نظرسنجی" value={f.automsgSurvey} onChange={(v) => setF({ ...f, automsgSurvey: v })} />
        </div>
      </SettingsCard>
      <MessageBanner message={message} />
      <SaveButton loading={loading} />
    </form>
  );
}
