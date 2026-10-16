// متادیتای صفحه ورود — نام برند از UA درخواست
import type { Metadata } from "next";
import { requestBrandName } from "@/lib/brand-server";

export async function generateMetadata(): Promise<Metadata> {
  const n = await requestBrandName();
  return {
    title: "ورود",
    description: `ورود به حساب کاربری ${n} — سایت همسریابی با پروفایل های تایید شده.`,
  };
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
