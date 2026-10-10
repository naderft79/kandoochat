"use client";

// منوی «…» روی پروفایل کاربران: گزارش، بلاک، نشان ندادن، کپی لینک
import { useState } from "react";
import { Flag, Ban, EyeOff, Link2 } from "lucide-react";
import { BottomSheet } from "@/components/ui/Modal";
import Dialog from "@/components/ui/Dialog";
import ListRow from "@/components/ui/ListRow";
import Button from "@/components/ui/Button";
import { TextArea } from "@/components/ui/Input";
import { useToast } from "@/components/ToastProvider";
import { cn } from "@/components/ui/cn";

const REASONS = [
  { id: "HARASSMENT", label: "آزار و اذیت" },
  { id: "FAKE_PROFILE", label: "پروفایل جعلی" },
  { id: "INAPPROPRIATE_CONTENT", label: "محتوای نامناسب" },
  { id: "SCAM", label: "کلاهبرداری" },
  { id: "OTHER", label: "سایر" },
] as const;

type Target = { id: string; username: string; firstName: string };

export default function UserActionsSheet({
  open,
  onClose,
  target,
  onHidden,
  onBlocked,
}: {
  open: boolean;
  onClose: () => void;
  target: Target;
  /** اگر ست شود گزینه «نشان نده» نمایش داده می شود */
  onHidden?: (id: string) => void;
  onBlocked?: (id: string) => void;
}) {
  const { toast } = useToast();
  const [step, setStep] = useState<"menu" | "report">("menu");
  const [reason, setReason] = useState<string>("");
  const [details, setDetails] = useState("");
  const [confirmBlock, setConfirmBlock] = useState(false);
  const [busy, setBusy] = useState(false);

  function close() {
    setStep("menu");
    setReason("");
    setDetails("");
    onClose();
  }

  async function post(url: string, body: unknown) {
    setBusy(true);
    try {
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "خطایی رخ داد");
      return true;
    } catch (e) {
      toast(e instanceof Error ? e.message : "خطا در ارتباط با سرور", "error");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function submitReport() {
    if (!reason) return;
    if (await post("/api/report", { reportedId: target.id, reason, details: details.trim() || undefined })) {
      toast("گزارش شما ثبت شد", "success");
      close();
    }
  }

  async function doBlock() {
    if (await post("/api/block", { blockedId: target.id })) {
      toast(`${target.firstName} بلاک شد`, "success");
      setConfirmBlock(false);
      onBlocked?.(target.id);
      close();
    }
  }

  async function doHide() {
    if (await post("/api/feed/hide", { hiddenId: target.id })) {
      toast("این پروفایل دیگر نمایش داده نمی شود", "success");
      onHidden?.(target.id);
      close();
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/profile/${target.username}`);
      toast("لینک پروفایل کپی شد", "success");
    } catch {
      toast("کپی لینک ممکن نشد", "error");
    }
    close();
  }

  return (
    <>
      <BottomSheet open={open && !confirmBlock} onClose={close} title={step === "menu" ? undefined : "گزارش پروفایل"}>
        {step === "menu" ? (
          <div className="py-1">
            <ListRow icon={Flag} title="گزارش" tone="danger" onClick={() => setStep("report")} end={<span />} />
            <ListRow icon={Ban} title="بلاک کردن" tone="danger" onClick={() => setConfirmBlock(true)} end={<span />} />
            {onHidden && <ListRow icon={EyeOff} title="نشان نده" onClick={doHide} end={<span />} />}
            <ListRow icon={Link2} title="کپی لینک پروفایل" onClick={copyLink} end={<span />} />
            <button onClick={close} className="w-full h-12 border-t border-ig-divider text-sm text-foreground">
              انصراف
            </button>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            <p className="text-sm text-ig-gray">دلیل گزارش {target.firstName} را انتخاب کنید</p>
            <div role="radiogroup" aria-label="دلیل گزارش" className="space-y-1">
              {REASONS.map((r) => (
                <button
                  key={r.id}
                  role="radio"
                  aria-checked={reason === r.id}
                  onClick={() => setReason(r.id)}
                  className={cn(
                    "w-full h-11 px-3 rounded-lg text-sm text-start flex items-center justify-between transition-colors",
                    reason === r.id ? "bg-foreground text-white font-bold" : "bg-ig-gray-bg text-foreground"
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <TextArea label="توضیحات (اختیاری)" value={details} onChange={(e) => setDetails(e.target.value)} maxLength={500} />
            <Button fullWidth onClick={submitReport} disabled={!reason} loading={busy}>
              ارسال گزارش
            </Button>
          </div>
        )}
      </BottomSheet>

      <Dialog
        open={confirmBlock}
        title={`بلاک ${target.firstName}؟`}
        message="این کاربر دیگر نمی تواند با شما در ارتباط باشد و پروفایل او از فید شما حذف می شود."
        onClose={() => setConfirmBlock(false)}
        actions={[
          { label: busy ? "در حال بلاک..." : "بلاک کن", tone: "danger", onClick: doBlock, disabled: busy },
          { label: "انصراف", onClick: () => setConfirmBlock(false) },
        ]}
      />
    </>
  );
}
