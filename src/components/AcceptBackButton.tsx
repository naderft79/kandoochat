"use client";

// دکمه پذیرش در ته صفحات قوانین و حریم خصوصی — فقط کاربر را به صفحه قبلی برمی گرداند
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";

export default function AcceptBackButton({ label }: { label: string }) {
  const router = useRouter();

  function accept() {
    // اگر کاربر مستقیم وارد صفحه شده باشد و تاریخچه ای وجود نداشته باشد، به صفحه اصلی برمی گردد
    if (window.history.length > 1) router.back();
    else router.push("/");
  }

  return (
    <button
      type="button"
      onClick={accept}
      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-ig-blue text-white text-sm font-bold hover:bg-ig-blue-hover active:scale-[0.98] transition-all"
    >
      <Check className="w-4 h-4" strokeWidth={2.5} />
      {label}
    </button>
  );
}
