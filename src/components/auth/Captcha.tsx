"use client";

// کپچای خودمیزبان — عکس SVG + فیلد ورودی + دکمه تازه سازی
// با prop «refreshKey» والد می تواند بعد از خطا کپچای جدید بگیرد
import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

type Props = {
  // مقدارها به والد گزارش می شوند تا همراه فرم ارسال شوند
  onChange: (captchaId: string, captchaText: string) => void;
  // تغییر این عدد → دریافت کپچای جدید و پاک شدن متن
  refreshKey?: number;
  label?: string;
};

export default function Captcha({ onChange, refreshKey = 0, label = "کد امنیتی" }: Props) {
  const [captchaId, setCaptchaId] = useState("");
  const [svg, setSvg] = useState("");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/captcha", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setCaptchaId(data.id);
      setSvg(data.svg);
      setText("");
      onChange(data.id, "");
    } catch {
      // خطا در لود کپچا — کاربر می تواند دوباره تلاش کند
    } finally {
      setLoading(false);
    }
    // onChange عمدا وابستگی نیست تا رفرش مجدد ایجاد نشود
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // دریافت کپچا فقط در کلاینت ممکن است — همین جا فراخوانی می شود
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load, refreshKey]);

  function handleText(v: string) {
    setText(v);
    onChange(captchaId, v);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {svg ? (
          <div
            className="flex-1 min-h-[64px] rounded-xl border border-ig-border overflow-hidden bg-[#fafafa] flex items-center justify-center"
            aria-hidden
            // SVG توسط سرور خودمان ساخته می شود — امن است
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        ) : (
          <div className="flex-1 min-h-[64px] rounded-xl border border-ig-border bg-[#fafafa] flex items-center justify-center">
            <span className="text-xs text-ig-gray">در حال بارگذاری…</span>
          </div>
        )}
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          aria-label="کپچای جدید"
          className="shrink-0 w-10 h-10 rounded-xl border border-ig-border flex items-center justify-center text-ig-gray hover:text-foreground transition-colors disabled:opacity-40"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>
      <input
        type="text"
        inputMode="text"
        dir="ltr"
        autoComplete="off"
        value={text}
        onChange={(e) => handleText(e.target.value)}
        placeholder={label}
        aria-label={label}
        maxLength={8}
        className="w-full px-4 py-2.5 rounded-xl border border-ig-border bg-surface text-foreground text-sm text-center tracking-[0.3em] focus:border-ig-gray outline-none placeholder:tracking-normal placeholder:text-ig-gray"
        required
      />
    </div>
  );
}
