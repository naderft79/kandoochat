// صفحه عمومی حذف حساب — بدون نیاز به نصب اپلیکیشن (الزام گوگل پلی)
// اگر کاربر وارد نشده باشد به ورود هدایت می شود و بعد به همین صفحه برمی گردد
import type { Metadata } from "next";
import Link from "next/link";
import { Trash2, ShieldAlert } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import BrandLogo from "@/components/BrandLogo";
import DeleteAccountForm from "@/components/auth/DeleteAccountForm";

export const metadata: Metadata = {
  title: "حذف حساب کاربری",
  description: "حذف دائمی حساب کاربری",
};

export default async function DeleteAccountPage() {
  const user = await getCurrentUser();

  return (
    <div className="min-h-dvh bg-gradient-to-b from-neutral-50 to-white">
      <div className="max-w-2xl mx-auto px-4 py-8 md:py-16">
        <div className="text-center mb-8">
          <BrandLogo iconClassName="w-10 h-10" textClassName="text-2xl" />
          <div className="flex items-center justify-center gap-2 mt-2">
            <Trash2 className="w-4 h-4 text-ig-gray" />
            <p className="text-sm text-ig-gray">حذف حساب کاربری</p>
          </div>
        </div>

        <div className="space-y-4">
          <section className="bg-surface border border-ig-border rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-ig-gray-bg flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5 text-ig-red" />
              </div>
              <h1 className="text-lg font-bold text-foreground">
                حذف حساب کاربری
              </h1>
            </div>
            <p className="text-sm text-foreground/70 leading-7">
              با حذف حساب، پروفایل شما بلافاصله پنهان، همه نشست ها باطل و هویت
              شما ناشناس می شود. در گفتگوها نام شما به صورت «کاربر حذف شده»
              نمایش داده می شود. تا ۳۰ روز امکان بازیابی از طریق پشتیبانی وجود
              دارد؛ پس از آن اطلاعات هویتی برای همیشه پاک می شود.
            </p>
          </section>

          {user ? (
            <section className="bg-surface border border-ig-border rounded-2xl p-6">
              <h2 className="text-sm font-bold text-foreground mb-3">
                تایید حذف حساب
              </h2>
              <DeleteAccountForm />
            </section>
          ) : (
            <section className="bg-surface border border-ig-border rounded-2xl p-6 text-center">
              <p className="text-sm text-foreground/70 leading-7 mb-4">
                برای حذف حساب ابتدا وارد حساب خود شوید. پس از ورود، به همین
                صفحه بازگردانده می شوید.
              </p>
              <Link
                href="/login?next=/delete-account"
                className="inline-block px-6 py-3 rounded-xl bg-ig-blue text-white text-sm font-bold hover:bg-ig-blue-hover transition-colors"
              >
                ورود به حساب
              </Link>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
