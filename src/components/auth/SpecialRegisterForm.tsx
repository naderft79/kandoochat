"use client";

// فرم ثبت نام کاربران ویژه
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, UserPlus, Star, Crown, Coins, Infinity as InfinityIcon, Check, MessageCircle, Mic, Image, Heart, Users, UserCheck, AlertTriangle } from "lucide-react";
import { PROVINCES, PROVINCE_NAMES } from "@/lib/iran";
import { toPersianDigits } from "@/lib/format";

const inputClass =
  "w-full px-3 py-2.5 rounded-lg border border-ig-border bg-ig-gray-bg focus:bg-surface focus:border-ig-gray outline-none transition-colors text-sm";

const SPECIAL_FEATURES = [
  { icon: InfinityIcon, title: "اشتراک نامحدود", desc: "بدون محدودیت در چت و مشاهده پروفایل ها" },
  { icon: Coins, title: "۲۰٪ سکه اضافه", desc: "در هر انتقال سکه ۲۰ درصد بیشتر دریافت کنید" },
  { icon: Crown, title: "بج ویژه طلایی", desc: "نشان ویژه روی پروفایل شما" },
  { icon: Star, title: "اولویت در نمایش", desc: "پروفایل شما در اولویت نمایش به دیگران" },
];

const SPECIAL_MISSIONS = [
  { icon: UserCheck, title: "چت با کاربران جدید", desc: "حداقل ۱۰ کاربر جدید روزانه", target: "۱۰ کاربر" },
  { icon: MessageCircle, title: "چت با کاربران قدیمی", desc: "حداقل ۱۰ کاربر قدیمی روزانه", target: "۱۰ کاربر" },
  { icon: Mic, title: "ارسال ویس", desc: "حداقل ۱۰ ویس در ۱۰ چت مختلف روزانه", target: "۱۰ ویس" },
  { icon: Image, title: "ارسال عکس", desc: "حداقل ۱۰ عکس در ۱۰ چت مختلف روزانه", target: "۱۰ عکس" },
  { icon: Heart, title: "لایک کردن", desc: "حداقل ۱۰ لایک روزانه", target: "۱۰ لایک" },
  { icon: Users, title: "معرفی دوستان", desc: "حداقل ۵ نفر در ماه", target: "۵ نفر" },
  { icon: Check, title: "تکمیل پروفایل", desc: "عکس پروفایل + ۳ عکس گالری + بیو + شغل + محله", target: "تکمیل" },
];

export default function SpecialRegisterForm() {
  return (
    <Suspense fallback={null}>
      <SpecialRegisterFormInner />
    </Suspense>
  );
}

function SpecialRegisterFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<"register" | "missions">("register");
  const [referralCode] = useState(() => {
    const ref = searchParams.get("ref");
    return ref || "";
  });
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    phone: "",
    password: "",
    username: "",
    firstName: "",
    lastName: "",
    gender: "",
    province: "",
    city: "",
    age: "",
    height: "",
    weight: "",
    income: "",
    carModel: "",
    neighborhood: "",
    job: "",
  });

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validateStep(): string {
    if (step === 0) {
      if (!/^09\d{9}$/.test(form.phone)) return "شماره موبایل معتبر نیست";
      if (!/^\d{5,7}$/.test(form.password)) return "رمز عبور باید ۵ تا ۷ رقم باشد";
      if (!form.gender) return "جنسیت را انتخاب کنید";
    }
    if (step === 1) {
      if (!form.username || form.username.trim().length < 3) return "یوزرنیم باید حداقل ۳ کاراکتر باشد";
      if (!/^[a-zA-Z0-9_]+$/.test(form.username)) return "یوزرنیم فقط میتواند حروف انگلیسی، عدد و زیرخط باشد";
      if (form.firstName.trim().length < 2) return "نام را وارد کنید";
      if (form.lastName.trim().length < 2) return "نام خانوادگی را وارد کنید";
      if (!form.province || !form.city) return "استان و شهر را انتخاب کنید";
      const age = parseInt(form.age, 10);
      if (!age || age < 18 || age > 90) return "سن باید بین ۱۸ تا ۹۰ باشد";
    }
    if (step === 2) {
      const h = parseInt(form.height, 10);
      const w = parseInt(form.weight, 10);
      if (!h || h < 120 || h > 230) return "قد معتبر نیست (سانتی متر)";
      if (!w || w < 35 || w > 250) return "وزن معتبر نیست (کیلوگرم)";
      if (form.income === "" || parseInt(form.income, 10) < 0)
        return "میزان درآمد را وارد کنید";
    }
    return "";
  }

  function nextStep() {
    const err = validateStep();
    if (err) {
      setError(err);
      return;
    }
    setError("");
    setStep((s) => s + 1);
  }

  async function handleSubmit() {
    const err = validateStep();
    if (err) {
      setError(err);
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          age: parseInt(form.age, 10),
          height: parseInt(form.height, 10),
          weight: parseInt(form.weight, 10),
          income: parseInt(form.income || "0", 10),
          isSpecial: true,
          ...(referralCode ? { referralCode } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "خطایی رخ داد");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("خطا در ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  }

  const steps = ["حساب کاربری", "مشخصات فردی", "جزئیات بیشتر"];

  return (
    <div className="min-h-dvh bg-surface flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[400px] bg-surface border border-ig-border rounded-lg p-8"
      >
        {/* هدر ویژه */}
        <div className="flex flex-col items-center mb-4">
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-2xl font-bold text-foreground">کندو</h1>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-ig-red text-white text-xs font-black">
              <Star className="w-3 h-3 fill-ig-gold text-ig-gold" />
              ویژه
            </div>
          </div>
          <p className="text-sm text-ig-gray text-center">ثبت نام کاربران ویژه</p>
        </div>

        {/* تب ها */}
        <div className="flex gap-1 mb-6 bg-ig-gray-bg rounded-lg p-1">
          <button
            type="button"
            onClick={() => setActiveTab("register")}
            className={`flex-1 py-2 rounded-md text-xs font-bold transition-colors ${
              activeTab === "register" ? "bg-surface text-foreground ig-shadow-sm" : "text-ig-gray"
            }`}
          >
            ثبت نام
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("missions")}
            className={`flex-1 py-2 rounded-md text-xs font-bold transition-colors flex items-center justify-center gap-1 ${
              activeTab === "missions" ? "bg-surface text-foreground ig-shadow-sm" : "text-ig-gray"
            }`}
          >
            <Check className="w-3.5 h-3.5" />
            ماموریت ها
          </button>
        </div>

        {/* محتوای تب ماموریت ها */}
        {activeTab === "missions" && (
          <div className="space-y-3">
            <div className="bg-ig-gray-bg border border-ig-border rounded-xl p-3 space-y-2">
              {SPECIAL_MISSIONS.map((m, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-ig-red flex items-center justify-center shrink-0">
                    <m.icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-foreground">{m.title}</p>
                    <p className="text-xs text-ig-gray">{m.desc}</p>
                  </div>
                  <span className="text-xs font-bold text-ig-red bg-ig-gray-bg rounded-full px-2 py-0.5 shrink-0">
                    {m.target}
                  </span>
                </div>
              ))}
            </div>

            <div className="bg-ig-gray-bg border border-ig-border rounded-xl p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-ig-red shrink-0 mt-0.5" />
                <p className="text-xs text-ig-red font-bold leading-5">
                  هشدار: اگر ۵ روز متوالی ماموریت های ویژه انجام نشوند، حساب ویژه لغو می شود و تمام امکانات ویژه گرفته می شود.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab("register")}
              className="w-full py-2.5 rounded-lg bg-ig-red text-white text-sm font-bold hover:bg-ig-red/90 transition-colors"
            >
              شروع ثبت نام
            </button>
          </div>
        )}

        {/* محتوای تب ثبت نام */}
        {activeTab === "register" && (
          <>
        {/* امکانات ویژه */}
        {step === 0 && (
          <div className="mb-6 space-y-2">
            <div className="bg-ig-gray-bg border border-ig-border rounded-xl p-3 space-y-2">
              {SPECIAL_FEATURES.map((f, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-ig-red flex items-center justify-center shrink-0">
                    <f.icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-foreground">{f.title}</p>
                    <p className="text-xs text-ig-gray">{f.desc}</p>
                  </div>
                  <Check className="w-4 h-4 text-ig-gray shrink-0" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* نشانگر مراحل */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                  i <= step
                    ? "bg-ig-red text-white"
                    : "bg-ig-gray-bg text-ig-gray"
                }`}
              >
                {toPersianDigits(i + 1)}. {label}
              </div>
              {i < steps.length - 1 && (
                <span className="w-4 h-0.5 bg-ig-border rounded" />
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
            {step === 0 && (
              <>
                <div>
                  <label className="block text-xs font-bold text-ig-gray mb-1.5">
                    شماره موبایل *
                  </label>
                  <input
                    type="tel"
                    dir="ltr"
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                    placeholder="09123456789"
                    className={`${inputClass} text-left`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ig-gray mb-1.5">
                    رمز عبور (۵ تا ۷ رقم) *
                  </label>
                  <input
                    type="password"
                    dir="ltr"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={7}
                    value={form.password}
                    onChange={(e) => set("password", e.target.value.replace(/\D/g, ""))}
                    className={`${inputClass} text-left`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ig-gray mb-1.5">
                    جنسیت *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: "MALE", label: "مرد" },
                      { value: "FEMALE", label: "زن" },
                    ].map((g) => (
                      <button
                        key={g.value}
                        type="button"
                        onClick={() => set("gender", g.value)}
                        className={`py-2.5 rounded-lg border text-sm font-bold transition-colors ${
                          form.gender === g.value
                            ? g.value === "MALE"
                              ? "border-ig-border bg-ig-gray-bg text-ig-blue"
                              : "border-ig-border bg-ig-gray-bg text-ig-red"
                            : "border-ig-border text-ig-gray hover:border-ig-gray"
                        }`}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <div>
                  <label className="block text-xs font-bold text-ig-gray mb-1.5">
                    یوزرنیم (انگلیسی) *
                  </label>
                  <input
                    dir="ltr"
                    value={form.username}
                    onChange={(e) => set("username", e.target.value)}
                    placeholder="example_user"
                    className={`${inputClass} text-left`}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-ig-gray mb-1.5">
                      نام *
                    </label>
                    <input
                      value={form.firstName}
                      onChange={(e) => set("firstName", e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-ig-gray mb-1.5">
                      نام خانوادگی *
                    </label>
                    <input
                      value={form.lastName}
                      onChange={(e) => set("lastName", e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-ig-gray mb-1.5">
                      استان *
                    </label>
                    <select
                      value={form.province}
                      onChange={(e) => {
                        set("province", e.target.value);
                        set("city", "");
                      }}
                      className={inputClass}
                    >
                      <option value="">انتخاب کنید</option>
                      {PROVINCE_NAMES.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-ig-gray mb-1.5">
                      شهر *
                    </label>
                    <select
                      value={form.city}
                      onChange={(e) => set("city", e.target.value)}
                      disabled={!form.province}
                      className={inputClass}
                    >
                      <option value="">انتخاب کنید</option>
                      {(PROVINCES[form.province] ?? []).map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-ig-gray mb-1.5">
                    سن *
                  </label>
                  <input
                    type="number"
                    dir="ltr"
                    value={form.age}
                    onChange={(e) => set("age", e.target.value)}
                    min={18}
                    max={90}
                    className={`${inputClass} text-left`}
                  />
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-ig-gray mb-1.5">
                      قد (سانتی متر) *
                    </label>
                    <input
                      type="number"
                      dir="ltr"
                      value={form.height}
                      onChange={(e) => set("height", e.target.value)}
                      className={`${inputClass} text-left`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-ig-gray mb-1.5">
                      وزن (کیلوگرم) *
                    </label>
                    <input
                      type="number"
                      dir="ltr"
                      value={form.weight}
                      onChange={(e) => set("weight", e.target.value)}
                      className={`${inputClass} text-left`}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-ig-gray mb-1.5">
                    میزان درآمد ماهانه (تومان) *
                  </label>
                  <input
                    type="number"
                    dir="ltr"
                    value={form.income}
                    onChange={(e) => set("income", e.target.value)}
                    className={`${inputClass} text-left`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ig-gray mb-1.5">
                    شغل
                  </label>
                  <input
                    value={form.job}
                    onChange={(e) => set("job", e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-ig-gray mb-1.5">
                      مدل ماشین
                    </label>
                    <input
                      value={form.carModel}
                      onChange={(e) => set("carModel", e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-ig-gray mb-1.5">
                      محله خانه
                    </label>
                    <input
                      value={form.neighborhood}
                      onChange={(e) => set("neighborhood", e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {error && (
          <p className="text-xs text-ig-red mt-4">
            {error}
          </p>
        )}

        <div className="flex items-center justify-between gap-3 mt-6">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="px-5 py-2.5 rounded-lg border border-ig-border text-foreground text-sm font-bold hover:bg-ig-gray-bg transition-colors flex items-center gap-1"
            >
              <ArrowRight className="w-4 h-4" />
              قبلی
            </button>
          ) : (
            <span />
          )}
          {step < 2 ? (
            <button
              type="button"
              onClick={nextStep}
              className="px-6 py-2.5 rounded-lg bg-ig-red text-white text-sm font-bold hover:bg-ig-red/90 transition-colors flex items-center gap-1"
            >
              بعدی
              <ArrowLeft className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2.5 rounded-lg bg-ig-red text-white text-sm font-bold hover:bg-ig-red/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              {loading ? "در حال ثبت نام..." : "تکمیل ثبت نام ویژه"}
            </button>
          )}
        </div>

        <p className="text-center text-sm text-ig-gray mt-6">
          قبلا ثبت نام کرده اید؟{" "}
          <Link href="/login" className="text-ig-blue font-bold hover:text-ig-blue-hover">
            وارد شوید
          </Link>
        </p>
          </>
        )}
      </motion.div>
    </div>
  );
}
