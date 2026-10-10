"use client";

import { useState } from "react";
import { useSettingsSave, SaveButton, MessageBanner, SettingsCard, ToggleRow, NumberField } from "./shared";

type Props = {
  maxGalleryPhotos: number;
  galleryPhotoMaxSizeMb: number;
  galleryAllowVideo: boolean;
  maxGalleryVideos: number;
  galleryVideoMaxSizeMb: number;
  galleryVideoMaxSeconds: number;
  galleryFreeUpload: boolean;
  vipMaxGalleryPhotos: number;
  autoApproveGallery: boolean;
  galleryAutoCompress: boolean;
  galleryShowUploadDate: boolean;
};

export default function GallerySettings(props: Props) {
  const { save, message, loading } = useSettingsSave();
  const [f, setF] = useState({
    maxGalleryPhotos: String(props.maxGalleryPhotos),
    galleryPhotoMaxSizeMb: String(props.galleryPhotoMaxSizeMb),
    galleryAllowVideo: props.galleryAllowVideo,
    maxGalleryVideos: String(props.maxGalleryVideos),
    galleryVideoMaxSizeMb: String(props.galleryVideoMaxSizeMb),
    galleryVideoMaxSeconds: String(props.galleryVideoMaxSeconds),
    galleryFreeUpload: props.galleryFreeUpload,
    vipMaxGalleryPhotos: String(props.vipMaxGalleryPhotos),
    autoApproveGallery: props.autoApproveGallery,
    galleryAutoCompress: props.galleryAutoCompress,
    galleryShowUploadDate: props.galleryShowUploadDate,
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    save({
      maxGalleryPhotos: parseInt(f.maxGalleryPhotos),
      galleryPhotoMaxSizeMb: parseInt(f.galleryPhotoMaxSizeMb),
      galleryAllowVideo: f.galleryAllowVideo,
      maxGalleryVideos: parseInt(f.maxGalleryVideos),
      galleryVideoMaxSizeMb: parseInt(f.galleryVideoMaxSizeMb),
      galleryVideoMaxSeconds: parseInt(f.galleryVideoMaxSeconds),
      galleryFreeUpload: f.galleryFreeUpload,
      vipMaxGalleryPhotos: parseInt(f.vipMaxGalleryPhotos),
      autoApproveGallery: f.autoApproveGallery,
      galleryAutoCompress: f.galleryAutoCompress,
      galleryShowUploadDate: f.galleryShowUploadDate,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <SettingsCard>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <NumberField label="حداکثر تعداد عکس گالری" value={f.maxGalleryPhotos} onChange={(v) => setF({ ...f, maxGalleryPhotos: v })} />
          <NumberField label="حداکثر حجم هر عکس (MB)" value={f.galleryPhotoMaxSizeMb} onChange={(v) => setF({ ...f, galleryPhotoMaxSizeMb: v })} />
          <NumberField label="حداکثر تعداد ویدیو" value={f.maxGalleryVideos} onChange={(v) => setF({ ...f, maxGalleryVideos: v })} />
          <NumberField label="حداکثر حجم ویدیو (MB)" value={f.galleryVideoMaxSizeMb} onChange={(v) => setF({ ...f, galleryVideoMaxSizeMb: v })} />
          <NumberField label="حداکثر مدت ویدیو (ثانیه)" value={f.galleryVideoMaxSeconds} onChange={(v) => setF({ ...f, galleryVideoMaxSeconds: v })} />
          <NumberField label="حداکثر تعداد گالری برای VIP" value={f.vipMaxGalleryPhotos} onChange={(v) => setF({ ...f, vipMaxGalleryPhotos: v })} />
        </div>
        <div className="space-y-2 mt-4">
          <ToggleRow label="اجازه آپلود ویدیو" checked={f.galleryAllowVideo} onChange={(v) => setF({ ...f, galleryAllowVideo: v })} />
          <ToggleRow label="اجازه آپلود برای کاربران رایگان" checked={f.galleryFreeUpload} onChange={(v) => setF({ ...f, galleryFreeUpload: v })} />
          <ToggleRow label="تایید خودکار عکس گالری" checked={f.autoApproveGallery} onChange={(v) => setF({ ...f, autoApproveGallery: v })} />
          <ToggleRow label="فشرده سازی خودکار عکس" checked={f.galleryAutoCompress} onChange={(v) => setF({ ...f, galleryAutoCompress: v })} />
          <ToggleRow label="نمایش تاریخ آپلود" checked={f.galleryShowUploadDate} onChange={(v) => setF({ ...f, galleryShowUploadDate: v })} />
        </div>
      </SettingsCard>
      <MessageBanner message={message} />
      <SaveButton loading={loading} />
    </form>
  );
}
