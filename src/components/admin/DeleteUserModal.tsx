"use client";

// مودال حذف کامل کاربر (حذف نرم با ۳۰ روز مهلت بازیابی) — فقط سوپر ادمین؛ فقط با تایید داخل مودال
import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Loader2, Trash2, AlertTriangle } from "lucide-react";
import { useToast } from "@/components/ToastProvider";

type Props = {
  userId: string;
  displayName: string;
  username: string;
  onClose: () => void;
  onSuccess?: () => void;
};

export default function DeleteUserModal({ userId, displayName, username, onClose, onSuccess }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action: "deleteUser" }),
      });
      const data = await res.json();
      if (res.ok) {
        toast("کاربر حذف شد و تا ۳۰ روز قابل بازیابی است", "success");
        onClose();
        onSuccess?.();
        router.refresh();
      } else {
        toast(data.error ?? "خطایی رخ داد", "error");
      }
    } catch {
      toast("خطا در ارتباط با سرور", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="حذف کامل کاربر">
      <button type="button" aria-label="بستن" onClick={onClose} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative w-full max-w-md lux-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-foreground flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-[#f87171]" aria-hidden />
            حذف کامل کاربر
          </h2>
          <button type="button" onClick={onClose} aria-label="بستن" className="w-8 h-8 rounded-full flex items-center justify-center text-[#888] hover:text-[#d4af37]">
            <X className="w-4 h-4" aria-hidden />
          </button>
        </div>

        <div className="rounded-xl border border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.08)] p-3 flex gap-2">
          <AlertTriangle className="w-4 h-4 text-[#f87171] shrink-0 mt-0.5" aria-hidden />
          <div className="text-[11px] leading-5 text-foreground">
            <p className="font-black mb-1">حذف {displayName} (@{username})</p>
            <p>
              حساب بلافاصله غیرفعال و از دسترس خارج می شود و نام او «کاربر حذف شده» نمایش داده می شود.
              عکس ها روی سرور باقی می مانند و تراکنش ها و سوابق مالی حفظ می شوند.
              تا ۳۰ روز امکان بازیابی وجود دارد؛ پس از آن دیگر بازیابی ممکن نیست.
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={submit}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-[rgba(239,68,68,0.15)] border border-[rgba(239,68,68,0.4)] text-[#f87171] text-xs font-black disabled:opacity-40 flex items-center justify-center gap-1.5"
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden />}
            تایید حذف
          </button>
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl lux-btn-outline text-xs font-bold">
            انصراف
          </button>
        </div>
      </div>
    </div>
  );
}
