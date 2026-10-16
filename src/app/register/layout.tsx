// متادیتای صفحات ثبت نام — نام برند از UA درخواست
import type { Metadata } from "next";
import { requestBrandName } from "@/lib/brand-server";

export async function generateMetadata(): Promise<Metadata> {
  const n = await requestBrandName();
  return {
    title: "ثبت نام",
    description: `ثبت نام رایگان در ${n} — نیمه گمشده خود را پیدا کنید.`,
  };
}

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
