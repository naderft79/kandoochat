"use client";

// قرار گرفتن در بخش ویژه: خرید با سکه، ورود به لیست انتظار تا تایید مدیر (قابل لغو توسط کاربر نیست)
import { useEffect, useState } from "react";
import { Sparkles, Star, Users, ShieldCheck } from "lucide-react";
import {
  FeatureRow,
  FeaturePitchSheet,
} from "@/components/dashboard/features/FeatureKit";
import { FEATURED_COST } from "@/lib/featured";

export default function FeaturedButton() {
  const [status, setStatus] = useState<"PENDING" | "APPROVED" | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch("/api/featured")
      .then((r) => r.json())
      .then((data) => data.listing && setStatus(data.listing.status))
      .catch(() => {});
  }, []);

  async function join() {
    const res = await fetch("/api/featured", { method: "POST" });
    const data = await res.json();
    if (res.ok) {
      setStatus("PENDING");
      setOpen(false);
      return;
    }
    return data.error || "خطا";
  }

  return (
    <>
      <FeatureRow
        icon={Sparkles}
        title="اضافه شدن در بخش ویژه"
        subtitle={
          status === "PENDING"
            ? "در لیست انتظار تایید مدیر"
            : status === "APPROVED"
            ? "پروفایل شما در بخش ویژه است"
            : "در میان پروفایل های برگزیده دیده شوید"
        }
        cost={FEATURED_COST}
        status={
          status === "PENDING"
            ? { kind: "pending", label: "در انتظار" }
            : status === "APPROVED"
            ? { kind: "active", label: "فعال" }
            : undefined
        }
        onClick={() => setOpen(true)}
      />
      <FeaturePitchSheet
        open={open}
        onClose={() => setOpen(false)}
        icon={Sparkles}
        title="بخش ویژه"
        tagline="پروفایل های برگزیده در بالاترین جای صفحه خانه نمایش داده می شوند و بیشترین توجه را می گیرند."
        benefits={[
          {
            icon: Star,
            title: "جایگاه برگزیده",
            desc: "پروفایل شما در نوار بخش ویژه بالای صفحه خانه برای همه کاربران نمایش داده می شود",
          },
          {
            icon: Users,
            title: "دیده شدن بیشتر",
            desc: "کاربران ویژه چند برابر بیشتر بازدید و درخواست گفتگو دریافت می کنند",
          },
          {
            icon: ShieldCheck,
            title: "بررسی توسط مدیر",
            desc: "درخواست شما وارد لیست انتظار می شود و پس از تایید مدیر، بالای لیست ویژه قرار می گیرد",
          },
        ]}
        cost={FEATURED_COST}
        ctaLabel="ثبت درخواست و پرداخت"
        onConfirm={join}
      />
    </>
  );
}
