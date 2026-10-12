"use client";

// اسم هر کاربر در پنل ادمین با این کامپوننت نمایش داده می شود: کلیک، مودال پروفایل آن کاربر را باز می کند
import type { ReactNode, MouseEvent } from "react";
import { useUserModal } from "@/components/admin/user-modal/UserModalProvider";

type Props = {
  userId: string | null | undefined;
  children: ReactNode;
  className?: string;
};

export default function UserLink({ userId, children, className = "" }: Props) {
  const { open } = useUserModal();

  // کاربر حذف شده یا مهمان شناسه ندارد؛ فقط متن نمایش داده می شود
  if (!userId) return <span className={className}>{children}</span>;

  function onClick(e: MouseEvent<HTMLButtonElement>) {
    // جلوگیری از فعال شدن کلیک ردیف یا کارت والد
    e.stopPropagation();
    open(userId as string);
  }

  return (
    <button
      type="button"
      data-user-link={userId}
      onClick={onClick}
      className={`text-right font-bold text-[#d4af37] hover:underline underline-offset-2 decoration-[#d4af37]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]/60 rounded-sm ${className}`}
    >
      {children}
    </button>
  );
}
