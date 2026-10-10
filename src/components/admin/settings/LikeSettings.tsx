"use client";

import { useState } from "react";
import { useSettingsSave, SaveButton, MessageBanner, SettingsCard, ToggleRow, NumberField } from "./shared";

type Props = {
  dailyLikeLimit: number;
  superLikeDailyLimit: number;
  superLikeCostCoins: number;
  likeCooldownSeconds: number;
  vipDailyLikeLimit: number;
  vipSuperLikeDailyLimit: number;
  likeExtraCostCoins: number;
  showLikersFree: boolean;
  likeRequireVerified: boolean;
  likeHourlyLimit: number;
  showReceivedLikes: boolean;
  likeAfterReject: boolean;
};

export default function LikeSettings(props: Props) {
  const { save, message, loading } = useSettingsSave();
  const [f, setF] = useState({
    dailyLikeLimit: String(props.dailyLikeLimit),
    superLikeDailyLimit: String(props.superLikeDailyLimit),
    superLikeCostCoins: String(props.superLikeCostCoins),
    likeCooldownSeconds: String(props.likeCooldownSeconds),
    vipDailyLikeLimit: String(props.vipDailyLikeLimit),
    vipSuperLikeDailyLimit: String(props.vipSuperLikeDailyLimit),
    likeExtraCostCoins: String(props.likeExtraCostCoins),
    showLikersFree: props.showLikersFree,
    likeRequireVerified: props.likeRequireVerified,
    likeHourlyLimit: String(props.likeHourlyLimit),
    showReceivedLikes: props.showReceivedLikes,
    likeAfterReject: props.likeAfterReject,
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    save({
      dailyLikeLimit: parseInt(f.dailyLikeLimit),
      superLikeDailyLimit: parseInt(f.superLikeDailyLimit),
      superLikeCostCoins: parseInt(f.superLikeCostCoins),
      likeCooldownSeconds: parseInt(f.likeCooldownSeconds),
      vipDailyLikeLimit: parseInt(f.vipDailyLikeLimit),
      vipSuperLikeDailyLimit: parseInt(f.vipSuperLikeDailyLimit),
      likeExtraCostCoins: parseInt(f.likeExtraCostCoins),
      showLikersFree: f.showLikersFree,
      likeRequireVerified: f.likeRequireVerified,
      likeHourlyLimit: parseInt(f.likeHourlyLimit),
      showReceivedLikes: f.showReceivedLikes,
      likeAfterReject: f.likeAfterReject,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <SettingsCard>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <NumberField label="محدودیت لایک روزانه (رایگان)" value={f.dailyLikeLimit} onChange={(v) => setF({ ...f, dailyLikeLimit: v })} />
          <NumberField label="محدودیت سوپر لایک روزانه (رایگان)" value={f.superLikeDailyLimit} onChange={(v) => setF({ ...f, superLikeDailyLimit: v })} />
          <NumberField label="هزینه سوپر لایک (سکه)" value={f.superLikeCostCoins} onChange={(v) => setF({ ...f, superLikeCostCoins: v })} />
          <NumberField label="Cooldown بین لایک ها (ثانیه)" value={f.likeCooldownSeconds} onChange={(v) => setF({ ...f, likeCooldownSeconds: v })} hint="0 یعنی بدون محدودیت" />
          <NumberField label="محدودیت لایک روزانه VIP" value={f.vipDailyLikeLimit} onChange={(v) => setF({ ...f, vipDailyLikeLimit: v })} />
          <NumberField label="محدودیت سوپر لایک روزانه VIP" value={f.vipSuperLikeDailyLimit} onChange={(v) => setF({ ...f, vipSuperLikeDailyLimit: v })} />
          <NumberField label="هزینه خرید لایک اضافی (سکه)" value={f.likeExtraCostCoins} onChange={(v) => setF({ ...f, likeExtraCostCoins: v })} />
          <NumberField label="محدودیت لایک در ساعت" value={f.likeHourlyLimit} onChange={(v) => setF({ ...f, likeHourlyLimit: v })} hint="0 یعنی بدون محدودیت" />
        </div>
        <div className="space-y-2 mt-4">
          <ToggleRow label="نمایش کاربرانی که لایک کرده اند (رایگان)" checked={f.showLikersFree} onChange={(v) => setF({ ...f, showLikersFree: v })} />
          <ToggleRow label="غیرفعال کردن لایک برای کاربران تایید نشده" checked={f.likeRequireVerified} onChange={(v) => setF({ ...f, likeRequireVerified: v })} />
          <ToggleRow label="نمایش تعداد لایک دریافتی در پروفایل" checked={f.showReceivedLikes} onChange={(v) => setF({ ...f, showReceivedLikes: v })} />
          <ToggleRow label="اجازه لایک بعد از ریجکت (rewind)" checked={f.likeAfterReject} onChange={(v) => setF({ ...f, likeAfterReject: v })} />
        </div>
      </SettingsCard>
      <MessageBanner message={message} />
      <SaveButton loading={loading} />
    </form>
  );
}
