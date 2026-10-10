// صفحه آفلاین PWA — وقتی شبکه قطع است و صفحه کش نشده
import Image from "next/image";
import { WifiOff } from "lucide-react";

export const metadata = {
  title: "آفلاین هستید",
};

export default function OfflinePage() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 text-center bg-white">
      <Image
        src="/bee-colori-logo.png"
        alt="کندو"
        width={96}
        height={96}
        className="mb-6"
      />
      <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
        <WifiOff className="w-8 h-8 text-neutral-400" strokeWidth={1.5} />
      </div>
      <h1 className="text-lg font-black text-foreground mb-2">به اینترنت متصل نیستید</h1>
      <p className="text-sm text-ig-gray leading-6 max-w-xs">
        اتصال اینترنت خود را بررسی کنید و دوباره تلاش کنید
      </p>
      <a
        href="/"
        className="mt-6 px-6 py-2.5 rounded-lg bg-neutral-800 text-white text-sm font-bold hover:bg-neutral-700 transition-colors"
      >
        تلاش مجدد
      </a>
    </div>
  );
}
