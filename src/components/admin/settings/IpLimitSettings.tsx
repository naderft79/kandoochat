"use client";

import { useState } from "react";
import { useSettingsSave, SaveButton, MessageBanner, SettingsCard, ToggleRow, NumberField, TextAreaField } from "./shared";

type Props = {
  preventMultiAccountIp: boolean;
  maxAccountsPerIp: number;
  blockedIps: string;
  whitelistedIps: string;
  blockVpn: boolean;
  blockTor: boolean;
  blockProxy: boolean;
  showUserIpAdmin: boolean;
  loginFailWarnCount: number;
  loginFailBanCount: number;
  ipBanDurationHours: number;
  adminIpOverride: boolean;
};

export default function IpLimitSettings(props: Props) {
  const { save, message, loading } = useSettingsSave();
  const [f, setF] = useState({
    preventMultiAccountIp: props.preventMultiAccountIp,
    maxAccountsPerIp: String(props.maxAccountsPerIp),
    blockedIps: props.blockedIps,
    whitelistedIps: props.whitelistedIps,
    blockVpn: props.blockVpn,
    blockTor: props.blockTor,
    blockProxy: props.blockProxy,
    showUserIpAdmin: props.showUserIpAdmin,
    loginFailWarnCount: String(props.loginFailWarnCount),
    loginFailBanCount: String(props.loginFailBanCount),
    ipBanDurationHours: String(props.ipBanDurationHours),
    adminIpOverride: props.adminIpOverride,
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    save({
      preventMultiAccountIp: f.preventMultiAccountIp,
      maxAccountsPerIp: parseInt(f.maxAccountsPerIp),
      blockedIps: f.blockedIps,
      whitelistedIps: f.whitelistedIps,
      blockVpn: f.blockVpn,
      blockTor: f.blockTor,
      blockProxy: f.blockProxy,
      showUserIpAdmin: f.showUserIpAdmin,
      loginFailWarnCount: parseInt(f.loginFailWarnCount),
      loginFailBanCount: parseInt(f.loginFailBanCount),
      ipBanDurationHours: parseInt(f.ipBanDurationHours),
      adminIpOverride: f.adminIpOverride,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <SettingsCard>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <NumberField label="حداکثر حساب از یک IP" value={f.maxAccountsPerIp} onChange={(v) => setF({ ...f, maxAccountsPerIp: v })} />
          <NumberField label="هشدار بعد از X ورود ناموفق" value={f.loginFailWarnCount} onChange={(v) => setF({ ...f, loginFailWarnCount: v })} />
          <NumberField label="بن IP بعد از X ورود ناموفق" value={f.loginFailBanCount} onChange={(v) => setF({ ...f, loginFailBanCount: v })} />
          <NumberField label="مدت بن IP (ساعت)" value={f.ipBanDurationHours} onChange={(v) => setF({ ...f, ipBanDurationHours: v })} />
        </div>
        <div className="space-y-4 mt-4">
          <TextAreaField label="لیست IP های مسدود (هر خط یک IP)" value={f.blockedIps} onChange={(v) => setF({ ...f, blockedIps: v })} />
          <TextAreaField label="لیست IP های مجاز whitelist (هر خط یک IP)" value={f.whitelistedIps} onChange={(v) => setF({ ...f, whitelistedIps: v })} />
        </div>
        <div className="space-y-2 mt-4">
          <ToggleRow label="جلوگیری از چند حسابی با یک IP" checked={f.preventMultiAccountIp} onChange={(v) => setF({ ...f, preventMultiAccountIp: v })} />
          <ToggleRow label="مسدود کردن VPN" checked={f.blockVpn} onChange={(v) => setF({ ...f, blockVpn: v })} />
          <ToggleRow label="مسدود کردن Tor" checked={f.blockTor} onChange={(v) => setF({ ...f, blockTor: v })} />
          <ToggleRow label="مسدود کردن پروکسی" checked={f.blockProxy} onChange={(v) => setF({ ...f, blockProxy: v })} />
          <ToggleRow label="نمایش IP کاربر در پروفایل ادمین" checked={f.showUserIpAdmin} onChange={(v) => setF({ ...f, showUserIpAdmin: v })} />
          <ToggleRow label="اجازه override برای ادمین" checked={f.adminIpOverride} onChange={(v) => setF({ ...f, adminIpOverride: v })} />
        </div>
      </SettingsCard>
      <MessageBanner message={message} />
      <SaveButton loading={loading} />
    </form>
  );
}
