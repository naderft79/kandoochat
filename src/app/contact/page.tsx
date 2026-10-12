// صفحه تماس با ما
import type { Metadata } from "next";
import { Mail, Phone, MessageCircle, Send, Headphones } from "lucide-react";

export const metadata: Metadata = {
  title: "تماس با ما",
  description: "راه های ارتباط با پشتیبانی کندو — پاسخگویی سریع به سوالات و مشکلات شما.",
};
import KandooLogo from "@/components/KandooLogo";
import ContactForm from "@/components/ContactForm";
import { SUPPORT_EMAIL } from "@/lib/site";

export default function ContactPage() {
  return (
    <div className="min-h-dvh bg-gradient-to-b from-neutral-50 to-white">
      <div className="max-w-2xl mx-auto px-4 py-8 md:py-16">
        <div className="text-center mb-8">
          <KandooLogo iconClassName="w-10 h-10" textClassName="text-2xl" />
        </div>

        <div className="bg-surface border border-ig-border rounded-2xl p-6 mb-4">
          <h1 className="text-lg font-bold text-foreground mb-4">تماس با ما</h1>
          <p className="text-sm text-foreground/70 leading-7 mb-6">
            سوال، پیشنهاد یا انتقاد دارید؟ از راه های زیر با ما در ارتباط باشید. ما در اسرع وقت پاسخگو هستیم.
          </p>

          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-ig-gray-bg">
              <div className="w-10 h-10 rounded-xl ig-gradient flex items-center justify-center shrink-0">
                <Headphones className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-ig-gray">پشتیبانی داخل برنامه</p>
                <a href="/dashboard/support" className="text-sm font-bold text-foreground hover:text-ig-blue transition-colors">
                  ارسال تیکت پشتیبانی
                </a>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-ig-gray-bg">
              <div className="w-10 h-10 rounded-xl ig-gradient flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-ig-gray">ایمیل</p>
                <p className="text-sm font-bold text-foreground" dir="ltr">{SUPPORT_EMAIL}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-ig-gray-bg">
              <div className="w-10 h-10 rounded-xl ig-gradient flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-ig-gray">تلفن پشتیبانی</p>
                <p className="text-sm font-bold text-foreground" dir="ltr">۰۲۱-۱۲۳۴۵۶۷۸</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-ig-gray-bg">
              <div className="w-10 h-10 rounded-xl ig-gradient flex items-center justify-center shrink-0">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-ig-gray">پشتیبانی تلگرام</p>
                <p className="text-sm font-bold text-foreground" dir="ltr">@kandoo_support</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-surface border border-ig-border rounded-2xl p-6">
          <h2 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
            <Send className="w-4 h-4 text-ig-blue" />
            ارسال پیام
          </h2>
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
