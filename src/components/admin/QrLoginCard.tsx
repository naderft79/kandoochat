// کارت QR لاگین سریع — فقط دسکتاپ؛ اسکن با گوشی روی شبکه محلی، ورود خودکار ادمین
import QRCode from "qrcode";
import { QrCode, Smartphone } from "lucide-react";
import { qrLoginEnabled, qrLoginUrl } from "@/lib/qr-login";

export default async function QrLoginCard() {
  if (!qrLoginEnabled()) return null;

  const url = await qrLoginUrl();
  const lanHost = url.replace(/^https?:\/\//, "").replace(/\/api\/qr-login.*$/, "");
  const dataUrl = await QRCode.toDataURL(url, {
    width: 320,
    margin: 2,
    color: { dark: "#1a1a1a", light: "#ffffff" },
  });

  return (
    <div className="lux-card p-5 hidden lg:flex items-center gap-5">
      <div className="rounded-xl bg-white p-2 border border-[rgba(212,175,55,0.2)] shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={dataUrl} alt="QR Code" className="w-28 h-28" />
      </div>
      <div className="min-w-0">
        <h2 className="text-sm font-black text-[#e8e8e8] flex items-center gap-2">
          <QrCode className="w-4 h-4 text-[#d4af37]" />
          ورود سریع با گوشی
        </h2>
        <p className="text-[#888] mt-1.5 text-xs leading-5 flex items-center gap-1.5">
          <Smartphone className="w-3.5 h-3.5 shrink-0" />
          این کد را با دوربین گوشی اسکن کنید — بدون وارد کردن اطلاعات، مستقیم وارد پنل مدیریت می شوید.
        </p>
        <p className="text-[10px] text-[#666] mt-1.5" dir="ltr">
          {lanHost}
        </p>
        <p className="text-[10px] text-[#d4af37]/70 mt-0.5">
          گوشی باید به همان وای فای سیستم متصل باشد
        </p>
      </div>
    </div>
  );
}
