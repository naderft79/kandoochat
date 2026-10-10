// متادیتای صفحه ورود
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ورود",
  description: "ورود به حساب کاربری کندو — سایت همسریابی با پروفایل های تایید شده.",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
