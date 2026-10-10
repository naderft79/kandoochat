"use client";

import { useState } from "react";
import { useSettingsSave, SaveButton, MessageBanner, SettingsCard, ToggleRow, NumberField, TextAreaField } from "./shared";

type Props = {
  couponEnabled: boolean;
  couponDefaultPercent: number;
  couponDefaultValidDays: number;
  couponMaxUses: number;
  couponMaxUsesPerUser: number;
  couponFirstPurchase: boolean;
  couponReturningUser: boolean;
  couponSpecialEvent: boolean;
  couponShowOnPurchase: boolean;
  couponUseMessage: string;
};

export default function CouponSettings(props: Props) {
  const { save, message, loading } = useSettingsSave();
  const [f, setF] = useState({
    couponEnabled: props.couponEnabled,
    couponDefaultPercent: String(props.couponDefaultPercent),
    couponDefaultValidDays: String(props.couponDefaultValidDays),
    couponMaxUses: String(props.couponMaxUses),
    couponMaxUsesPerUser: String(props.couponMaxUsesPerUser),
    couponFirstPurchase: props.couponFirstPurchase,
    couponReturningUser: props.couponReturningUser,
    couponSpecialEvent: props.couponSpecialEvent,
    couponShowOnPurchase: props.couponShowOnPurchase,
    couponUseMessage: props.couponUseMessage,
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    save({
      couponEnabled: f.couponEnabled,
      couponDefaultPercent: parseInt(f.couponDefaultPercent),
      couponDefaultValidDays: parseInt(f.couponDefaultValidDays),
      couponMaxUses: parseInt(f.couponMaxUses),
      couponMaxUsesPerUser: parseInt(f.couponMaxUsesPerUser),
      couponFirstPurchase: f.couponFirstPurchase,
      couponReturningUser: f.couponReturningUser,
      couponSpecialEvent: f.couponSpecialEvent,
      couponShowOnPurchase: f.couponShowOnPurchase,
      couponUseMessage: f.couponUseMessage,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <SettingsCard>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <NumberField label="درصد تخفیف پیش فرض" value={f.couponDefaultPercent} onChange={(v) => setF({ ...f, couponDefaultPercent: v })} />
          <NumberField label="مدت اعتبار پیش فرض (روز)" value={f.couponDefaultValidDays} onChange={(v) => setF({ ...f, couponDefaultValidDays: v })} />
          <NumberField label="حداکثر استفاده کلی" value={f.couponMaxUses} onChange={(v) => setF({ ...f, couponMaxUses: v })} />
          <NumberField label="حداکثر استفاده برای هر کاربر" value={f.couponMaxUsesPerUser} onChange={(v) => setF({ ...f, couponMaxUsesPerUser: v })} />
        </div>
        <div className="space-y-4 mt-4">
          <TextAreaField label="پیام استفاده از کد تخفیف" value={f.couponUseMessage} onChange={(v) => setF({ ...f, couponUseMessage: v })} />
        </div>
        <div className="space-y-2 mt-4">
          <ToggleRow label="فعال بودن کد تخفیف" checked={f.couponEnabled} onChange={(v) => setF({ ...f, couponEnabled: v })} />
          <ToggleRow label="فقط برای اولین خرید" checked={f.couponFirstPurchase} onChange={(v) => setF({ ...f, couponFirstPurchase: v })} />
          <ToggleRow label="برای کاربران بازگشتی" checked={f.couponReturningUser} onChange={(v) => setF({ ...f, couponReturningUser: v })} />
          <ToggleRow label="رویداد خاص" checked={f.couponSpecialEvent} onChange={(v) => setF({ ...f, couponSpecialEvent: v })} />
          <ToggleRow label="نمایش فیلد کد تخفیف در خرید" checked={f.couponShowOnPurchase} onChange={(v) => setF({ ...f, couponShowOnPurchase: v })} />
        </div>
      </SettingsCard>
      <MessageBanner message={message} />
      <SaveButton loading={loading} />
    </form>
  );
}
