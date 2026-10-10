"use client";

import { useState } from "react";
import { useSettingsSave, SaveButton, MessageBanner, SettingsCard, ToggleRow, NumberField, TextAreaField, TextField } from "./shared";

type Props = {
  freeTrialDays: number;
  firstPurchaseDiscount: number;
  subscriptionExpiryWarnDays: number;
  subscriptionExpiredMessage: string;
  autoRenewSubscription: boolean;
  subscriptionRefundEnabled: boolean;
  subscriptionRefundDays: number;
  showPriceIn: string;
  subscription3MonthPrice: number;
  subscription6MonthPrice: number;
  subscription12MonthPrice: number;
  longTermDiscount: number;
};

export default function SubscriptionSettings(props: Props) {
  const { save, message, loading } = useSettingsSave();
  const [f, setF] = useState({
    freeTrialDays: String(props.freeTrialDays),
    firstPurchaseDiscount: String(props.firstPurchaseDiscount),
    subscriptionExpiryWarnDays: String(props.subscriptionExpiryWarnDays),
    subscriptionExpiredMessage: props.subscriptionExpiredMessage,
    autoRenewSubscription: props.autoRenewSubscription,
    subscriptionRefundEnabled: props.subscriptionRefundEnabled,
    subscriptionRefundDays: String(props.subscriptionRefundDays),
    showPriceIn: props.showPriceIn,
    subscription3MonthPrice: String(props.subscription3MonthPrice),
    subscription6MonthPrice: String(props.subscription6MonthPrice),
    subscription12MonthPrice: String(props.subscription12MonthPrice),
    longTermDiscount: String(props.longTermDiscount),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    save({
      freeTrialDays: parseInt(f.freeTrialDays),
      firstPurchaseDiscount: parseInt(f.firstPurchaseDiscount),
      subscriptionExpiryWarnDays: parseInt(f.subscriptionExpiryWarnDays),
      subscriptionExpiredMessage: f.subscriptionExpiredMessage,
      autoRenewSubscription: f.autoRenewSubscription,
      subscriptionRefundEnabled: f.subscriptionRefundEnabled,
      subscriptionRefundDays: parseInt(f.subscriptionRefundDays),
      showPriceIn: f.showPriceIn,
      subscription3MonthPrice: parseInt(f.subscription3MonthPrice),
      subscription6MonthPrice: parseInt(f.subscription6MonthPrice),
      subscription12MonthPrice: parseInt(f.subscription12MonthPrice),
      longTermDiscount: parseInt(f.longTermDiscount),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <SettingsCard>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <NumberField label="روزهای تست رایگان" value={f.freeTrialDays} onChange={(v) => setF({ ...f, freeTrialDays: v })} hint="0 یعنی بدون تست" />
          <NumberField label="تخفیف اولین خرید (درصد)" value={f.firstPurchaseDiscount} onChange={(v) => setF({ ...f, firstPurchaseDiscount: v })} />
          <NumberField label="هشدار قبل از انقضا (روز)" value={f.subscriptionExpiryWarnDays} onChange={(v) => setF({ ...f, subscriptionExpiryWarnDays: v })} />
          <NumberField label="مدت بازگشت وجه (روز)" value={f.subscriptionRefundDays} onChange={(v) => setF({ ...f, subscriptionRefundDays: v })} />
          <NumberField label="قیمت اشتراک ۳ ماهه (تومان)" value={f.subscription3MonthPrice} onChange={(v) => setF({ ...f, subscription3MonthPrice: v })} hint="0 یعنی غیرفعال" />
          <NumberField label="قیمت اشتراک ۶ ماهه (تومان)" value={f.subscription6MonthPrice} onChange={(v) => setF({ ...f, subscription6MonthPrice: v })} hint="0 یعنی غیرفعال" />
          <NumberField label="قیمت اشتراک ۱۲ ماهه (تومان)" value={f.subscription12MonthPrice} onChange={(v) => setF({ ...f, subscription12MonthPrice: v })} hint="0 یعنی غیرفعال" />
          <NumberField label="تخفیف بلند مدت (درصد)" value={f.longTermDiscount} onChange={(v) => setF({ ...f, longTermDiscount: v })} />
          <TextField label="نمایش قیمت با" value={f.showPriceIn} onChange={(v) => setF({ ...f, showPriceIn: v })} hint="toman یا dollar" />
        </div>
        <div className="space-y-4 mt-4">
          <TextAreaField label="پیام انقضای اشتراک" value={f.subscriptionExpiredMessage} onChange={(v) => setF({ ...f, subscriptionExpiredMessage: v })} />
        </div>
        <div className="space-y-2 mt-4">
          <ToggleRow label="تمدید خودکار اشتراک" checked={f.autoRenewSubscription} onChange={(v) => setF({ ...f, autoRenewSubscription: v })} />
          <ToggleRow label="فعال بودن بازگشت وجه اشتراک" checked={f.subscriptionRefundEnabled} onChange={(v) => setF({ ...f, subscriptionRefundEnabled: v })} />
        </div>
      </SettingsCard>
      <MessageBanner message={message} />
      <SaveButton loading={loading} />
    </form>
  );
}
