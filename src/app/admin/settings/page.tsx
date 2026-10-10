// تنظیمات سایت: سبک اینستاگرام
import { getAllSettings } from "@/lib/settings";
import SettingsClient from "@/components/admin/SettingsClient";

export default async function AdminSettingsPage() {
  const settings = await getAllSettings();

  return <SettingsClient {...settings} />;
}
