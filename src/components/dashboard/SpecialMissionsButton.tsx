"use client";

// دکمه باز کردن مودال ماموریت های ویژه
import { useState } from "react";
import dynamic from "next/dynamic";
import { ClipboardList } from "lucide-react";

// مودال سنگین فقط هنگام نیاز بارگذاری می شود
const SpecialMissionsModal = dynamic(() => import("@/components/dashboard/SpecialMissionsModal"));

export default function SpecialMissionsButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 px-3 py-1 rounded-full bg-ig-red text-white text-xs font-bold ig-shadow-lg hover:bg-ig-red/90 transition-colors active:scale-95"
      >
        <ClipboardList className="w-3.5 h-3.5" />
        ماموریت های ویژه
      </button>

      {open && <SpecialMissionsModal onClose={() => setOpen(false)} />}
    </>
  );
}
