"use client";

// ثبت نام سه مرحله ای: حساب کاربری (+ کد دعوت) → تایید موبایل (OTP) → مشخصات فردی
import { useCallback, useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, ArrowLeft, Check, BadgeCheck } from "lucide-react";
import { PROVINCES, PROVINCE_NAMES } from "@/lib/iran";
import { toPersianDigits, normalizeDigits } from "@/lib/format";
import { currentJalaliYear } from "@/lib/jalali";
import { requestPushPermission } from "@/lib/pushClient";
import Button from "@/components/ui/Button";
import Input, { PasswordInput } from "@/components/ui/Input";
import SelectMenu, { type SelectOption } from "@/components/ui/SelectMenu";
import { cn } from "@/components/ui/cn";

const STEPS = ["حساب کاربری", "تایید موبایل", "مشخصات فردی"];
const CURRENT_JY = currentJalaliYear();

// گزینه های از پیش تعیین شده
const BIRTH_YEAR_OPTIONS: SelectOption[] = Array.from({ length: 63 }, (_, i) => {
  const y = CURRENT_JY - 18 - i;
  return { value: String(y), label: `${toPersianDigits(y)} (${toPersianDigits(CURRENT_JY - y)} سال)` };
});
const HEIGHT_OPTIONS: SelectOption[] = Array.from({ length: 111 }, (_, i) => {
  const v = 120 + i;
  return { value: String(v), label: `${toPersianDigits(v)} سانتی متر` };
});
const WEIGHT_OPTIONS: SelectOption[] = Array.from({ length: 216 }, (_, i) => {
  const v = 35 + i;
  return { value: String(v), label: `${toPersianDigits(v)} کیلوگرم` };
});
const INCOME_OPTIONS: SelectOption[] = [
  { value: "0", label: "بدون درآمد" },
  { value: "20000000", label: "۱۰ تا ۳۰ میلیون تومان" },
  { value: "40000000", label: "۳۰ تا ۵۰ میلیون تومان" },
  { value: "75000000", label: "۵۰ تا ۱۰۰ میلیون تومان" },
  { value: "200000000", label: "۱۰۰ تا ۳۰۰ میلیون تومان" },
  { value: "400000000", label: "بیش از ۳۰۰ میلیون تومان" },
];
const PROVINCE_OPTIONS: SelectOption[] = PROVINCE_NAMES.map((p) => ({ value: p, label: p }));

type Form = {
  phone: string; password: string; gender: string; username: string; firstName: string; lastName: string;
  province: string; city: string; birthYear: string; height: string; weight: string; income: string;
};
type Errors = Partial<Record<keyof Form | "terms" | "code" | "referral", string>>;

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}

// رمز عبور کاربر فقط عددی است — بین ۵ تا ۷ رقم
const PASSWORD_RE = /^\d{5,7}$/;

