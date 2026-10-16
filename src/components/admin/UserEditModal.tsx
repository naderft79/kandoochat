"use client";

// مودال ویرایش مشخصات کاربر توسط مدیر
import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Loader2, UserCog } from "lucide-react";
import { useToast } from "@/components/ToastProvider";

type Props = {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
    phone: string;
    gender: string;
    age: number;
    height: number;
    weight: number;
    income: number;
    province: string;
    city: string;
    job: string | null;
    bio: string | null;
  };
  onClose: () => void;
  onSuccess?: () => void;
};

export default function UserEditModal({ user, onClose, onSuccess }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
    phone: user.phone,
    gender: user.gender,
    age: String(user.age),
    height: String(user.height),
    weight: String(user.weight),
    income: String(user.income),
    province: user.province,
    city: user.city,
    job: user.job ?? "",
    bio: user.bio ?? "",
  });

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function save() {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.username.trim() || !form.phone.trim()) {
      toast("اسم، فامیل، یوزرنیم و شماره اجباری هستند", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          action: "editProfile",
          profile: {
            firstName: form.firstName.trim(),
            lastName: form.lastName.trim(),
            username: form.username.trim(),
            phone: form.phone.trim(),
            gender: form.gender,
            age: parseInt(form.age, 10) || 0,
            height: parseInt(form.height, 10) || 0,
            weight: parseInt(form.weight, 10) || 0,
            income: parseInt(form.income, 10) || 0,
            province: form.province.trim(),
            city: form.city.trim(),
            job: form.job.trim() || null,
            bio: form.bio.trim() || null,
          },
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast("مشخصات ذخیره شد", "success");
        onClose();
        onSuccess?.();
        router.refresh();
      } else {
        toast(data.error ?? "خطایی رخ داد", "error");
      }
    } catch {
      toast("خطا در ارتباط با سرور", "error");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full px-3 py-2.5 rounded-lg border border-[rgba(212,175,55,0.15)] bg-[#0d0d0d] text-[#e8e8e8] focus:border-[rgba(212,175,55,0.4)] text-sm outline-none transition-all";
  const labelClass = "text-xs font-bold text-[#888] block mb-1.5";

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="lux-card max-w-lg w-full ig-modal-in overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* هدر */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[rgba(212,175,55,0.1)] shrink-0">
          <h3 className="text-sm font-bold text-[#e8e8e8] flex items-center gap-2">
            <UserCog className="w-4 h-4 text-[#d4af37]" />
            ویرایش مشخصات {user.firstName} {user.lastName}
          </h3>
          <button
            onClick={onClose}
            disabled={loading}
            className="w-8 h-8 rounded-lg hover:bg-[rgba(212,175,55,0.08)] flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-[#888]" />
          </button>
        </div>

        {/* بدنه فرم */}
        <div className="px-5 py-4 space-y-4 overflow-y-auto">
          {/* اسم و فامیل */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>نام</label>
              <input
                value={form.firstName}
                onChange={(e) => update("firstName", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>نام خانوادگی</label>
              <input
                value={form.lastName}
                onChange={(e) => update("lastName", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {/* یوزرنیم و شماره */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>یوزرنیم</label>
              <input
                value={form.username}
                onChange={(e) => update("username", e.target.value)}
                dir="ltr"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>شماره موبایل</label>
              <input
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                dir="ltr"
                className={inputClass}
              />
            </div>
          </div>

          {/* جنسیت */}
          <div>
            <label className={labelClass}>جنسیت</label>
            <select
              value={form.gender}
              onChange={(e) => update("gender", e.target.value)}
              className={inputClass}
            >
              <option value="MALE">مرد</option>
              <option value="FEMALE">زن</option>
            </select>
          </div>

          {/* سن، قد، وزن، درآمد */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>سن</label>
              <input
                type="number"
                dir="ltr"
                value={form.age}
                onChange={(e) => update("age", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>قد (سانتی متر)</label>
              <input
                type="number"
                dir="ltr"
                value={form.height}
                onChange={(e) => update("height", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>وزن (کیلوگرم)</label>
              <input
                type="number"
                dir="ltr"
                value={form.weight}
                onChange={(e) => update("weight", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>درآمد (تومان در ماه)</label>
              <input
                type="number"
                dir="ltr"
                value={form.income}
                onChange={(e) => update("income", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {/* استان و شهر */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>استان</label>
              <input
                value={form.province}
                onChange={(e) => update("province", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>شهر</label>
              <input
                value={form.city}
                onChange={(e) => update("city", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {/* شغل */}
          <div>
            <label className={labelClass}>شغل</label>
            <input
              value={form.job}
              onChange={(e) => update("job", e.target.value)}
              className={inputClass}
            />
          </div>

          {/* بایو */}
          <div>
            <label className={labelClass}>بایو</label>
            <textarea
              value={form.bio}
              onChange={(e) => update("bio", e.target.value)}
              rows={3}
              className={`${inputClass} resize-none`}
            />
          </div>
        </div>

        {/* فوتر */}
        <div className="px-5 py-3.5 border-t border-[rgba(212,175,55,0.1)] flex gap-2 shrink-0">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 rounded-lg lux-btn-outline text-sm font-bold transition-all"
          >
            بستن
          </button>
          <button
            onClick={save}
            disabled={loading}
            className="flex-1 py-2.5 rounded-lg lux-btn-gold text-sm font-bold transition-all flex items-center justify-center gap-1.5"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCog className="w-4 h-4" />}
            ذخیره
          </button>
        </div>
      </div>
    </div>
  );
}
