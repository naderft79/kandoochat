"use client";

// مودال هشدار انتخاب عکس با چهره مشخص
import { motion, AnimatePresence } from "framer-motion";
import Portal from "@/components/ui/Portal";
import { X, Camera, Check, Shield, User, Eye, Sparkles, CopyX } from "lucide-react";

type Props = {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  showDuplicateRule?: boolean;
};

const RULES = [
  { icon: Camera, text: "عکسی انتخاب کنید که چهره شما مشخص باشد. در غیر این صورت عکس تایید نمی شود" },
  { icon: Shield, text: "عکس نباید دور از شئونات اخلاقی باشد" },
  { icon: User, text: "عکس باید متعلق به خودتان باشد" },
  { icon: Eye, text: "عکس نباید حاوی صحنه های دلخراش یا آزاردهنده باشد" },
  { icon: Sparkles, text: "عکس باید با کیفیت باشد" },
];

const DUPLICATE_RULE = { icon: CopyX, text: "عکس نباید تکراری باشد" };

export default function FacePhotoWarningModal({ open, onConfirm, onCancel, title = "قوانین عکس پروفایل", showDuplicateRule = false }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <Portal>
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60"
            onClick={onCancel}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative bg-surface rounded-3xl max-w-sm w-full overflow-hidden ig-shadow-lg"
          >
            {/* هدر سیاه سفید */}
            <div className="relative px-5 pt-5 pb-4 bg-neutral-900">
              <button
                onClick={onCancel}
                className="absolute top-3 left-3 w-8 h-8 rounded-full bg-surface/10 hover:bg-surface/20 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-surface/10 flex items-center justify-center mb-2">
                  <Camera className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-white font-black text-base">{title}</h2>
                <p className="text-white/50 text-xs mt-0.5">لطفا قبل از انتخاب عکس بخوانید</p>
              </div>
            </div>

            {/* بدنه */}
            <div className="p-5 space-y-3">
              {/* لیست قوانین */}
              <div className="space-y-2">
                {RULES.map((rule, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.08 }}
                    className="flex items-center gap-2.5"
                  >
                    <div className="w-7 h-7 rounded-lg bg-ig-btn2 flex items-center justify-center shrink-0">
                      <rule.icon className="w-3.5 h-3.5 text-ig-gray" />
                    </div>
                    <p className="text-xs text-ig-gray font-medium leading-4">
                      {rule.text}
                    </p>
                  </motion.div>
                ))}
                {showDuplicateRule && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + RULES.length * 0.08 }}
                    className="flex items-center gap-2.5"
                  >
                    <div className="w-7 h-7 rounded-lg bg-ig-btn2 flex items-center justify-center shrink-0">
                      <DUPLICATE_RULE.icon className="w-3.5 h-3.5 text-ig-gray" />
                    </div>
                    <p className="text-xs text-ig-gray font-medium leading-4">
                      {DUPLICATE_RULE.text}
                    </p>
                  </motion.div>
                )}
              </div>

              <p className="text-xs text-neutral-400 leading-4 text-center pt-1">
                این قوانین به دلیل شفاف سازی و آشنایی دیگر کاربران با شماست
              </p>

              {/* دکمه ها */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={onCancel}
                  className="flex-1 py-3 rounded-2xl bg-ig-btn2 text-ig-gray text-sm font-bold hover:bg-neutral-200 transition-colors"
                >
                  انصراف
                </button>
                <button
                  onClick={onConfirm}
                  className="flex-1 py-3 rounded-2xl bg-ig-blue text-white text-sm font-black flex items-center justify-center gap-1.5 hover:bg-ig-blue transition-all active:scale-95"
                >
                  <Check className="w-4 h-4" strokeWidth={3} />
                  متوجه شدم
                </button>
              </div>
            </div>
          </motion.div>
        </div>
        </Portal>
      )}
    </AnimatePresence>
  );
}
