"use client";

// استوری طلایی با سکه — ۲۴ ساعت، پس از فعال سازی قابل لغو نیست
import { useEffect, useState } from "react";
import { Crown, TrendingUp, Sparkles, Eye } from "lucide-react";
import { FeatureRow, FeaturePitchSheet, Remaining } from "@/components/dashboard/features/FeatureKit";
import { toPersianDigits } from "@/lib/format";

const COST = 100;
const HOURS = 24;

export default function GoldenStoryButton() {
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch("/api/golden-story")
      .then((r) => r.json())
      .then((data) => data.active && setExpiresAt(data.expiresAt))
      .catch(() => {});
  }, []);

  async function activate() {
    const res = await fetch("/api/golden-story", { method: "POST" });
    const data = await res.json();
    if (res.ok) {
      setExpiresAt(data.expiresAt);
      setOpen(false);
      return;
    }
    return data.error || "خطا";
  }

  const active = expiresAt && new Date(expiresAt).getTime() > Date.now();

  return (
    <>
      <FeatureRow
        icon={Crown}
        title="استوری طلایی"
        subtitle={active ? <>زمان باقی مانده <Remaining endsAt={expiresAt!} /></> : `${toPersianDigits(HOURS)} ساعت با حلقه طلایی دیده شوید`}
        cost={COST}
        status={active ? { kind: "active", label: "فعال" } : undefined}
        onClick={() => setOpen(true)}
      />
      <FeaturePitchSheet
        open={open}
        onClose={() => setOpen(false)}
        icon={Crown}
        title="استوری طلایی"
        tagline={`استوری شما به مدت ${toPersianDigits(HOURS)} ساعت از بقیه متمایز می شود و بیشتر دیده می شود.`}
        benefits={[
          { icon: TrendingUp, title: "نمایش اولویت دار", desc: "استوری شما در ابتدای نوار استوری کاربران قرار می گیرد" },
          { icon: Sparkles, title: "حلقه طلایی", desc: "دور تصویر شما یک حلقه طلایی درخشان نمایش داده می شود" },
          { icon: Eye, title: "بازدید بیشتر", desc: "استوری طلایی توسط تعداد بیشتری از کاربران دیده می شود" },
        ]}
        cost={COST}
        onConfirm={activate}
      />
    </>
  );
}
