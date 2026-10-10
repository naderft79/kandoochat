"use client";

// ردیف دعوت دوستان در لیست قابلیت های ویژه (بخش کلاینت برای انتقال آیکن)
import { Gift } from "lucide-react";
import { FeatureRow } from "@/components/dashboard/features/FeatureKit";

export default function ReferralRow() {
  return (
    <FeatureRow
      icon={Gift}
      title="دعوت دوستان"
      subtitle="با دعوت هر دوست سکه رایگان بگیرید"
      href="/dashboard/referral"
    />
  );
}
