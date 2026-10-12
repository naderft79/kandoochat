// صفحه ورود اپ و مرورگر مدیریت — عمومی؛ با سشن معتبر مستقیم به پنل می رود
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSession, ADMIN_ROLES } from "@/lib/auth";
import AdminLoginForm from "./AdminLoginForm";

export const metadata: Metadata = {
  title: "مدیریت کندو",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  const session = await getSession();
  if (session) {
    redirect(
      (ADMIN_ROLES as readonly string[]).includes(session.role) ? "/admin" : "/dashboard"
    );
  }
  return <AdminLoginForm />;
}
