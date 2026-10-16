"use client";

// دکمه اشتراک گذاری پروفایل — Web Share API + کپی لینک + تلگرام/واتساپ
import { useState } from "react";
import { Share2, Copy, Check, Send, MessageCircle, X } from "lucide-react";
import Portal from "@/components/ui/Portal";
import { nativeShare as capShare, nativeCopy } from "@/lib/native";
import { useBrand } from "@/components/BrandProvider";

export default function ShareButton({
  url,
  title,
}: {
  url: string;
  title: string;
}) {
  const brand = useBrand();
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const fullUrl = typeof window !== "undefined" ? `${window.location.origin}${url}` : url;
  const shareText = `${title} — ${brand.name}`;

  async function share() {
    const ok = await capShare({ title: shareText, url: fullUrl });
    if (!ok) setShowMenu(true);
  }

  function copyLink() {
    void nativeCopy(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function shareTelegram() {
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(fullUrl)}&text=${encodeURIComponent(shareText)}`,
      "_blank"
    );
    setShowMenu(false);
  }

  function shareWhatsApp() {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(`${shareText} ${fullUrl}`)}`,
      "_blank"
    );
    setShowMenu(false);
  }

  return (
    <div className="relative">
      <button
        onClick={share}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-ig-gray-bg text-xs font-bold text-foreground hover:bg-neutral-200 transition-colors"
      >
        <Share2 className="w-4 h-4" />
        اشتراک گذاری
      </button>

      {showMenu && (
        <>
          <Portal>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowMenu(false)}
            />
          </Portal>
          <div className="absolute left-0 top-full mt-2 z-50 bg-surface border border-ig-border rounded-2xl shadow-lg p-2 min-w-[180px] ig-modal-in">
            <div className="flex items-center justify-between px-2 py-1 mb-1">
              <span className="text-xs font-bold text-foreground">اشتراک گذاری</span>
              <button onClick={() => setShowMenu(false)} className="text-ig-gray hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={copyLink}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-ig-gray-bg transition-colors text-right"
            >
              {copied ? (
                <Check className="w-4 h-4 text-ig-gray" />
              ) : (
                <Copy className="w-4 h-4 text-ig-gray" />
              )}
              <span className="text-sm font-bold text-foreground">
                {copied ? "کپی شد" : "کپی لینک"}
              </span>
            </button>
            <button
              onClick={shareTelegram}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-ig-gray-bg transition-colors text-right"
            >
              <Send className="w-4 h-4 text-ig-blue" />
              <span className="text-sm font-bold text-foreground">تلگرام</span>
            </button>
            <button
              onClick={shareWhatsApp}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-ig-gray-bg transition-colors text-right"
            >
              <MessageCircle className="w-4 h-4 text-ig-gray" />
              <span className="text-sm font-bold text-foreground">واتساپ</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
