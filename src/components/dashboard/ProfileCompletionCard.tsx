"use client";

// نوار تکمیل پروفایل — کلیک روی آن شیت ویرایش پروفایل را باز می کند
// بخش های ناقص هم به کاربر نشان داده می شود تا بداند چه چیزی را باید ویرایش کند
import { ChevronLeft } from "lucide-react";
import { toPersianDigits } from "@/lib/format";

// رویدادی که ProfileActions به آن گوش می دهد تا شیت ویرایش باز شود
export const OPEN_PROFILE_EDIT_EVENT = "kandoo:open-profile-edit";

export default function ProfileCompletionCard({
  completion,
  missing,
}: {
  completion: number;
  missing: string[];
}) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent(OPEN_PROFILE_EDIT_EVENT))}
      className="mt-4 w-full text-start rounded-2xl border border-ig-border bg-surface p-4 hover:bg-ig-gray-bg transition-colors active:scale-[0.99]"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-bold text-foreground flex items-center gap-1">
          تکمیل پروفایل
          <ChevronLeft className="w-4 h-4 text-ig-gray" aria-hidden />
        </span>
        <span className="text-sm font-black text-foreground">
          {toPersianDigits(completion)}٪
        </span>
      </div>
      <div className="h-1.5 bg-ig-divider rounded-full overflow-hidden">
        <div
          className="h-full bg-ig-blue rounded-full transition-all duration-500"
          style={{ width: `${completion}%` }}
        />
      </div>
      {missing.length > 0 ? (
        <p className="text-xs text-ig-gray mt-2">
          برای تکمیل ویرایش کنید: {missing.join("، ")}
        </p>
      ) : (
        <p className="text-xs text-ig-gray mt-2">
          با تکمیل پروفایل، دیده شدن شما بیشتر می شود
        </p>
      )}
    </button>
  );
}
