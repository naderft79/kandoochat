"use client";

// مودال دلیل رد عکس/استوری — با پیام های آماده
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Loader2 } from "lucide-react";

// ۱۸ پیام آماده برای دلیل رد
export const REJECT_REASONS = [
  "عکس شما تار یا کیفیت پایینی دارد. لطفا عکس با کیفیت بالاتر آپلود کنید.",
  "عکس شما شامل contenido نامناسب است. لطفا قوانین سایت را رعایت کنید.",
  "عکس شما شامل فرد دیگری به جز خودتان است. لطفا عکسی که فقط خود شما در آن هستید آپلود کنید.",
  "عکس شما یک عکس گروهی است. لطفا عکس تک نفره آپلود کنید.",
  "عکس شما شامل متن یا تبلیغات است. آپلود عکس با تبلیغات ممنوع است.",
  "عکس شما یک عکس سلبریتی یا شخص معروف است. لطفا عکس واقعی خودتان را آپلود کنید.",
  "عکس شما یک تصویر غیر واقعی یا کارتونی است. لطفا عکس واقعی خودتان را آپلود کنید.",
  "عکس شما شامل لباس نامناسب است. لطفا عکس با لباس مناسب آپلود کنید.",
  "عکس شما در مکان نامناسب گرفته شده است. لطفا عکس در مکان مناسب آپلود کنید.",
  "عکس شما یک اسکرین شات است. لطفا عکس واقعی آپلود کنید.",
  "عکس شما یک عکس قدیمی است. لطفا عکس جدیدتر از خودتان آپلود کنید.",
  "عکس شما چهره شما مشخص نیست. لطفا عکسی که چهره شما در آن واضح است آپلود کنید.",
  "عکس شما شامل فیلتر یا ویرایش سنگین است. لطفا عکس طبیعی آپلود کنید.",
  "عکس شما یک عکس از حیوان یا طبیعت است. لطفا عکس از خودتان آپلود کنید.",
  "عکس شما شامل اطلاعات شخصی مثل شماره تماس است. آپلود اطلاعات شخصی ممنوع است.",
  "عکس شما تکراری است. لطفا عکس متفاوت آپلود کنید.",
  "عکس شما شامل اسلحه یا مواد ممنوعه است. آپلود این نوع عکس ممنوع است.",
  "عکس شما با قوانین سایت همخوانی ندارد. لطفا قوانین را مطالعه کرده و عکس مناسب آپلود کنید.",
];

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  loading: boolean;
  title?: string;
};

export default function RejectReasonModal({ open, onClose, onConfirm, loading, title = "رد عکس" }: Props) {
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [customReason, setCustomReason] = useState<string>("");

  function handleConfirm() {
    const reason = customReason.trim() || selectedReason;
    if (!reason) return;
    onConfirm(reason);
  }

  function handleClose() {
    setSelectedReason("");
    setCustomReason("");
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative lux-card max-w-md w-full max-h-[85vh] overflow-hidden flex flex-col"
          >
            {/* هدر */}
            <div className="flex items-center justify-between p-4 border-b border-[rgba(212,175,55,0.1)] shrink-0">
              <h3 className="text-sm font-black text-[#d4af37]">{title}</h3>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-full bg-[rgba(212,175,55,0.08)] hover:bg-[rgba(212,175,55,0.15)] flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-[#888]" />
              </button>
            </div>

            {/* محتوا */}
            <div className="overflow-y-auto p-4 space-y-3">
              <p className="text-xs text-[#888]">یک دلیل از لیست انتخاب کنید یا دلیل دلخواه بنویسید:</p>

              {/* لیست پیام‌های آماده */}
              <div className="space-y-2">
                {REJECT_REASONS.map((reason, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setSelectedReason(reason);
                      setCustomReason("");
                    }}
                    className={`w-full text-right p-3 rounded-xl text-xs leading-5 transition-all ${
                      selectedReason === reason && !customReason
                        ? "bg-[rgba(212,175,55,0.15)] border border-[rgba(212,175,55,0.4)] text-[#d4af37]"
                        : "bg-[#0d0d0d] border border-[rgba(212,175,55,0.08)] text-[#e8e8e8] hover:border-[rgba(212,175,55,0.2)]"
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>

              {/* دلیل دلخواه */}
              <div className="pt-2">
                <p className="text-[10px] text-[#888] mb-1.5">یا دلیل دلخواه بنویسید:</p>
                <textarea
                  value={customReason}
                  onChange={(e) => {
                    setCustomReason(e.target.value);
                    setSelectedReason("");
                  }}
                  rows={3}
                  placeholder="دلیل رد را بنویسید..."
                  className="w-full px-3 py-2 rounded-lg bg-[#0d0d0d] border border-[rgba(212,175,55,0.15)] text-[#e8e8e8] text-xs focus:outline-none focus:border-[rgba(212,175,55,0.4)] resize-none"
                />
              </div>
            </div>

            {/* دکمه‌ها */}
            <div className="flex gap-2 p-4 border-t border-[rgba(212,175,55,0.1)] shrink-0">
              <button
                onClick={handleClose}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl lux-card text-xs font-bold text-[#888] hover:text-[#d4af37] transition-all disabled:opacity-50"
              >
                انصراف
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading || (!selectedReason && !customReason.trim())}
                className="flex-1 py-2.5 rounded-xl bg-[rgba(239,68,68,0.15)] text-[#f87171] border border-[rgba(239,68,68,0.3)] text-xs font-bold hover:bg-[rgba(239,68,68,0.25)] transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                تایید و ارسال دلیل
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
