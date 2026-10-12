"use client";

import { useState } from "react";
import { useSettingsSave, SaveButton, MessageBanner, SettingsCard, ToggleRow, NumberField, TextAreaField } from "./shared";

type Props = {
  registrationClosed: boolean;
  requireEmailVerification: boolean;
  requirePhoneVerification: boolean;
  minRegisterAge: number;
  captchaEnabled: boolean;
  registerHourlyLimit: number;
  registerSuccessMessage: string;
  registerErrorMessage: string;
  registerGoogleEnabled: boolean;
};

export default function RegistrationSettings(props: Props) {
  const { save, message, loading } = useSettingsSave();
  const [f, setF] = useState({
    registrationClosed: props.registrationClosed,
    requireEmailVerification: props.requireEmailVerification,
    requirePhoneVerification: props.requirePhoneVerification,
    minRegisterAge: String(props.minRegisterAge),
    captchaEnabled: props.captchaEnabled,
    registerHourlyLimit: String(props.registerHourlyLimit),
    registerSuccessMessage: props.registerSuccessMessage,
    registerErrorMessage: props.registerErrorMessage,
    registerGoogleEnabled: props.registerGoogleEnabled,
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    save({
      registrationClosed: f.registrationClosed,
      requireEmailVerification: f.requireEmailVerification,
      requirePhoneVerification: f.requirePhoneVerification,
      minRegisterAge: parseInt(f.minRegisterAge),
      captchaEnabled: f.captchaEnabled,
      registerHourlyLimit: parseInt(f.registerHourlyLimit),
      registerSuccessMessage: f.registerSuccessMessage,
      registerErrorMessage: f.registerErrorMessage,
      registerGoogleEnabled: f.registerGoogleEnabled,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <SettingsCard>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <NumberField label="حداقل سن ثبت نام" value={f.minRegisterAge} onChange={(v) => setF({ ...f, minRegisterAge: v })} />
          <NumberField label="محدودیت ثبت نام در ساعت" value={f.registerHourlyLimit} onChange={(v) => setF({ ...f, registerHourlyLimit: v })} hint="0 یعنی بدون محدودیت" />
        </div>
        <div className="space-y-4 mt-4">
          <TextAreaField label="پیام موفقیت ثبت نام" value={f.registerSuccessMessage} onChange={(v) => setF({ ...f, registerSuccessMessage: v })} />
          <TextAreaField label="پیام خطای ثبت نام" value={f.registerErrorMessage} onChange={(v) => setF({ ...f, registerErrorMessage: v })} />
        </div>
        <div className="space-y-2 mt-4">
          <ToggleRow label="بستن ثبت نام موقت" checked={f.registrationClosed} onChange={(v) => setF({ ...f, registrationClosed: v })} />
          <ToggleRow label="تایید ایمیل اجباری" checked={f.requireEmailVerification} onChange={(v) => setF({ ...f, requireEmailVerification: v })} />
          <ToggleRow label="تایید موبایل اجباری" checked={f.requirePhoneVerification} onChange={(v) => setF({ ...f, requirePhoneVerification: v })} />
          <ToggleRow label="فعال بودن کپچا" checked={f.captchaEnabled} onChange={(v) => setF({ ...f, captchaEnabled: v })} />
          <ToggleRow label="فعال بودن ثبت نام با گوگل" checked={f.registerGoogleEnabled} onChange={(v) => setF({ ...f, registerGoogleEnabled: v })} />
        </div>
      </SettingsCard>
      <MessageBanner message={message} />
      <SaveButton loading={loading} />
    </form>
  );
}
