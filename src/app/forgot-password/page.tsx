"use client";

// بازیابی رمز عبور: شماره → کد پیامکی → رمز جدید
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input, { PasswordInput } from "@/components/ui/Input";
import Captcha from "@/components/auth/Captcha";
import { normalizeDigits, toPersianDigits } from "@/lib/format";

type Step = "phone" | "code" | "password" | "done";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [proof, setProof] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [captchaId, setCaptchaId] = useState("");
  const [captchaText, setCaptchaText] = useState("");
  const [captchaKey, setCaptchaKey] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function post(url: string, body: unknown) {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "خطایی رخ داد");
        if (data.retryAfterSec) setCooldown(data.retryAfterSec);
        return null;
      }
      return data;
    } catch {
      setError("خطا در ارتباط با سرور");
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function sendCode() {
    if (!/^09\d{9}$/.test(phone)) return setError("شماره موبایل معتبر نیست (مثال: ۰۹۱۲۳۴۵۶۷۸۹)");
    if (!captchaText.trim()) return setError("کد امنیتی را وارد کنید");
    const ok = await post("/api/auth/otp/send", { phone, purpose: "RESET", captchaId, captchaText });
    if (ok) {
      setCooldown(60);
      setStep("code");
    } else {
      setCaptchaKey((k) => k + 1); // کپچای یکبارمصرف — تازه شود
    }
  }

  async function verify() {
    if (!/^\d{6}$/.test(code)) return setError("کد ۶ رقمی را وارد کنید");
    const d = await post("/api/auth/otp/verify", { phone, purpose: "RESET", code });
    if (d) {
      setProof(d.proof);
      setStep("password");
    }
  }

  async function reset() {
    if (!/^\d{5,7}$/.test(password)) return setError("رمز عبور باید ۵ تا ۷ رقم باشد");
    if (await post("/api/auth/reset-password", { phone, proof, password })) {
      setStep("done");
      setTimeout(() => router.push("/login"), 1800);
    }
  }

  return (
    <div className="min-h-dvh bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-[350px] bg-surface border border-ig-border rounded-xl p-8">
        <h1 className="text-xl font-bold text-center mb-2">بازیابی رمز عبور</h1>

        {step === "phone" && (
          <div className="space-y-4">
            <p className="text-sm text-ig-gray text-center leading-6">شماره موبایل خود را وارد کنید تا کد تایید پیامک شود.</p>
            <Input
              label="شماره موبایل"
              type="tel"
              inputMode="tel"
              autoComplete="username"
              dir="ltr"
              className="text-left"
              value={phone}
              onChange={(e) => setPhone(normalizeDigits(e.target.value).replace(/\D/g, "").slice(0, 11))}
              placeholder="09123456789"
              data-autofocus
            />
            <Captcha
              onChange={(id, text) => { setCaptchaId(id); setCaptchaText(text); }}
              refreshKey={captchaKey}
            />
            <Button fullWidth loading={loading} onClick={sendCode}>
              ارسال کد
            </Button>
          </div>
        )}

        {step === "code" && (
          <div className="space-y-4">
            <p className="text-sm text-ig-gray text-center leading-6">
              اگر حسابی با این شماره وجود داشته باشد، کد ۶ رقمی به <span dir="ltr" className="font-bold text-foreground">{toPersianDigits(phone)}</span> پیامک شد.
            </p>
            <Input
              label="کد تایید"
              inputMode="numeric"
              autoComplete="one-time-code"
              dir="ltr"
              maxLength={6}
              className="text-center text-xl tracking-[0.5em]"
              value={code}
              onChange={(e) => setCode(normalizeDigits(e.target.value).replace(/\D/g, "").slice(0, 6))}
            />
            <Button fullWidth loading={loading} onClick={verify}>
              تایید کد
            </Button>
            <button
              type="button"
              disabled={cooldown > 0 || loading}
              // کپچا یکبارمصرف است — برای ارسال مجدد به مرحله شماره برمی گردیم
              onClick={() => { setStep("phone"); setCaptchaKey((k) => k + 1); }}
              className="w-full text-sm font-semibold text-ig-blue disabled:text-ig-gray"
            >
              {cooldown > 0 ? `ارسال مجدد (${toPersianDigits(cooldown)})` : "ارسال مجدد کد"}
            </button>
          </div>
        )}

        {step === "password" && (
          <div className="space-y-4">
            <p className="text-sm text-ig-gray text-center">رمز عبور جدید را وارد کنید.</p>
            <PasswordInput label="رمز عبور جدید" autoComplete="new-password" numeric maxLength={7} value={password} onChange={(e) => setPassword(e.target.value)} hint="۵ تا ۷ رقم" data-autofocus />
            <Button fullWidth loading={loading} onClick={reset}>
              ذخیره رمز جدید
            </Button>
          </div>
        )}

        {step === "done" && (
          <p role="status" className="text-sm text-center text-foreground leading-6 py-4">
            رمز عبور تغییر کرد. در حال انتقال به صفحه ورود...
          </p>
        )}

        {error && (
          <p role="alert" className="text-sm text-ig-red mt-4 text-center">
            {error}
          </p>
        )}

        <p className="text-center text-sm mt-6">
          <Link href="/login" className="text-ig-blue font-semibold">
            بازگشت به ورود
          </Link>
        </p>
      </div>
    </div>
  );
}
