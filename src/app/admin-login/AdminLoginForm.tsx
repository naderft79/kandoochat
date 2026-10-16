"use client";

// فرم ورود مدیریت — تم مشکی/طلایی پنل؛ فقط موبایل و رمز، بدون لینک اضافه
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Button from "@/components/ui/Button";
import Input, { PasswordInput } from "@/components/ui/Input";
import Captcha from "@/components/auth/Captcha";
import { normalizeDigits } from "@/lib/format";

export default function AdminLoginForm() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [captchaId, setCaptchaId] = useState("");
  const [captchaText, setCaptchaText] = useState("");
  const [captchaKey, setCaptchaKey] = useState(0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password, captchaId, captchaText }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "خطایی رخ داد");
        setCaptchaKey((k) => k + 1); // کپچای یکبارمصرف — بعد از هر خطا تازه شود
        return;
      }
      // سرور نقش غیر مدیر را در اپ مدیریت با همان ارور رمز رد می کند؛
      // این شاخه فقط برای ورود از مرورگر است تا کاربر عادی گیر نکند
      const isAdminRole = ["ADMIN", "SUPER_ADMIN", "CONTENT_ADMIN", "SUPPORT_ADMIN"].includes(data.role);
      // نشست جدید — پرچم مودال هشدار پاک شود تا هر ورود دوباره نمایان شود
      sessionStorage.removeItem("seyyed_warned");
      router.push(isAdminRole ? "/admin" : "/dashboard");
      router.refresh();
    } catch {
      setError("خطا در ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh lux-admin-bg flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-[350px]">
        <div className="lux-card p-8">
          <div className="flex flex-col items-center mb-8">
            <Image
              src="/admin-logo.png"
              alt="مدیریت کندو"
              width={72}
              height={72}
              className="mb-3 drop-shadow-[0_0_18px_rgba(212,175,55,0.35)]"
              priority
            />
            <h1 className="text-2xl font-black lux-gold-text">مدیریت کندو</h1>
            <p className="text-xs text-[#888] mt-1">ورود به پنل مدیریت</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3" noValidate>
            <Input
              type="tel"
              inputMode="tel"
              autoComplete="username"
              dir="ltr"
              className="text-left"
              aria-label="شماره موبایل"
              value={phone}
              onChange={(e) => setPhone(normalizeDigits(e.target.value))}
              placeholder="شماره موبایل"
              required
            />
            <PasswordInput
              autoComplete="current-password"
              aria-label="رمز عبور"
              value={password}
              onChange={(e) => setPassword(normalizeDigits(e.target.value))}
              placeholder="رمز عبور"
              required
            />
            <Captcha
              onChange={(id, text) => { setCaptchaId(id); setCaptchaText(text); }}
              refreshKey={captchaKey}
            />

            {error && (
              <p role="alert" className="text-sm text-ig-red">
                {error}
              </p>
            )}

            <Button
              type="submit"
              fullWidth
              loading={loading}
              disabled={!phone || !password || !captchaText}
              className="lux-btn-gold"
            >
              ورود
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
