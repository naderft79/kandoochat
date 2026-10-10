"use client";

import { useState } from "react";
import { useSettingsSave, SaveButton, MessageBanner, SettingsCard, ToggleRow, NumberField } from "./shared";

type Props = {
  minProfilePhotosRequired: number;
  maxProfilePhotos: number;
  requireFacePhoto: boolean;
  autoApproveProfilePhoto: boolean;
  profilePhotoMaxSizeMb: number;
  profilePhotoMinPixels: number;
  allowPhotoFilter: boolean;
  aiFaceDetection: boolean;
  removeBlurryFace: boolean;
  requireNoGlasses: boolean;
  requireRealPhoto: boolean;
  showVerifiedPhotoBadge: boolean;
};

export default function ProfilePhotoSettings(props: Props) {
  const { save, message, loading } = useSettingsSave();
  const [f, setF] = useState({
    minProfilePhotosRequired: String(props.minProfilePhotosRequired),
    maxProfilePhotos: String(props.maxProfilePhotos),
    requireFacePhoto: props.requireFacePhoto,
    autoApproveProfilePhoto: props.autoApproveProfilePhoto,
    profilePhotoMaxSizeMb: String(props.profilePhotoMaxSizeMb),
    profilePhotoMinPixels: String(props.profilePhotoMinPixels),
    allowPhotoFilter: props.allowPhotoFilter,
    aiFaceDetection: props.aiFaceDetection,
    removeBlurryFace: props.removeBlurryFace,
    requireNoGlasses: props.requireNoGlasses,
    requireRealPhoto: props.requireRealPhoto,
    showVerifiedPhotoBadge: props.showVerifiedPhotoBadge,
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    save({
      minProfilePhotosRequired: parseInt(f.minProfilePhotosRequired),
      maxProfilePhotos: parseInt(f.maxProfilePhotos),
      requireFacePhoto: f.requireFacePhoto,
      autoApproveProfilePhoto: f.autoApproveProfilePhoto,
      profilePhotoMaxSizeMb: parseInt(f.profilePhotoMaxSizeMb),
      profilePhotoMinPixels: parseInt(f.profilePhotoMinPixels),
      allowPhotoFilter: f.allowPhotoFilter,
      aiFaceDetection: f.aiFaceDetection,
      removeBlurryFace: f.removeBlurryFace,
      requireNoGlasses: f.requireNoGlasses,
      requireRealPhoto: f.requireRealPhoto,
      showVerifiedPhotoBadge: f.showVerifiedPhotoBadge,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <SettingsCard>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <NumberField label="حداقل تعداد عکس پروفایل" value={f.minProfilePhotosRequired} onChange={(v) => setF({ ...f, minProfilePhotosRequired: v })} />
          <NumberField label="حداکثر تعداد عکس پروفایل" value={f.maxProfilePhotos} onChange={(v) => setF({ ...f, maxProfilePhotos: v })} />
          <NumberField label="حداکثر حجم هر عکس (MB)" value={f.profilePhotoMaxSizeMb} onChange={(v) => setF({ ...f, profilePhotoMaxSizeMb: v })} />
          <NumberField label="حداقل کیفیت عکس (پیکسل)" value={f.profilePhotoMinPixels} onChange={(v) => setF({ ...f, profilePhotoMinPixels: v })} />
        </div>
        <div className="space-y-2 mt-4">
          <ToggleRow label="الزام عکس با چهره" checked={f.requireFacePhoto} onChange={(v) => setF({ ...f, requireFacePhoto: v })} />
          <ToggleRow label="تایید خودکار عکس پروفایل" checked={f.autoApproveProfilePhoto} onChange={(v) => setF({ ...f, autoApproveProfilePhoto: v })} />
          <ToggleRow label="اجازه فیلتر روی عکس" checked={f.allowPhotoFilter} onChange={(v) => setF({ ...f, allowPhotoFilter: v })} />
          <ToggleRow label="تشخیص خودکار چهره با AI" checked={f.aiFaceDetection} onChange={(v) => setF({ ...f, aiFaceDetection: v })} />
          <ToggleRow label="حذف عکس با چهره غیر واضح" checked={f.removeBlurryFace} onChange={(v) => setF({ ...f, removeBlurryFace: v })} />
          <ToggleRow label="الزام عکس بدون عینک" checked={f.requireNoGlasses} onChange={(v) => setF({ ...f, requireNoGlasses: v })} />
          <ToggleRow label="الزام عکس واقعی (نه آواتار)" checked={f.requireRealPhoto} onChange={(v) => setF({ ...f, requireRealPhoto: v })} />
          <ToggleRow label="نمایش عکس تایید شده با تیک" checked={f.showVerifiedPhotoBadge} onChange={(v) => setF({ ...f, showVerifiedPhotoBadge: v })} />
        </div>
      </SettingsCard>
      <MessageBanner message={message} />
      <SaveButton loading={loading} />
    </form>
  );
}
