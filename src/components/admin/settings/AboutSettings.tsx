"use client";

import { useState } from "react";
import { useSettingsSave, SaveButton, MessageBanner, SettingsCard, TextAreaField, TextField } from "./shared";

type Props = {
  aboutText: string;
  aboutContactInfo: string;
  aboutAddress: string;
  aboutPhone: string;
  aboutEmail: string;
  aboutSocialLinks: string;
  aboutSupportHours: string;
  aboutTelegram: string;
  aboutWhatsapp: string;
  aboutInstagram: string;
  aboutTeam: string;
  aboutFoundedYear: string;
};

export default function AboutSettings(props: Props) {
  const { save, message, loading } = useSettingsSave();
  const [f, setF] = useState({
    aboutText: props.aboutText,
    aboutContactInfo: props.aboutContactInfo,
    aboutAddress: props.aboutAddress,
    aboutPhone: props.aboutPhone,
    aboutEmail: props.aboutEmail,
    aboutSocialLinks: props.aboutSocialLinks,
    aboutSupportHours: props.aboutSupportHours,
    aboutTelegram: props.aboutTelegram,
    aboutWhatsapp: props.aboutWhatsapp,
    aboutInstagram: props.aboutInstagram,
    aboutTeam: props.aboutTeam,
    aboutFoundedYear: props.aboutFoundedYear,
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    save(f);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <SettingsCard>
        <div className="space-y-4">
          <TextAreaField label="متن درباره ما" value={f.aboutText} onChange={(v) => setF({ ...f, aboutText: v })} />
          <TextAreaField label="اطلاعات تماس" value={f.aboutContactInfo} onChange={(v) => setF({ ...f, aboutContactInfo: v })} />
          <TextAreaField label="آدرس" value={f.aboutAddress} onChange={(v) => setF({ ...f, aboutAddress: v })} />
          <TextAreaField label="تیم سایت" value={f.aboutTeam} onChange={(v) => setF({ ...f, aboutTeam: v })} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <TextField label="شماره تلفن" value={f.aboutPhone} onChange={(v) => setF({ ...f, aboutPhone: v })} />
          <TextField label="ایمیل پشتیبانی" value={f.aboutEmail} onChange={(v) => setF({ ...f, aboutEmail: v })} />
          <TextField label="ساعت کاری پشتیبانی" value={f.aboutSupportHours} onChange={(v) => setF({ ...f, aboutSupportHours: v })} />
          <TextField label="سال تاسیس" value={f.aboutFoundedYear} onChange={(v) => setF({ ...f, aboutFoundedYear: v })} />
          <TextField label="لینک تلگرام" value={f.aboutTelegram} onChange={(v) => setF({ ...f, aboutTelegram: v })} />
          <TextField label="لینک واتساپ" value={f.aboutWhatsapp} onChange={(v) => setF({ ...f, aboutWhatsapp: v })} />
          <TextField label="لینک اینستاگرام" value={f.aboutInstagram} onChange={(v) => setF({ ...f, aboutInstagram: v })} />
          <TextField label="لینک شبکه های اجتماعی (JSON)" value={f.aboutSocialLinks} onChange={(v) => setF({ ...f, aboutSocialLinks: v })} />
        </div>
      </SettingsCard>
      <MessageBanner message={message} />
      <SaveButton loading={loading} />
    </form>
  );
}
