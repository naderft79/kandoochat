"use client";

import { useState } from "react";
import { useSettingsSave, SaveButton, MessageBanner, SettingsCard, ToggleRow, TextField } from "./shared";

type Props = {
  siteName: string;
  siteLogo: string;
  sitePrimaryColor: string;
  siteSecondaryColor: string;
  siteSlogan: string;
  siteFavicon: string;
  siteLoginBg: string;
  siteOgImage: string;
  siteFont: string;
  siteThemeMode: string;
  siteNotificationColor: string;
  siteButtonColor: string;
};

export default function BrandingSettings(props: Props) {
  const { save, message, loading } = useSettingsSave();
  const [f, setF] = useState({
    siteName: props.siteName,
    siteLogo: props.siteLogo,
    sitePrimaryColor: props.sitePrimaryColor,
    siteSecondaryColor: props.siteSecondaryColor,
    siteSlogan: props.siteSlogan,
    siteFavicon: props.siteFavicon,
    siteLoginBg: props.siteLoginBg,
    siteOgImage: props.siteOgImage,
    siteFont: props.siteFont,
    siteThemeMode: props.siteThemeMode,
    siteNotificationColor: props.siteNotificationColor,
    siteButtonColor: props.siteButtonColor,
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    save(f);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <SettingsCard>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField label="نام سایت" value={f.siteName} onChange={(v) => setF({ ...f, siteName: v })} />
          <TextField label="شعار سایت" value={f.siteSlogan} onChange={(v) => setF({ ...f, siteSlogan: v })} />
          <TextField label="رنگ اصلی" value={f.sitePrimaryColor} onChange={(v) => setF({ ...f, sitePrimaryColor: v })} hint="کد hex مثل #d4af37" />
          <TextField label="رنگ ثانویه" value={f.siteSecondaryColor} onChange={(v) => setF({ ...f, siteSecondaryColor: v })} hint="کد hex" />
          <TextField label="رنگ اعلان ها" value={f.siteNotificationColor} onChange={(v) => setF({ ...f, siteNotificationColor: v })} />
          <TextField label="رنگ دکمه ها" value={f.siteButtonColor} onChange={(v) => setF({ ...f, siteButtonColor: v })} />
          <TextField label="فونت پیش فرض" value={f.siteFont} onChange={(v) => setF({ ...f, siteFont: v })} />
          <TextField label="حالت تم" value={f.siteThemeMode} onChange={(v) => setF({ ...f, siteThemeMode: v })} hint="dark یا light" />
          <TextField label="URL لوگو" value={f.siteLogo} onChange={(v) => setF({ ...f, siteLogo: v })} />
          <TextField label="URL فاوآیکون" value={f.siteFavicon} onChange={(v) => setF({ ...f, siteFavicon: v })} />
          <TextField label="URL تصویر پس زمینه ورود" value={f.siteLoginBg} onChange={(v) => setF({ ...f, siteLoginBg: v })} />
          <TextField label="URL تصویر OG" value={f.siteOgImage} onChange={(v) => setF({ ...f, siteOgImage: v })} />
        </div>
      </SettingsCard>
      <MessageBanner message={message} />
      <SaveButton loading={loading} />
    </form>
  );
}
