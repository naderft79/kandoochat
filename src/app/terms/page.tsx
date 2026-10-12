// صفحه قوانین و مقررات
import type { Metadata } from "next";
import { FileText } from "lucide-react";

export const metadata: Metadata = {
  title: "قوانین و مقررات",
  description: "شرایط و قوانین استفاده از سایت همسریابی کندو.",
};
import KandooLogo from "@/components/KandooLogo";

export default function TermsPage() {
  return (
    <div className="min-h-dvh bg-gradient-to-b from-neutral-50 to-white">
      <div className="max-w-2xl mx-auto px-4 py-8 md:py-16">
        <div className="text-center mb-8">
          <KandooLogo iconClassName="w-10 h-10" textClassName="text-2xl" />
          <div className="flex items-center justify-center gap-2 mt-2">
            <FileText className="w-4 h-4 text-ig-gray" />
            <p className="text-sm text-ig-gray">قوانین و مقررات</p>
          </div>
        </div>

        <div className="space-y-4">
          <section className="bg-surface border border-ig-border rounded-2xl p-6">
            <h1 className="text-lg font-bold text-foreground mb-3">قوانین و مقررات کندو</h1>
            <p className="text-sm text-foreground/70 leading-7">
              با استفاده از کندو، شما موافقت می کنید که قوانین زیر را رعایت کنید. عدم رعایت این قوانین ممکن است منجر به مسدود شدن حساب شما شود.
            </p>
          </section>

          <section className="bg-surface border border-ig-border rounded-2xl p-6">
            <h2 className="text-sm font-bold text-foreground mb-3">۱. رفتار محترمانه</h2>
            <ul className="space-y-2 text-sm text-foreground/70 leading-6">
              <li>- با همه کاربران با احترام رفتار کنید</li>
              <li>- توهین، تهدید و harassing ممنوع است</li>
              <li>- ارسال محتوای نامناسب یا توهین آمیز ممنوع است</li>
            </ul>
          </section>

          <section className="bg-surface border border-ig-border rounded-2xl p-6">
            <h2 className="text-sm font-bold text-foreground mb-3">۲. پروفایل واقعی</h2>
            <ul className="space-y-2 text-sm text-foreground/70 leading-6">
              <li>- اطلاعات پروفایل باید واقعی و دقیق باشد</li>
              <li>- استفاده از عکس دیگران ممنوع است</li>
              <li>- هر شخص فقط می تواند یک حساب داشته باشد</li>
            </ul>
          </section>

          <section className="bg-surface border border-ig-border rounded-2xl p-6">
            <h2 className="text-sm font-bold text-foreground mb-3">۳. محتوای مجاز</h2>
            <ul className="space-y-2 text-sm text-foreground/70 leading-6">
              <li>- ارسال محتوای غیراخلاقی، خشونت آمیز یا غیرقانونی ممنوع است</li>
              <li>- تبلیغات و spam در چت ممنوع است</li>
              <li>- ارسال اطلاعات تماس شخصی در پروفایل توصیه نمی شود</li>
            </ul>
          </section>

          <section className="bg-surface border border-ig-border rounded-2xl p-6">
            <h2 className="text-sm font-bold text-foreground mb-3">۴. امنیت</h2>
            <ul className="space-y-2 text-sm text-foreground/70 leading-6">
              <li>- اطلاعات حساب خود را با دیگران به اشتراک نگذارید</li>
              <li>- فعالیت های مشکوک را گزارش کنید</li>
              <li>- کندو مسئولیتی در قبال ارتباطات خارج از پلتفرم ندارد</li>
            </ul>
          </section>

          <section className="bg-surface border border-ig-border rounded-2xl p-6">
            <h2 className="text-sm font-bold text-foreground mb-3">۵. پرداخت و بازگشت</h2>
            <ul className="space-y-2 text-sm text-foreground/70 leading-6">
              <li>- خرید سکه و اشتراک نهایی است</li>
              <li>- در صورت مشکل فنی، با پشتیبانی تماس بگیرید</li>
              <li>- برداشت سکه طبق قوانین بخش کیف پول انجام می شود</li>
            </ul>
          </section>

          <p className="text-xs text-ig-gray text-center pt-4">
            آخرین بروزرسانی: مرداد ۱۴۰۴
          </p>
        </div>
      </div>
    </div>
  );
}
