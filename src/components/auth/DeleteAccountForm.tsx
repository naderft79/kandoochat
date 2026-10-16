"use client";

// فرم حذف حساب برای صفحه عمومی /delete-account — با تایید رمز عبور
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";

export default function DeleteAccountForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [, startTransition] = useTransition();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (deleting || !password) return;
    setDeleting(true);
    setError("");
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password,
          reason: reason || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        startTransition(() => {
          router.push("/");
          router.refresh();
        });
        return;
      }
      setError(data.error || "خطایی رخ داد");
      setDeleting(false);
    } catch {
      setError("خطا در ارتباط با سرور");
      setDeleting(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label className="block text-xs font-bold text-ig-gray mb-1.5">
          رمز عبور
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-ig-border focus:border-neutral-400 outline-none transition-colors"
          placeholder="رمز عبور حساب خود را وارد کنید"
          required
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-ig-gray mb-1.5">
          دلیل حذف (اختیاری)
        </label>
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={300}
          className="w-full px-4 py-3 rounded-lg border border-ig-border focus:border-neutral-400 outline-none transition-colors"
          placeholder="مثلا دیگر به اپ نیاز ندارم"
        />
      </div>
      {error && <p className="text-sm text-ig-red">{error}</p>}
      <button
        type="submit"
        disabled={deleting || !password}
        className="w-full h-11 rounded-xl bg-ig-red text-white text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-40 transition-all"
      >
        {deleting ? (
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
        ) : (
          <Trash2 className="w-4 h-4" aria-hidden />
        )}
        {deleting ? "در حال حذف..." : "حذف دائمی حساب"}
      </button>
    </form>
  );
}
