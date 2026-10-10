"use client";

import { useState } from "react";
import { useSettingsSave, SaveButton, MessageBanner, SettingsCard, TextAreaField } from "./shared";

type Props = {
  legalTerms: string;
  legalPrivacy: string;
  legalRefund: string;
  legalTermsOfUse: string;
  legalCookie: string;
  legalConsent: string;
  legalAgeWarning: string;
  legalAntiFraud: string;
  legalChatRules: string;
  legalPhotoRules: string;
  legalStoryRules: string;
  legalPaymentRules: string;
};

export default function LegalSettings(props: Props) {
  const { save, message, loading } = useSettingsSave();
  const [f, setF] = useState({
    legalTerms: props.legalTerms,
    legalPrivacy: props.legalPrivacy,
    legalRefund: props.legalRefund,
    legalTermsOfUse: props.legalTermsOfUse,
    legalCookie: props.legalCookie,
    legalConsent: props.legalConsent,
    legalAgeWarning: props.legalAgeWarning,
    legalAntiFraud: props.legalAntiFraud,
    legalChatRules: props.legalChatRules,
    legalPhotoRules: props.legalPhotoRules,
    legalStoryRules: props.legalStoryRules,
    legalPaymentRules: props.legalPaymentRules,
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    save(f);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <SettingsCard>
        <div className="space-y-4">
          <TextAreaField label="قوانین و مقررات" value={f.legalTerms} onChange={(v) => setF({ ...f, legalTerms: v })} />
          <TextAreaField label="حریم خصوصی" value={f.legalPrivacy} onChange={(v) => setF({ ...f, legalPrivacy: v })} />
          <TextAreaField label="سیاست بازگشت وجه" value={f.legalRefund} onChange={(v) => setF({ ...f, legalRefund: v })} />
          <TextAreaField label="شرایط استفاده" value={f.legalTermsOfUse} onChange={(v) => setF({ ...f, legalTermsOfUse: v })} />
          <TextAreaField label="سیاست کوکی" value={f.legalCookie} onChange={(v) => setF({ ...f, legalCookie: v })} />
          <TextAreaField label="رضایت آگاهانه" value={f.legalConsent} onChange={(v) => setF({ ...f, legalConsent: v })} />
          <TextAreaField label="هشدار سن" value={f.legalAgeWarning} onChange={(v) => setF({ ...f, legalAgeWarning: v })} />
          <TextAreaField label="ممنوعیت کلاهبرداری" value={f.legalAntiFraud} onChange={(v) => setF({ ...f, legalAntiFraud: v })} />
          <TextAreaField label="قوانین چت" value={f.legalChatRules} onChange={(v) => setF({ ...f, legalChatRules: v })} />
          <TextAreaField label="قوانین عکس" value={f.legalPhotoRules} onChange={(v) => setF({ ...f, legalPhotoRules: v })} />
          <TextAreaField label="قوانین استوری" value={f.legalStoryRules} onChange={(v) => setF({ ...f, legalStoryRules: v })} />
          <TextAreaField label="قوانین پرداخت" value={f.legalPaymentRules} onChange={(v) => setF({ ...f, legalPaymentRules: v })} />
        </div>
      </SettingsCard>
      <MessageBanner message={message} />
      <SaveButton loading={loading} />
    </form>
  );
}
