// صفحه درباره ما
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "درباره کندو",
  description: "کندو، سایت همسریابی با پروفایل های تایید شده و امنیت بالا — جایی برای پیدا کردن نیمه گمشده شما.",
};
import { Heart, Shield, Users, Sparkles } from "lucide-react";
import KandooLogo from "@/components/KandooLogo";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      <div className="max-w-2xl mx-auto px-4 py-8 md:py-16">
        <div className="text-center mb-8">
          <KandooLogo iconClassName="w-12 h-12" textClassName="text-3xl" />
          <p className="text-sm text-ig-gray mt-2">جایی برای پیدا کردن نیمه گمشده شما</p>
        </div>

        <div className="space-y-6">
          <section className="bg-white border border-ig-border rounded-2xl p-6">
            <h1 className="text-lg font-bold text-foreground mb-3">درباره کندو</h1>
            <p className="text-sm text-foreground/70 leading-7">
              کندو یک پلتفرم دوستیابی ایرانی است که با هدف ایجاد فضایی امن و راحت برای آشنایی افراد جدی طراحی شده است.
              ما با الهام از طراحی اینستاگرام، تجربه ای ساده و لذت بخش برای شما فراهم کرده ایم.
            </p>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-ig-border rounded-2xl p-5">
              <div className="w-10 h-10 rounded-xl ig-gradient flex items-center justify-center mb-3">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-sm font-bold text-foreground mb-1">امنیت بالا</h2>
              <p className="text-xs text-ig-gray leading-5">
                سیستم تایید هویت با کارت ملی و سلفی برای ایجاد فضایی امن
              </p>
            </div>

            <div className="bg-white border border-ig-border rounded-2xl p-5">
              <div className="w-10 h-10 rounded-xl ig-gradient flex items-center justify-center mb-3">
                <Users className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-sm font-bold text-foreground mb-1">کاربران واقعی</h2>
              <p className="text-xs text-ig-gray leading-5">
                تمام پروفایل ها با شماره موبایل واقعی ثبت نام می شوند
              </p>
            </div>

            <div className="bg-white border border-ig-border rounded-2xl p-5">
              <div className="w-10 h-10 rounded-xl ig-gradient flex items-center justify-center mb-3">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-sm font-bold text-foreground mb-1">آشنایی جدی</h2>
              <p className="text-xs text-ig-gray leading-5">
                پلتفرمی برای افرادی که به دنبال آشنایی جدی و ازدواج هستند
              </p>
            </div>

            <div className="bg-white border border-ig-border rounded-2xl p-5">
              <div className="w-10 h-10 rounded-xl ig-gradient flex items-center justify-center mb-3">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-sm font-bold text-foreground mb-1">تجربه ساده</h2>
              <p className="text-xs text-ig-gray leading-5">
                طراحی ساده و روان الهام گرفته از اینستاگرام
              </p>
            </div>
          </div>

          <div className="text-center pt-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full ig-gradient text-white text-sm font-bold hover:opacity-90 transition-opacity"
            >
              شروع کنید
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
