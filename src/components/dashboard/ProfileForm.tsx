"use client";

// فرم ویرایش پروفایل کاربر
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Save, Check, X } from "lucide-react";
// آیکن X برای وضعیت ناموفق یوزرنیم استفاده می شود
import { PROVINCES, PROVINCE_NAMES } from "@/lib/iran";
import SelectMenu from "@/components/ui/SelectMenu";
import { HEIGHT_OPTIONS, WEIGHT_OPTIONS, INCOME_OPTIONS } from "@/lib/profile-options";

const inputClass =
  "w-full px-3 py-2.5 rounded-lg border border-neutral-200 focus:border-neutral-500 focus:ring-2 focus:ring-neutral-100 outline-none transition-all text-sm";

type ProfileData = {
  username: string;
  firstName: string;
  lastName: string;
  province: string;
  city: string;
  age: number;
  height: number;
  weight: number;
  income: number;
  job: string | null;
  bio: string | null;
};

export default function ProfileForm({ initial, onClose }: { initial: ProfileData; onClose?: () => void }) {
  const router = useRouter();
  const [form, setForm] = useState({
    username: initial.username,
    firstName: initial.firstName,
    lastName: initial.lastName,
    province: initial.province,
    city: initial.city,
    age: String(initial.age),
    height: String(initial.height),
    weight: String(initial.weight),
    income: String(initial.income),
    job: initial.job ?? "",
    bio: initial.bio ?? "",
  });
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<{ checking: boolean; available: boolean | null; error: string | null }>({ checking: false, available: null, error: null });

  const checkUsername = useCallback(async (val: string) => {
    if (val === initial.username) {
      setUsernameStatus({ checking: false, available: null, error: null });
      return;
    }
    if (val.length < 3) {
      setUsernameStatus({ checking: false, available: false, error: "حداقل ۳ کاراکتر" });
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(val)) {
      setUsernameStatus({ checking: false, available: false, error: "فقط حروف انگلیسی، عدد و زیرخط" });
      return;
    }
    setUsernameStatus({ checking: true, available: null, error: null });
    try {
      const res = await fetch(`/api/profile/check-username?username=${encodeURIComponent(val)}`);
      const data = await res.json();
      setUsernameStatus({ checking: false, available: data.available, error: data.error ?? null });
    } catch {
      setUsernameStatus({ checking: false, available: null, error: "خطای شبکه" });
    }
  }, [initial.username]);

  useEffect(() => {
    const t = setTimeout(() => checkUsername(form.username), 500);
    return () => clearTimeout(t);
  }, [form.username, checkUsername]);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          age: parseInt(form.age, 10),
          height: parseInt(form.height, 10),
          weight: parseInt(form.weight, 10),
          income: parseInt(form.income || "0", 10),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ ok: false, text: data.error ?? "خطایی رخ داد" });
        return;
      }
      setMessage({ ok: true, text: "پروفایل با موفقیت به روز شد" });
      router.refresh();
      setTimeout(() => onClose?.(), 600);
    } catch {
      setMessage({ ok: false, text: "خطا در ارتباط با سرور" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col">
      {/* بدنه فرم */}
      <div className="py-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-ig-gray mb-1">یوزرنیم</label>
            <div className="relative">
              <input
                dir="ltr"
                value={form.username}
                onChange={(e) => set("username", e.target.value)}
                className={`${inputClass} text-left ${usernameStatus.available === false ? "border-ig-border" : usernameStatus.available === true ? "border-neutral-400" : ""}`}
                placeholder="example_user"
              />
              {usernameStatus.checking && (
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400">...</span>
              )}
              {!usernameStatus.checking && usernameStatus.available === true && (
                <Check className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ig-gray" />
              )}
              {!usernameStatus.checking && usernameStatus.available === false && (
                <X className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ig-red" />
              )}
            </div>
            {usernameStatus.error && (
              <p className="text-xs text-ig-red mt-1">{usernameStatus.error}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-bold text-ig-gray mb-1">نام</label>
            <input
              value={form.firstName}
              onChange={(e) => set("firstName", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-ig-gray mb-1">نام خانوادگی (اختیاری)</label>
            <input
              value={form.lastName}
              onChange={(e) => set("lastName", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-ig-gray mb-1">استان</label>
            <select
              value={form.province}
              onChange={(e) => {
                set("province", e.target.value);
                set("city", "");
              }}
              className={inputClass}
            >
              {PROVINCE_NAMES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-ig-gray mb-1">شهر</label>
            <select
              value={form.city}
              onChange={(e) => set("city", e.target.value)}
              className={inputClass}
            >
              <option value="">انتخاب کنید</option>
              {(PROVINCES[form.province] ?? []).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-ig-gray mb-1">سن</label>
            <input
              type="number"
              dir="ltr"
              value={form.age}
              onChange={(e) => set("age", e.target.value)}
              className={`${inputClass} text-left`}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-ig-gray mb-1">قد (سانتی متر)</label>
            <SelectMenu
              value={form.height}
              options={HEIGHT_OPTIONS}
              onChange={(v) => set("height", v)}
              searchable={false}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-ig-gray mb-1">وزن (کیلوگرم)</label>
            <SelectMenu
              value={form.weight}
              options={WEIGHT_OPTIONS}
              onChange={(v) => set("weight", v)}
              searchable={false}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-ig-gray mb-1">درآمد ماهانه</label>
            <SelectMenu
              value={form.income}
              options={INCOME_OPTIONS}
              onChange={(v) => set("income", v)}
              searchable={false}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-ig-gray mb-1">شغل</label>
            <input
              value={form.job}
              onChange={(e) => set("job", e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-ig-gray mb-1">درباره من</label>
            <textarea
              value={form.bio}
              onChange={(e) => set("bio", e.target.value)}
              rows={3}
              maxLength={500}
              className={inputClass}
              placeholder="چند جمله درباره خودتان بنویسید..."
            />
          </div>
        </div>

        {message && (
          <p
            className={`text-xs rounded-lg px-3 py-2.5 mt-3 ${
              message.ok ? "bg-ig-btn2 text-neutral-700" : "bg-ig-gray-bg text-ig-red"
            }`}
          >
            {message.text}
          </p>
        )}
      </div>

      {/* فوتر — دکمه ها */}
      <div className="flex items-center gap-2 pt-3">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-4 py-2.5 rounded-lg bg-ig-btn2 text-sm font-bold text-foreground hover:bg-ig-btn2-hover transition-colors"
        >
          انصراف
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-4 py-2.5 rounded-lg bg-ig-blue text-white text-sm font-bold hover:bg-ig-blue transition-colors disabled:opacity-40 flex items-center justify-center gap-1.5"
        >
          <Save className="w-4 h-4" />
          {loading ? "در حال ذخیره..." : "ذخیره تغییرات"}
        </button>
      </div>
    </form>
  );
}
