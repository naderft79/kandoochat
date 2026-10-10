"use client";

// مودال نتیجه پرداخت — نمایش وضعیت خرید بعد از بازگشت از KandooPay
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Suspense } from "react";
import Portal from "@/components/ui/Portal";

function PaymentResultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentStatus = searchParams.get("payment");
  const type = searchParams.get("type") || "COINS";

  const [show, setShow] = useState(!!paymentStatus);

  // نتیجه پرداخت به صورت مشتق از پارامترهای URL محاسبه می شود (بدون effect اضافه)
  const result = useMemo<{ ok: boolean; title: string; desc: string } | null>(() => {
    if (!paymentStatus) return null;
    switch (paymentStatus) {
      case "success":
        return {
          ok: true,
          title: type === "SUBSCRIPTION" ? "اشتراک شما فعال شد" : "سکه ها به کیف پول شما اضافه شد",
          desc: type === "SUBSCRIPTION" ? "اشتراک یک ماهه شما با موفقیت فعال شد" : "خرید سکه با موفقیت انجام شد",
        };
      case "canceled":
        return {
          ok: false,
          title: "پرداخت لغو شد",
          desc: "عملیات پرداخت توسط شما لغو شد. در صورت کسر مبلغ، ظرف ۲۴ ساعت بازگردانده می شود.",
        };
      case "failed":
        return {
          ok: false,
          title: "پرداخت ناموفق",
          desc: "پرداخت انجام نشد یا لغو شد. در صورت کسر مبلغ، ظرف ۲۴ ساعت بازگردانده می شود.",
        };
      case "already":
        return { ok: true, title: "این پرداخت قبلا ثبت شده", desc: "این سفارش قبلا پرداخت و تایید شده است." };
      case "invalid":
        return {
          ok: false,
          title: "درخواست نامعتبر",
          desc: "توکن پرداخت نامعتبر است یا منقضی شده.",
        };
      case "unauthorized":
        return {
          ok: false,
          title: "دسترسی غیرمجاز",
          desc: "این پرداخت متعلق به حساب شما نیست.",
        };
      case "error":
        return {
          ok: false,
          title: "خطای سرور",
          desc: "خطایی در پردازش پرداخت رخ داد. لطفا دوباره تلاش کنید.",
        };
      default:
        return null;
    }
  }, [paymentStatus, type]);

  function handleClose() {
    setShow(false);
    // پاک کردن query params از URL — با حفظ مسیر فعلی
    const currentPath = window.location.pathname;
    router.replace(currentPath);
  }

  if (!show || !paymentStatus) return null;

  return (
    <Portal>
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl">
        {result ? (
          <>
            <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${result.ok ? "bg-ig-gray-bg" : "bg-ig-gray-bg"}`}>
              {result.ok ? (
                <CheckCircle2 className="w-9 h-9 text-ig-gray" />
              ) : (
                <XCircle className="w-9 h-9 text-ig-red" />
              )}
            </div>
            <h2 className="text-lg font-bold text-foreground mb-2">{result.title}</h2>
            <p className="text-sm text-ig-gray mb-6">{result.desc}</p>
            <button
              onClick={handleClose}
              className={`w-full py-3 rounded-xl text-white text-sm font-bold transition-colors ${result.ok ? "bg-ig-blue hover:bg-ig-blue-hover" : "bg-ig-red hover:bg-ig-red/90"}`}
            >
              {result.ok ? "تایید و ادامه" : "بستن"}
            </button>
          </>
        ) : (
          <div className="py-8">
            <Loader2 className="w-12 h-12 text-ig-blue animate-spin mx-auto mb-4" />
            <p className="text-sm text-ig-gray">در حال تایید پرداخت...</p>
          </div>
        )}
      </div>
    </div>
    </Portal>
  );
}

export default function PaymentResultModal() {
  return (
    <Suspense fallback={null}>
      <PaymentResultContent />
    </Suspense>
  );
}
