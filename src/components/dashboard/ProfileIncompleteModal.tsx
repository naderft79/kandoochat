"use client";

// مودال ناقص بودن پروفایل — از ui/Modal استفاده می کند تا همیشه روی همه لایه ها رندر شود
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

type Props = {
  open: boolean;
  missing?: string[];
  onClose: () => void;
};

export default function ProfileIncompleteModal({ open, missing, onClose }: Props) {
  return (
    <Modal open={open} onClose={onClose} title="تکمیل پروفایل" className="max-w-xs">
      <div className="px-6 py-5 text-center">
        <div className="w-12 h-12 rounded-full bg-ig-gray-bg flex items-center justify-center mx-auto mb-3">
          <AlertCircle className="w-6 h-6 text-ig-gold" aria-hidden />
        </div>
        <p className="text-sm text-foreground leading-6 mb-3">برای ادامه ابتدا پروفایل خود را تکمیل کنید</p>
        {missing && missing.length > 0 && (
          <div className="flex flex-wrap justify-center gap-1.5 mb-4">
            {missing.map((m) => (
              <span key={m} className="px-2.5 py-1 rounded-full bg-ig-gray-bg text-ig-gray text-xs font-bold">
                {m}
              </span>
            ))}
          </div>
        )}
        <Link href="/dashboard/profile" onClick={onClose} className="block">
          <Button className="w-full">ورود به بخش پروفایل</Button>
        </Link>
      </div>
    </Modal>
  );
}
