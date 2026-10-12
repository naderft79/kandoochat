"use client";

// صفحه ورود: سبک اینستاگرام
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Input, { PasswordInput } from "@/components/ui/Input";
import { normalizeDigits } from "@/lib/format";
import { requestPushPermission } from "@/lib/pushClient";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "خطایی رخ داد");
        return;
      }
      const next = searchParams.get("next");
      const isAdminRole = ["ADMIN", "SUPER_ADMIN", "CONTENT_ADMIN", "SUPPORT_ADMIN"].includes(data.role);
      // مجوز اعلان بعد از ورود — بدون بلاک کردن
      void requestPushPermission();
      router.push(isAdminRole ? "/admin" : next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard");
      router.refresh();
    } catch {
      setError("خطا در ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-[350px]">
      <div className="bg-surface border border-ig-border rounded-xl p-8 mb-3">
        <h1 className="text-3xl font-bold text-center mb-8">کندو</h1>

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

          {error && (
            <p role="alert" className="text-sm text-ig-red">
              {error}
            </p>
          )}

          <Button type="submit" fullWidth loading={loading} disabled={!phone || !password}>
            ورود
          </Button>
        </form>

        <p className="text-center mt-5">
          <Link href="/forgot-password" className="text-sm text-ig-blue font-semibold">
            رمز عبور را فراموش کرده ام
          </Link>
        </p>
      </div>

      <div className="bg-surface border border-ig-border rounded-xl p-5 text-center">
        <p className="text-sm text-foreground">
          حساب ندارید؟{" "}
          <Link href="/register" className="text-ig-blue font-bold">
            ثبت نام کنید
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-dvh bg-surface flex flex-col items-center justify-center p-4">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
