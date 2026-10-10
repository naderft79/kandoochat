// چک لیست خوش آمد — تکمیل پروفایل برای کاربران جدید
import Link from "next/link";
import { CheckCircle2, Circle, Camera, FileText, Phone } from "lucide-react";
import { toPersianDigits } from "@/lib/format";

type Item = {
  label: string;
  done: boolean;
  href: string;
  icon: typeof Camera;
};

export default function OnboardingChecklist({
  hasPhoto,
  hasBio,
  hasJob,
  phoneVerified,
}: {
  hasPhoto: boolean;
  hasBio: boolean;
  hasJob: boolean;
  phoneVerified: boolean;
}) {
  const items: Item[] = [
    { label: "افزودن عکس پروفایل", done: hasPhoto, href: "/dashboard/profile", icon: Camera },
    { label: "نوشتن بیوگرافی", done: hasBio, href: "/dashboard/profile", icon: FileText },
    { label: "ثبت شغل", done: hasJob, href: "/dashboard/profile", icon: FileText },
    { label: "تایید شماره موبایل", done: phoneVerified, href: "/dashboard/settings", icon: Phone },
  ];

  const doneCount = items.filter((i) => i.done).length;
  const percent = Math.round((doneCount / items.length) * 100);

  // اگر همه انجام شده، چیزی نشان نده
  if (percent === 100) return null;

  return (
    <div className="mx-3 lg:mx-0 mb-4 rounded-2xl border border-ig-border bg-white p-4 ig-fade-in">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-foreground">پروفایل خود را کامل کنید</h3>
        <span className="text-xs font-bold text-neutral-500">
          {toPersianDigits(percent)}٪
        </span>
      </div>

      {/* نوار پیشرفت */}
      <div className="h-1.5 rounded-full bg-neutral-100 overflow-hidden mb-3">
        <div
          className="h-full rounded-full bg-neutral-800 transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>

      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.label}>
            {item.done ? (
              <span className="flex items-center gap-2 text-xs text-neutral-400 line-through">
                <CheckCircle2 className="w-4 h-4 text-ig-gray shrink-0" />
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="flex items-center gap-2 text-xs text-foreground hover:text-neutral-500 transition-colors"
              >
                <Circle className="w-4 h-4 text-neutral-300 shrink-0" />
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