// نام و نام خانوادگی فقط حروف فارسی + فاصله و نیم فاصله
const PERSIAN_NAME_RE = /^[آءأإابپتثجچحخدذرزژسشصضطظعغفقکگلمنوهیئؤ\s\u200C]+$/;
// کاراکترهای عربی پرکاربرد کیبورد به معادل فارسی تبدیل می شوند؛ بقیه حذف و خطا می گیرند
function persianOnly(v: string): { value: string; blocked: boolean } {
  const normalized = v.replace(/ي/g, "ی").replace(/ك/g, "ک");
  const value = normalized.replace(/[^آءأإابپتثجچحخدذرزژسشصضطظعغفقکگلمنوهیئؤ\s\u200C]/g, "");
  return { value, blocked: value !== normalized };
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [terms, setTerms] = useState(false);
  const [code, setCode] = useState("");
  const [proof, setProof] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [usernameState, setUsernameState] = useState<"idle" | "checking" | "ok" | "taken">("idle");
  // کد دعوت — باید با دکمه بررسی تایید شود؛ نامعتبر یعنی ثبت نام بدون کد
  const [referralCode, setReferralCode] = useState(() => searchParams.get("ref") || "");
  const [refState, setRefState] = useState<"idle" | "checking" | "ok" | "invalid">("idle");
  const [refName, setRefName] = useState("");
  const [form, setForm] = useState<Form>({
    phone: "", password: "", gender: "", username: "", firstName: "", lastName: "", province: "", city: "",
    birthYear: "", height: "", weight: "", income: "",
  });
  const firstErrorRef = useRef<HTMLDivElement>(null);

  const set = <K extends keyof Form>(k: K, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };
  const digitsOnly = (v: string) => normalizeDigits(v).replace(/\D/g, "");

  // شمارش معکوس ارسال مجدد
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  // بررسی لحظه ای یوزرنیم
  useEffect(() => {
    const u = form.username;
    if (u.length < 3 || !/^[a-zA-Z0-9_]+$/.test(u)) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setUsernameState("checking");
      try {
        const r = await fetch(`/api/auth/check-username?username=${encodeURIComponent(u)}`, { signal: ctrl.signal });
        const d = await r.json();
        setUsernameState(d.available ? "ok" : "taken");
      } catch {
        setUsernameState("idle");
      }
    }, 450);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [form.username]);

  // بررسی کد دعوت — هنگام زدن دکمه بعدی خودکار انجام می شود؛ true یعنی معتبر
  const checkReferral = useCallback(async (value?: string): Promise<boolean> => {
    const c = (value ?? referralCode).trim();
    if (!c) {
      setRefState("idle");
      setRefName("");
      return true;
    }
    setRefState("checking");
    setErrors((e) => ({ ...e, referral: undefined }));
    try {
      const r = await fetch(`/api/auth/check-referral?code=${encodeURIComponent(c)}`);
      const d = await r.json();
      if (d.valid) {
        setRefState("ok");
        setRefName(d.name ?? "");
        return true;
      }
      setRefState("invalid");
      setRefName("");
      return false;
    } catch {
      setRefState("idle");
      setRefName("");
      return false;
    }
  }, [referralCode]);

  // کد دعوت از لینک (?ref=) — خودکار بررسی می شود
  useEffect(() => {
    const initial = searchParams.get("ref");
    if (!initial) return;
    const t = setTimeout(() => void checkReferral(initial), 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendCode = useCallback(async () => {
    setFormError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: form.phone, purpose: "REGISTER" }),
      });
      const d = await res.json();
      if (!res.ok) {
        setFormError(d.error ?? "ارسال کد ناموفق بود");
        if (d.retryAfterSec) setCooldown(d.retryAfterSec);
        return false;
      }
      setSentTo(form.phone);
      setCooldown(60);
      return true;
    } catch {
      setFormError("خطا در ارتباط با سرور");
      return false;
    } finally {
      setLoading(false);
    }
  }, [form.phone]);

  async function verifyCode() {
    if (proof) {
      // قبلا تایید شده — بدون درخواست دوباره جلو برو
      setStep(2);
      return;
    }
    if (!/^\d{6}$/.test(code)) {
      setErrors({ code: "کد ۶ رقمی را وارد کنید" });
      return;
    }
    setLoading(true);
    setFormError("");
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: form.phone, purpose: "REGISTER", code }),
      });
      const d = await res.json();
      if (!res.ok) {
        setErrors({ code: d.error ?? "کد اشتباه است" });
        return;
      }
      setProof(d.proof);
      setStep(2);
    } catch {
      setFormError("خطا در ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  }

  function validate(s: number): Errors {
    const e: Errors = {};
    if (s === 0) {
      if (!/^09\d{9}$/.test(form.phone)) e.phone = "شماره موبایل معتبر نیست (مثال: ۰۹۱۲۳۴۵۶۷۸۹)";
      if (!PASSWORD_RE.test(form.password)) e.password = "رمز عبور باید ۵ تا ۷ رقم باشد";
      if (!form.gender) e.gender = "جنسیت را انتخاب کنید";
      if (referralCode.trim() && refState === "invalid") e.referral = "کد دعوت معتبر نیست — آن را پاک یا اصلاح کنید";
      if (!terms) e.terms = "پذیرش قوانین و تایید ۱۸ سال تمام الزامی است";
    }
    if (s === 2) {
      if (form.username.trim().length < 3) e.username = "یوزرنیم باید حداقل ۳ کاراکتر باشد";
      else if (!/^[a-zA-Z0-9_]+$/.test(form.username)) e.username = "فقط حروف انگلیسی، عدد و زیرخط";
      else if (usernameState === "taken") e.username = "این یوزرنیم قبلا انتخاب شده است";
      if (form.firstName.trim().length < 2) e.firstName = "نام را وارد کنید";
      else if (!PERSIAN_NAME_RE.test(form.firstName.trim())) e.firstName = "فقط اسم فارسی پشتیبانی می شود";
      if (form.lastName.trim().length < 2) e.lastName = "نام خانوادگی را وارد کنید";
      else if (!PERSIAN_NAME_RE.test(form.lastName.trim())) e.lastName = "فقط اسم فارسی پشتیبانی می شود";
      if (!form.province) e.province = "استان را انتخاب کنید";
      if (!form.city) e.city = "شهر را انتخاب کنید";
      if (!form.birthYear) e.birthYear = "سال تولد را انتخاب کنید";
      if (!form.height) e.height = "قد را انتخاب کنید";
      if (!form.weight) e.weight = "وزن را انتخاب کنید";
      if (form.income === "") e.income = "درآمد ماهانه را انتخاب کنید";
    }
    return e;
  }

  async function next() {
    const e = validate(step);
    setErrors(e);
    setFormError("");
    if (Object.keys(e).length) {
      requestAnimationFrame(() => firstErrorRef.current?.querySelector<HTMLElement>("[aria-invalid='true']")?.focus());
      return;
    }
    if (step === 0) {
      // کد دعوت اگر وارد شده باید معتبر باشد — نامعتبر یعنی پاک یا اصلاح شود، بدون آن به مرحله بعد نمی رویم
      if (referralCode.trim() && refState !== "ok") {
        setLoading(true);
        const refOk = await checkReferral();
        setLoading(false);
        if (!refOk) {
          setErrors({ referral: "کد دعوت معتبر نیست — آن را پاک یا اصلاح کنید" });
          return;
        }
      }
      // کد فقط برای این شماره ارسال می شود؛ اگر قبلا برای همین شماره فرستاده شده دوباره نمی فرستیم
      if (sentTo !== form.phone) {
        setCode("");
        setProof("");
        if (!(await sendCode())) return;
      }
      setStep(1);
      return;
    }
    if (step === 1) return verifyCode();
    setStep((s) => s + 1);
  }

  async function submit() {
    const e = validate(2);
    setErrors(e);
    if (Object.keys(e).length) return;
    setLoading(true);
    setFormError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          birthYear: undefined,
          // سال تولد شمسی به سن تبدیل می شود
          age: CURRENT_JY - parseInt(form.birthYear, 10),
          height: parseInt(form.height, 10),
          weight: parseInt(form.weight, 10),
          income: parseInt(form.income || "0", 10),
          phoneProof: proof,
          termsAccepted: terms,
          // فقط کد دعوت تایید شده ارسال می شود — نامعتبر یعنی ثبت نام بدون کد
          ...(refState === "ok" && referralCode.trim() ? { referralCode: referralCode.trim() } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error ?? "خطایی رخ داد");
        return;
      }
      // مجوز اعلان بلافاصله بعد از ثبت نام — بدون بلاک کردن ورود
      void requestPushPermission();
      router.push("/dashboard");
      router.refresh();
    } catch {
      setFormError("خطا در ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-[400px] bg-surface border border-ig-border rounded-xl p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-center mb-1">کندو</h1>
        <p className="text-sm text-ig-gray text-center mb-5">ثبت نام در کندو</p>

        <ol className="flex items-center justify-center gap-1.5 mb-6" aria-label="مراحل ثبت نام">
          {STEPS.map((label, i) => (
            <li key={label} aria-current={i === step ? "step" : undefined} className="flex items-center gap-1.5">
              <span
                className={cn(
                  "w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center",
                  i < step ? "bg-foreground text-white" : i === step ? "bg-ig-blue text-white" : "bg-ig-btn2 text-ig-gray"
                )}
              >
                {i < step ? <Check className="w-4 h-4" aria-hidden /> : toPersianDigits(i + 1)}
              </span>
              {i < STEPS.length - 1 && <span className="w-4 h-px bg-ig-border" aria-hidden />}
            </li>
          ))}
        </ol>
        <h2 className="text-base font-bold mb-4">{STEPS[step]}</h2>

        <div ref={firstErrorRef} className="space-y-4">
          {step === 0 && (
            <>
              <Input
                label="شماره موبایل"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                dir="ltr"
                className="text-left"
                value={form.phone}
                onChange={(e) => set("phone", digitsOnly(e.target.value).slice(0, 11))}
                placeholder="09123456789"
                error={errors.phone}
              />
              <div>
                <PasswordInput
                  label="رمز عبور"
                  autoComplete="new-password"
                  numeric
                  maxLength={7}
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  error={errors.password}
                  hint="۵ تا ۷ رقم"
                />
              </div>
              <fieldset>
                <legend className="text-sm font-semibold mb-1.5">جنسیت</legend>
                <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-invalid={!!errors.gender || undefined}>
                  {[
                    { value: "MALE", label: "مرد" },
                    { value: "FEMALE", label: "زن" },
                  ].map((g) => (
                    <button
                      key={g.value}
                      type="button"
                      role="radio"
                      aria-checked={form.gender === g.value}
                      onClick={() => set("gender", g.value)}
                      className={cn(
                        "h-11 rounded-lg border text-sm font-semibold transition-colors",
                        form.gender === g.value ? "border-foreground bg-foreground text-white" : "border-ig-border text-foreground"
                      )}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
                {errors.gender && <p role="alert" className="text-sm text-ig-red mt-1.5">{errors.gender}</p>}
              </fieldset>

              {/* کد دعوت — اختیاری؛ هنگام زدن «بعدی» خودکار بررسی می شود */}
              <div className="space-y-1.5">
                <span className="block text-sm font-semibold">کد دعوت (اختیاری)</span>
                <input
                  dir="ltr"
                  autoCapitalize="characters"
                  aria-invalid={!!errors.referral || undefined}
                  className={cn(
                    "w-full h-11 px-3 rounded-lg border bg-ig-gray-bg text-base text-left outline-none transition-colors",
                    "focus:bg-surface focus:border-ig-gray",
                    errors.referral || refState === "invalid" ? "border-ig-red" : refState === "ok" ? "border-ig-online" : "border-ig-border"
                  )}
                  value={referralCode}
                  onChange={(e) => {
                    setReferralCode(e.target.value);
                    setRefState("idle");
                    setRefName("");
                    setErrors((x) => ({ ...x, referral: undefined }));
                  }}
                  placeholder="KANDOO1"
                />
                {refState === "ok" && (
                  <p className="text-sm text-ig-online flex items-center gap-1" role="status">
                    <BadgeCheck className="w-4 h-4" aria-hidden />
                    کد دعوت {refName ? `«${refName}»` : ""} معتبر است
                  </p>
                )}
                {refState === "checking" && (
                  <p className="text-sm text-ig-gray" role="status">در حال بررسی کد دعوت...</p>
                )}
                {(errors.referral || (refState === "invalid" && !errors.referral)) && (
                  <p className="text-sm text-ig-red" role="alert">{errors.referral ?? "کد دعوت معتبر نیست — آن را پاک یا اصلاح کنید"}</p>
                )}
              </div>

              <div>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={terms}
                    aria-invalid={!!errors.terms || undefined}
                    onChange={(e) => {
                      setTerms(e.target.checked);
                      setErrors((x) => ({ ...x, terms: undefined }));
                    }}
                    className="mt-1 w-5 h-5 accent-foreground"
                  />
                  <span className="text-sm leading-6">
                    <Link href="/terms" className="text-ig-blue font-semibold" target="_blank">قوانین</Link> و{" "}
                    <Link href="/privacy" className="text-ig-blue font-semibold" target="_blank">حریم خصوصی</Link> را خوانده ام و حداقل ۱۸ سال دارم.
                  </span>
                </label>
                {errors.terms && <p role="alert" className="text-sm text-ig-red mt-1.5">{errors.terms}</p>}
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <p className="text-sm text-ig-gray leading-6">
                کد ۶ رقمی به شماره <span dir="ltr" className="font-bold text-foreground">{toPersianDigits(sentTo)}</span> پیامک شد.
              </p>
              <Input
                label="کد تایید"
                inputMode="numeric"
                autoComplete="one-time-code"
                dir="ltr"
                className="text-center text-xl tracking-[0.5em]"
                maxLength={6}
                value={code}
                onChange={(e) => {
                  setCode(digitsOnly(e.target.value).slice(0, 6));
                  setErrors({});
                }}
                error={errors.code}
                data-autofocus
              />
              <div className="flex items-center justify-between text-sm">
                <button type="button" onClick={() => setStep(0)} className="text-ig-gray">
                  ویرایش شماره
                </button>
                <button
                  type="button"
                  disabled={cooldown > 0 || loading}
                  onClick={sendCode}
                  className="font-semibold text-ig-blue disabled:text-ig-gray"
                >
                  {cooldown > 0 ? `ارسال مجدد (${toPersianDigits(cooldown)})` : "ارسال مجدد کد"}
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <Input
                  label="یوزرنیم (انگلیسی)"
                  dir="ltr"
                  autoComplete="username"
                  autoCapitalize="none"
                  className="text-left"
                  value={form.username}
                  onChange={(e) => {
                    set("username", e.target.value);
                    setUsernameState("idle");
                  }}
                  placeholder="example_user"
                  error={errors.username}
                />
                <p className="text-sm mt-1 min-h-5" aria-live="polite">
                  {usernameState === "checking" && <span className="text-ig-gray">در حال بررسی...</span>}
                  {usernameState === "ok" && <span className="text-ig-gray">این یوزرنیم آزاد است</span>}
                  {usernameState === "taken" && !errors.username && <span className="text-ig-red">این یوزرنیم قبلا انتخاب شده است</span>}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="نام"
                  autoComplete="given-name"
                  value={form.firstName}
                  onChange={(e) => {
                    const r = persianOnly(e.target.value);
                    set("firstName", r.value);
                    if (r.blocked) setErrors((x) => ({ ...x, firstName: "فقط اسم فارسی پشتیبانی می شود" }));
                  }}
                  error={errors.firstName}
                />
                <Input
                  label="نام خانوادگی"
                  autoComplete="family-name"
                  value={form.lastName}
                  onChange={(e) => {
                    const r = persianOnly(e.target.value);
                    set("lastName", r.value);
                    if (r.blocked) setErrors((x) => ({ ...x, lastName: "فقط اسم فارسی پشتیبانی می شود" }));
                  }}
                  error={errors.lastName}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <SelectMenu
                  label="استان"
                  value={form.province}
                  options={PROVINCE_OPTIONS}
                  onChange={(v) => {
                    set("province", v);
                    set("city", "");
                  }}
                  searchable={false}
                  error={errors.province}
                />
                <SelectMenu
                  label="شهر"
                  value={form.city}
                  options={(PROVINCES[form.province] ?? []).map((c) => ({ value: c, label: c }))}
                  onChange={(v) => set("city", v)}
                  disabled={!form.province}
                  searchable={false}
                  error={errors.city}
                />
              </div>
              <SelectMenu
                label="سال تولد"
                value={form.birthYear}
                options={BIRTH_YEAR_OPTIONS}
                onChange={(v) => set("birthYear", v)}
                searchable={false}
                error={errors.birthYear}
              />
              <div className="grid grid-cols-2 gap-3">
                <SelectMenu
                  label="قد"
                  value={form.height}
                  options={HEIGHT_OPTIONS}
                  onChange={(v) => set("height", v)}
                  searchable={false}
                  error={errors.height}
                />
                <SelectMenu
                  label="وزن"
                  value={form.weight}
                  options={WEIGHT_OPTIONS}
                  onChange={(v) => set("weight", v)}
                  searchable={false}
                  error={errors.weight}
                />
              </div>
              <SelectMenu
                label="درآمد ماهانه"
                value={form.income}
                options={INCOME_OPTIONS}
                onChange={(v) => set("income", v)}
                searchable={false}
                error={errors.income}
              />
            </>
          )}
        </div>

        {formError && (
          <p role="alert" className="text-sm text-ig-red mt-4">
            {formError}
          </p>
        )}

        <div className="flex items-center justify-between gap-3 mt-6">
          {step > 0 ? (
            <Button variant="secondary" onClick={() => setStep((s) => s - 1)}>
              <ArrowRight className="w-4 h-4" aria-hidden />
              قبلی
            </Button>
          ) : (
            <span />
          )}
          {step < 2 ? (
            <Button onClick={next} loading={loading}>
              {step === 1 ? "تایید کد" : "بعدی"}
              <ArrowLeft className="w-4 h-4" aria-hidden />
            </Button>
          ) : (
            <Button onClick={submit} loading={loading}>
              تکمیل ثبت نام
            </Button>
          )}
        </div>

        <p className="text-center text-sm text-ig-gray mt-6">
          قبلا ثبت نام کرده اید؟{" "}
          <Link href="/login" className="text-ig-blue font-bold">
            وارد شوید
          </Link>
        </p>
      </div>
    </div>
  );
}
