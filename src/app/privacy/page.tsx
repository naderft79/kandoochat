// صفحه حریم خصوصی
import type { Metadata } from "next";
import { Lock, Shield, Eye, UserCheck } from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
  const n = await requestBrandName();
  return {
    title: "حریم خصوصی",
    description: `سیاست های حفظ حریم خصوصی و امنیت اطلاعات کاربران در ${n}.`,
  };
}
import { requestBrandName } from "@/lib/brand-server";
import BrandLogo from "@/components/BrandLogo";
import AcceptBackButton from "@/components/AcceptBackButton";

export default async function PrivacyPage() {
  const n = await requestBrandName();
  return (
    <div className="min-h-dvh bg-gradient-to-b from-neutral-50 to-white">
      <div className="max-w-2xl mx-auto px-4 py-8 md:py-16">
        <div className="text-center mb-8">
          <BrandLogo iconClassName="w-10 h-10" textClassName="text-2xl" />
          <div className="flex items-center justify-center gap-2 mt-2">
            <Lock className="w-4 h-4 text-ig-gray" />
            <p className="text-sm text-ig-gray">حریم خصوصی</p>
          </div>
        </div>

        <div className="space-y-4">
          <section className="bg-surface border border-ig-border rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl ig-gradient flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-lg font-bold text-foreground">سیاست حریم خصوصی {n}</h1>
            </div>
            <p className="text-sm text-foreground/70 leading-7">
              {n} متعهد به حفاظت از اطلاعات شخصی شماست. این سند توضیح می دهد که چه اطلاعاتی از شما جمع آوری می شود و چگونه استفاده می شود.
            </p>
          </section>

          <section className="bg-surface border border-ig-border rounded-2xl p-6">
            <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <Eye className="w-4 h-4 text-ig-blue" />
              اطلاعاتی که جمع آوری می کنیم
            </h2>
            <ul className="space-y-2 text-sm text-foreground/70 leading-6">
              <li>- اطلاعات پروفایل: نام، سن، شهر، قد، وزن، شغل و بیوگرافی</li>
              <li>- شماره موبایل برای تایید هویت</li>
              <li>- عکس های پروفایل و گالری</li>
              <li>- اطلاعات فعالیت: لایک ها، بازدید ها و پیام ها</li>
              <li>- اطلاعات دستگاه برای امنیت و پشتیبانی</li>
              <li>- رویدادهای امنیتی: ورودها، IP و لاگ اقدامات مدیریتی</li>
              <li>- آمار بازدید صفحات: بدون ذخیره IP خام؛ شناسه بازدیدکننده فقط به صورت هش روزانه با نمک نگه داشته می شود</li>
            </ul>
          </section>

          <section className="bg-surface border border-ig-border rounded-2xl p-6">
            <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-ig-blue" />
              دسترسی مدیران به داده های شما
            </h2>
            <ul className="space-y-2 text-sm text-foreground/70 leading-6">
              <li>- آدرس IP خام فقط برای مدیران با مجوز کامل قابل مشاهده است؛ سایر مدیران فقط کشور را می بینند</li>
              <li>- متن پیام های خصوصی فقط برای مدیران با مجوز مخصوص و جهت بررسی تخلف قابل مشاهده است</li>
              <li>- هر مشاهده اطلاعات حساس (پیام ها، IP و خروجی فایل) در لاگ اقدامات مدیریتی ثبت می شود</li>
              <li>- مدیران پشتیبانی و محتوا به اطلاعات مالی و پیام های خصوصی دسترسی ندارند</li>
            </ul>
          </section>

          <section className="bg-surface border border-ig-border rounded-2xl p-6">
            <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-ig-blue" />
              نحوه استفاده از اطلاعات
            </h2>
            <ul className="space-y-2 text-sm text-foreground/70 leading-6">
              <li>- نمایش پروفایل شما به سایر کاربران</li>
              <li>- ارسال نوتیفیکیشن های درون برنامه</li>
              <li>- بهبود الگوریتم پیشنهاد روزانه</li>
              <li>- جلوگیری از کاربران مزاحم و تقلبی</li>
              <li>- پشتیبانی و پاسخ به درخواست های شما</li>
            </ul>
          </section>

          <section className="bg-surface border border-ig-border rounded-2xl p-6">
            <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <Lock className="w-4 h-4 text-ig-blue" />
              کنترل شما
            </h2>
            <ul className="space-y-2 text-sm text-foreground/70 leading-6">
              <li>- می توانید از تنظیمات کنترل کنید چه اطلاعاتی نمایش داده شود</li>
              <li>- می توانید نوتیفیکیشن ها را خاموش یا روشن کنید</li>
              <li>- می توانید کاربران را بلاک کنید</li>
              <li>- می توانید از همه دستگاه ها خارج شوید</li>
              <li>- اطلاعات شما هرگز به اشخاص ثالث فروخته نمی شود</li>
            </ul>
          </section>

          <section className="bg-surface border border-ig-border rounded-2xl p-6">
            <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-ig-blue" />
              حذف حساب کاربری
            </h2>
            <ul className="space-y-2 text-sm text-foreground/70 leading-6">
              <li>- از مسیر تنظیمات → حذف حساب کاربری یا صفحه <a href="/delete-account" className="text-ig-blue">/delete-account</a> می توانید حساب خود را حذف کنید</li>
              <li>- بلافاصله پروفایل شما پنهان، همه نشست ها باطل و هویت شما ناشناس می شود</li>
              <li>- عکس ها و سوابق مالی حفظ می شوند اما هویت شما در گفتگوها «کاربر حذف شده» نمایش داده می شود</li>
              <li>- تا ۳۰ روز امکان بازیابی با تماس با پشتیبانی وجود دارد؛ پس از آن اطلاعات هویتی برای همیشه پاک می شود</li>
            </ul>
          </section>

          <p className="text-xs text-ig-gray text-center pt-4">
            آخرین بروزرسانی: آبان ۱۴۰۴
          </p>

          <AcceptBackButton label="قبول حریم خصوصی" />
        </div>
      </div>
    </div>
  );
}
