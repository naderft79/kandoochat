"use client";

// بوست پروفایل با سکه — پس از فعال سازی قابل لغو نیست
import { useEffect, useState } from "react";
import { Rocket, TrendingUp, Eye, Flame } from "lucide-react";
import { FeatureRow, FeaturePitchSheet, Remaining } from "@/components/dashboard/features/FeatureKit";

export default function BoostButton() {
  const [boost, setBoost] = useState<{ endsAt: string } | null>(null);
  const [cost, setCost] = useState(50);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch("/api/boost")
      .then((r) => r.json())
      .then((data) => data.boost && setBoost(data.boost))
      .catch(() => {});
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => data.boostCostCoins && setCost(data.boostCostCoins))
      .catch(() => {});
  }, []);

  async function activate() {
    const res = await fetch("/api/boost", { method: "POST" });
    const data = await res.json();
    if (res.ok && data.endsAt) {
      setBoost({ endsAt: data.endsAt });
      setOpen(false);
      return;
    }
    return data.error || "خطا";
  }

  const active = boost && new Date(boost.endsAt).getTime() > Date.now();

  return (
    <>
      <FeatureRow
        icon={Rocket}
        title="بوست پروفایل"
        subtitle={active ? <>زمان باقی مانده <Remaining endsAt={boost!.endsAt} withSeconds /></> : "پروفایل شما را در صدر نتایج نشان می دهد"}
        cost={cost}
        status={active ? { kind: "active", label: "فعال" } : undefined}
        onClick={() => setOpen(true)}
      />
      <FeaturePitchSheet
        open={open}
        onClose={() => setOpen(false)}
        icon={Rocket}
        title="بوست پروفایل"
        tagline="چند دقیقه در صدر فید و جستجو دیده شوید و چند برابر بیشتر لایک و پیام بگیرید."
        benefits={[
          { icon: TrendingUp, title: "جایگاه اول", desc: "پروفایل شما بالاتر از همه در فید و نتایج جستجو نمایش داده می شود" },
          { icon: Eye, title: "بازدید بیشتر", desc: "تعداد بازدیدکنندگان پروفایل شما در مدت بوست به شکل محسوسی بیشتر می شود" },
          { icon: Flame, title: "شانس گفتگوی بیشتر", desc: "هرچه بیشتر دیده شوید، پیام های بیشتری دریافت می کنید" },
        ]}
        cost={cost}
        onConfirm={activate}
      />
    </>
  );
}
