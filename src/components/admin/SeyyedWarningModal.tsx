"use client";

// مودال شوخی برای ورود «آقا سید» — هر نشست مرورگر یک بار نمایش داده می شود
import { useEffect, useState } from "react";
import { ShieldAlert } from "lucide-react";

const RULES = [
  "شیطنت",
  "آزار و اذیت پسران",
  "خنده و تمسخر کاربرا",
  "دست انداختن بقیه",
  "دزدیدن سکه از کاربرا",
  "لجبازی با مدیر اصلی",
  "فوش دادن تو چت پشتیبانی",
  "قضاوت عکس های بقیه با غرور",
  "گشتن دنبال زن واسه خودت تو پنل",
];

export default function SeyyedWarningModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // خواندن sessionStorage باید async انجام شود تا با SSR تداخل نکند
    void Promise.resolve().then(() => {
      if (!sessionStorage.getItem("seyyed_warned")) {
        sessionStorage.setItem("seyyed_warned", "1");
        setOpen(true);
      }
    });
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="lux-card w-full max-w-sm p-6 text-center">
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#d4af37]/15 flex items-center justify-center">
          <ShieldAlert className="w-7 h-7 text-[#d4af37]" />
        </div>
        <h2 className="text-base font-bold text-[#e8e8e8]">شیطونی نکنی</h2>
        <p className="text-2xl font-black lux-gold-text mt-1 mb-4">سید</p>
        <ul className="text-sm text-[#bbb] space-y-1.5 mb-2 leading-6">
          {RULES.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
        <p className="text-sm font-bold text-ig-red mb-5">ممنوعه</p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="lux-btn-gold w-full py-2.5 rounded-xl text-sm font-bold"
        >
          باشه عثلم
        </button>
      </div>
    </div>
  );
}
