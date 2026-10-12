"use client";

// دکمه های عملیاتی هدر مودال: همان مجموعه بخش کاربران (UserActions) به همراه مودال های سکه، اشتراک، قفل پیام، ویرایش و عکس ها
import UserActions from "@/components/admin/UserActions";
import type { UserSummary } from "@/lib/admin-user-data";

export type ActiveModal = "coin" | "sub" | "lock" | "edit" | "photos" | "delete" | null;

type Props = {
  s: UserSummary;
  onOpen: (m: Exclude<ActiveModal, null>) => void;
  onChanged: () => void;
};

const btn = "px-2 py-2 rounded-lg lux-btn-gold text-[10px] font-bold transition-all disabled:opacity-50 flex items-center justify-center text-center";

export default function ActionsBar({ s, onOpen, onChanged }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-1.5">
      <UserActions
        userId={s.id}
        role={s.role}
        isActive={s.isActive}
        phoneVerified={s.phoneVerified}
        isSpecial={s.isSpecial}
        isFake={s.isFake}
        canSetRole={s.permissions.setRole}
        onChanged={onChanged}
      />
      <button type="button" onClick={() => onOpen("coin")} className={btn}>سکه</button>
      <button type="button" onClick={() => onOpen("sub")} className={btn}>اشتراک</button>
      <button type="button" onClick={() => onOpen("lock")} className={btn}>قفل پیام</button>
      <button type="button" onClick={() => onOpen("photos")} className={btn}>عکس ها</button>
      {s.permissions.phoneFull && (
        <button type="button" onClick={() => onOpen("edit")} className={btn}>ویرایش مشخصات</button>
      )}
      {s.permissions.setRole && !s.deletedAt && (
        <button
          type="button"
          onClick={() => onOpen("delete")}
          className="px-2 py-2 rounded-lg bg-[rgba(239,68,68,0.12)] border border-[rgba(239,68,68,0.35)] text-[#f87171] text-[10px] font-black hover:bg-[rgba(239,68,68,0.2)] flex items-center justify-center text-center"
        >
          حذف کامل کاربر
        </button>
      )}
    </div>
  );
}
