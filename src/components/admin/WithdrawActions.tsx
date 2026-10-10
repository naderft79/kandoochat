"use client";

// اکشن های رسیدگی به درخواست برداشت
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { useToast } from "@/components/ToastProvider";

export default function WithdrawActions({ requestId }: { requestId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  async function act(action: "approve" | "reject") {
    const adminNote =
      action === "reject" ? prompt("دلیل رد درخواست (اختیاری):") ?? "" : "";
    setLoading(true);
    try {
      const res = await fetch("/api/admin/withdrawals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action, adminNote }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        toast(data.error ?? "خطایی رخ داد", "error");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => act("approve")}
        disabled={loading}
        className="px-4 py-2 rounded-lg lux-btn-gold text-xs font-bold disabled:opacity-50 flex items-center gap-1"
      >
        <Check className="w-4 h-4" />
        تایید و پرداخت شد
      </button>
      <button
        onClick={() => act("reject")}
        disabled={loading}
        className="px-4 py-2 rounded-lg bg-[rgba(239,68,68,0.1)] text-[#f87171] border border-[rgba(239,68,68,0.2)] text-xs font-bold hover:bg-[rgba(239,68,68,0.15)] transition-all disabled:opacity-50 flex items-center gap-1"
      >
        <X className="w-4 h-4" />
        رد و بازگشت سکه
      </button>
    </div>
  );
}
