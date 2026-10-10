// متادیتای صفحات ثبت نام
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ثبت نام",
  description: "ثبت نام رایگان در کندو — نیمه گمشده خود را پیدا کنید.",
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
