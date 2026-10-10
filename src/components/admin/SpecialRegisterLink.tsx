"use client";

// نمایش لینک ثبت نام کاربران ویژه با قابلیت کپی
import { useState, useEffect } from "react";
import { Star, Copy, Check } from "lucide-react";

export default function SpecialRegisterLink({ slug = "special" }: { slug?: string }) {
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");
  const link = origin ? `${origin}/register/${slug}` : `/register/${slug}`;

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  function copyLink() {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="lux-card p-4 border-[rgba(212,175,55,0.2)]">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg lux-btn-gold flex items-center justify-center shrink-0">
          <Star className="w-4 h-4 text-[#0a0a0a] fill-[#0a0a0a]" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-[#e8e8e8]">لینک ثبت نام کاربران ویژه</h3>
          <p className="text-[10px] text-[#888]">کاربرانی که از این لینک ثبت نام کنند بلافاصله ویژه می شوند</p>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-3">
        <code className="flex-1 px-3 py-2 rounded-lg bg-[#0d0d0d] border border-[rgba(212,175,55,0.15)] text-xs font-mono text-[#d4af37] truncate" dir="ltr">
          {link}
        </code>
        <button
          onClick={copyLink}
          className="shrink-0 px-3 py-2 rounded-lg lux-btn-gold text-xs font-bold transition-all flex items-center gap-1"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5" />
              کپی شد
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              کپی
            </>
          )}
        </button>
      </div>
    </div>
  );
}
