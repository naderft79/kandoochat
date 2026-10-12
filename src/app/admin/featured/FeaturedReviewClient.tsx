"use client";

// بررسی درخواست های بخش ویژه: تایید، رد و حذف
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ToastProvider";
import UserLink from "@/components/admin/user-modal/UserLink";

type Item = { id: string; userId: string; name: string; username: string; city: string; date: string };

export default function FeaturedReviewClient({ pending, approved }: { pending: Item[]; approved: Item[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState<string | null>(null);

  async function act(id: string, action: "APPROVE" | "REJECT" | "REMOVE") {
    setBusy(id);
    try {
      const res = await fetch("/api/admin/featured", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      const data = await res.json();
      if (!res.ok) toast(data.error || "خطا", "error");
      else router.refresh();
    } catch {
      toast("خطای شبکه", "error");
    } finally {
      setBusy(null);
    }
  }

  const row = (it: Item, actions: { label: string; action: "APPROVE" | "REJECT" | "REMOVE"; tone: string }[]) => (
    <div key={it.id} className="lux-card p-4 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-bold text-[#e8e8e8] truncate"><UserLink userId={it.userId}>{it.name}</UserLink> <span className="text-[#888] font-normal" dir="ltr">@{it.username}</span></p>
        <p className="text-xs text-[#888]">{it.city} · {it.date}</p>
      </div>
      <div className="flex gap-2 shrink-0">
        {actions.map((a) => (
          <button
            key={a.action}
            disabled={busy === it.id}
            onClick={() => act(it.id, a.action)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-40 ${a.tone}`}
          >
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-[#d4af37]">لیست انتظار</h2>
        {pending.length === 0 && <p className="text-xs text-[#888]">درخواستی در انتظار نیست</p>}
        {pending.map((it) =>
          row(it, [
            { label: "تایید", action: "APPROVE", tone: "bg-[#d4af37] text-black" },
            { label: "رد و بازگشت سکه", action: "REJECT", tone: "bg-[#2a2a2a] text-[#e8e8e8]" },
          ])
        )}
      </section>
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-[#d4af37]">در بخش ویژه</h2>
        {approved.length === 0 && <p className="text-xs text-[#888]">کاربری در بخش ویژه نیست</p>}
        {approved.map((it) => row(it, [{ label: "حذف از بخش ویژه", action: "REMOVE", tone: "bg-[#2a2a2a] text-[#e8e8e8]" }]))}
      </section>
    </>
  );
}
