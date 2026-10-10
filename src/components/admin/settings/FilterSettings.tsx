"use client";

import { useState } from "react";
import { useSettingsSave, SaveButton, MessageBanner, SettingsCard, ToggleRow, NumberField } from "./shared";

type Props = {
  requireProfilePhoto: boolean;
  requireIdentityVerification: boolean;
  minProfileCompletion: number;
  requireBio: boolean;
  requireInterests: boolean;
  minProfilePhotos: number;
  hideBannedUsers: boolean;
  hideInactiveDays: number;
  filterOutOfAgeRange: boolean;
  hideNoLocation: boolean;
  requirePhoneVerified: boolean;
  minBioLengthForDisplay: number;
};

export default function FilterSettings(props: Props) {
  const { save, message, loading } = useSettingsSave();
  const [f, setF] = useState({
    requireProfilePhoto: props.requireProfilePhoto,
    requireIdentityVerification: props.requireIdentityVerification,
    minProfileCompletion: String(props.minProfileCompletion),
    requireBio: props.requireBio,
    requireInterests: props.requireInterests,
    minProfilePhotos: String(props.minProfilePhotos),
    hideBannedUsers: props.hideBannedUsers,
    hideInactiveDays: String(props.hideInactiveDays),
    filterOutOfAgeRange: props.filterOutOfAgeRange,
    hideNoLocation: props.hideNoLocation,
    requirePhoneVerified: props.requirePhoneVerified,
    minBioLengthForDisplay: String(props.minBioLengthForDisplay),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    save({
      requireProfilePhoto: f.requireProfilePhoto,
      requireIdentityVerification: f.requireIdentityVerification,
      minProfileCompletion: parseInt(f.minProfileCompletion),
      requireBio: f.requireBio,
      requireInterests: f.requireInterests,
      minProfilePhotos: parseInt(f.minProfilePhotos),
      hideBannedUsers: f.hideBannedUsers,
      hideInactiveDays: parseInt(f.hideInactiveDays),
      filterOutOfAgeRange: f.filterOutOfAgeRange,
      hideNoLocation: f.hideNoLocation,
      requirePhoneVerified: f.requirePhoneVerified,
      minBioLengthForDisplay: parseInt(f.minBioLengthForDisplay),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <SettingsCard>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <NumberField label="حداقل درصد تکمیل پروفایل برای نمایش" value={f.minProfileCompletion} onChange={(v) => setF({ ...f, minProfileCompletion: v })} hint="0 تا 100" />
          <NumberField label="حداقل تعداد عکس پروفایل" value={f.minProfilePhotos} onChange={(v) => setF({ ...f, minProfilePhotos: v })} />
          <NumberField label="مخفی کردن کاربران غیرفعال بیشتر از (روز)" value={f.hideInactiveDays} onChange={(v) => setF({ ...f, hideInactiveDays: v })} />
          <NumberField label="حداقل طول بیو برای نمایش" value={f.minBioLengthForDisplay} onChange={(v) => setF({ ...f, minBioLengthForDisplay: v })} />
        </div>
        <div className="space-y-2 mt-4">
          <ToggleRow label="الزام عکس پروفایل برای نمایش" checked={f.requireProfilePhoto} onChange={(v) => setF({ ...f, requireProfilePhoto: v })} />
          <ToggleRow label="الزام تایید هویت قبل از نمایش" checked={f.requireIdentityVerification} onChange={(v) => setF({ ...f, requireIdentityVerification: v })} />
          <ToggleRow label="الزام بیوگرافی" checked={f.requireBio} onChange={(v) => setF({ ...f, requireBio: v })} />
          <ToggleRow label="الزام انتخاب علایق" checked={f.requireInterests} onChange={(v) => setF({ ...f, requireInterests: v })} />
          <ToggleRow label="مخفی کردن کاربران بن شده" checked={f.hideBannedUsers} onChange={(v) => setF({ ...f, hideBannedUsers: v })} />
          <ToggleRow label="فیلتر کردن کاربران خارج از بازه سنی" checked={f.filterOutOfAgeRange} onChange={(v) => setF({ ...f, filterOutOfAgeRange: v })} />
          <ToggleRow label="مخفی کردن کاربران بدون موقعیت" checked={f.hideNoLocation} onChange={(v) => setF({ ...f, hideNoLocation: v })} />
          <ToggleRow label="الزام تایید موبایل برای نمایش" checked={f.requirePhoneVerified} onChange={(v) => setF({ ...f, requirePhoneVerified: v })} />
        </div>
      </SettingsCard>
      <MessageBanner message={message} />
      <SaveButton loading={loading} />
    </form>
  );
}
