// صفحه آفلاین PWA — وقتی شبکه قطع است و صفحه کش نشده
import Image from "next/image";
import { WifiOff } from "lucide-react";
import { getRequestBrand } from "@/lib/brand-server";

export const metadata = {
  title: "آفلاین هستید",
};

export default async function OfflinePage() {
  const brand = await getRequestBrand();
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 text-center bg-surface">
      {brand.id === "kandoo" ? (
        <Image
          src="/bee-colori-logo.png"
          alt={brand.name}
          width={96}
          height={96}
          className="mb-6"
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/api/brand-icon/192" alt={brand.name} width={96} height={96} className="mb-6 rounded-3xl" />
      )}
      <div className="w-16 h-16 rounded-full bg-ig-btn2 flex items-center justify-center mb-4">
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
