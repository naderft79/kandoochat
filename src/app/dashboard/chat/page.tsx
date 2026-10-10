// صفحه اصلی چت: در موبایل لیست توسط layout نمایش داده می شود؛ در دسکتاپ این ناحیه راهنمای انتخاب گفتگو است
import { MessageCircle } from "lucide-react";

export default function ChatIndexPage() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-8">
      <div className="w-24 h-24 rounded-full border-2 border-foreground flex items-center justify-center mb-4">
        <MessageCircle className="w-12 h-12" strokeWidth={1.5} aria-hidden />
      </div>
      <h2 className="text-xl font-light text-foreground">پیام های شما</h2>
      <p className="text-sm text-ig-gray mt-1">یک گفتگو را انتخاب کنید یا گفتگوی جدید شروع کنید</p>
    </div>
  );
}
