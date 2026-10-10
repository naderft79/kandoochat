"use client";

import { useState } from "react";
import { useSettingsSave, SaveButton, MessageBanner, SettingsCard, ToggleRow, NumberField, TextAreaField } from "./shared";

type Props = {
  requireIdentityForChat: boolean;
  identityValidityDays: number;
  identityRejectMessage: string;
  identityApproveMessage: string;
  identityRequiredPhotos: number;
  requireNationalId: boolean;
  requireSelfieFace: boolean;
  aiAutoVerifyIdentity: boolean;
  identityMinAge: number;
  showBlueBadge: boolean;
  revokeIdentityOnPhotoChange: boolean;
  vipChatWithoutIdentity: boolean;
};

export default function IdentitySettings(props: Props) {
  const { save, message, loading } = useSettingsSave();
  const [f, setF] = useState({
    requireIdentityForChat: props.requireIdentityForChat,
    identityValidityDays: String(props.identityValidityDays),
    identityRejectMessage: props.identityRejectMessage,
    identityApproveMessage: props.identityApproveMessage,
    identityRequiredPhotos: String(props.identityRequiredPhotos),
    requireNationalId: props.requireNationalId,
    requireSelfieFace: props.requireSelfieFace,
    aiAutoVerifyIdentity: props.aiAutoVerifyIdentity,
    identityMinAge: String(props.identityMinAge),
    showBlueBadge: props.showBlueBadge,
    revokeIdentityOnPhotoChange: props.revokeIdentityOnPhotoChange,
    vipChatWithoutIdentity: props.vipChatWithoutIdentity,
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    save({
      requireIdentityForChat: f.requireIdentityForChat,
      identityValidityDays: parseInt(f.identityValidityDays),
      identityRejectMessage: f.identityRejectMessage,
      identityApproveMessage: f.identityApproveMessage,
      identityRequiredPhotos: parseInt(f.identityRequiredPhotos),
      requireNationalId: f.requireNationalId,
      requireSelfieFace: f.requireSelfieFace,
      aiAutoVerifyIdentity: f.aiAutoVerifyIdentity,
      identityMinAge: parseInt(f.identityMinAge),
      showBlueBadge: f.showBlueBadge,
      revokeIdentityOnPhotoChange: f.revokeIdentityOnPhotoChange,
      vipChatWithoutIdentity: f.vipChatWithoutIdentity,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <SettingsCard>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <NumberField label="مدت اعتبار تایید (روز)" value={f.identityValidityDays} onChange={(v) => setF({ ...f, identityValidityDays: v })} />
          <NumberField label="تعداد عکس لازم برای تایید" value={f.identityRequiredPhotos} onChange={(v) => setF({ ...f, identityRequiredPhotos: v })} />
          <NumberField label="حداقل سن برای تایید" value={f.identityMinAge} onChange={(v) => setF({ ...f, identityMinAge: v })} />
        </div>
        <div className="space-y-4 mt-4">
          <TextAreaField label="پیام تایید موفق" value={f.identityApproveMessage} onChange={(v) => setF({ ...f, identityApproveMessage: v })} />
          <TextAreaField label="پیام رد تایید" value={f.identityRejectMessage} onChange={(v) => setF({ ...f, identityRejectMessage: v })} />
        </div>
        <div className="space-y-2 mt-4">
          <ToggleRow label="الزام تایید هویت قبل از چت" checked={f.requireIdentityForChat} onChange={(v) => setF({ ...f, requireIdentityForChat: v })} />
          <ToggleRow label="الزام عکس ملی" checked={f.requireNationalId} onChange={(v) => setF({ ...f, requireNationalId: v })} />
          <ToggleRow label="الزام سلفی با چهره" checked={f.requireSelfieFace} onChange={(v) => setF({ ...f, requireSelfieFace: v })} />
          <ToggleRow label="تایید خودکار با AI" checked={f.aiAutoVerifyIdentity} onChange={(v) => setF({ ...f, aiAutoVerifyIdentity: v })} />
          <ToggleRow label="نمایش تیک آبی در پروفایل" checked={f.showBlueBadge} onChange={(v) => setF({ ...f, showBlueBadge: v })} />
          <ToggleRow label="حذف تایید بعد از تغییر عکس" checked={f.revokeIdentityOnPhotoChange} onChange={(v) => setF({ ...f, revokeIdentityOnPhotoChange: v })} />
          <ToggleRow label="اجازه چت بدون تایید برای VIP" checked={f.vipChatWithoutIdentity} onChange={(v) => setF({ ...f, vipChatWithoutIdentity: v })} />
        </div>
      </SettingsCard>
      <MessageBanner message={message} />
      <SaveButton loading={loading} />
    </form>
  );
}
