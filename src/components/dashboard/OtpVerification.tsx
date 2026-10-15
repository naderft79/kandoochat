"use client";

// کامپوننت تایید موبایل OTP
import { useEffect, useState } from "react";
import { Phone, Check, Loader2 } from "lucide-react";
import Captcha from "@/components/auth/Captcha";

export default function OtpVerification({ phoneVerified, phone }: { phoneVerified: boolean; phone: string }) {
  const [otpEnabled, setOtpEnabled] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [captchaId, setCaptchaId] = useState("");
  const [captchaText, setCaptchaText] = useState("");
  const [captchaKey, setCaptchaKey] = useState(0);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.otpEnabled !== undefined) setOtpEnabled(data.otpEnabled);
      })
      .catch(() => {});
  }, []);

  async function sendOtp() {
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ captchaId, captchaText }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowOtp(true);
      } else {
        setError(data.error || "خطا");
        setCaptchaKey((k) => k + 1); // کپچای یکبارمصرف — تازه شود
      }
    } finally {
      setSending(false);
    }
  }

  async function verifyOtp() {
    setVerifying(true);
    setError("");
    try {
      const res = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        setShowOtp(false);
      } else {
        setError(data.error || "خطا");
      }
    } finally {
      setVerifying(false);
    }
  }

  if (phoneVerified || success) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-ig-gray-bg border border-ig-border">
        <Check className="w-4 h-4 text-ig-gray" />
        <span className="text-sm font-bold text-ig-gray">موبایل تایید شده</span>
        <span className="text-xs text-ig-gray mr-auto" dir="ltr">{phone}</span>
      </div>
    );
  }

  if (!otpEnabled) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-ig-gray-bg border border-ig-border">
        <Phone className="w-4 h-4 text-ig-gold" />
        <span className="text-sm font-bold text-ig-gold">موبایل تایید نشده</span>
        <span className="text-xs text-ig-gray mr-auto" dir="ltr">{phone}</span>
      </div>

      {!showOtp ? (
        <div className="space-y-2">
          <Captcha
            onChange={(id, text) => { setCaptchaId(id); setCaptchaText(text); }}
            refreshKey={captchaKey}
          />
          <button
            onClick={sendOtp}
            disabled={sending || !captchaText.trim()}
            className="w-full py-2.5 rounded-xl bg-ig-blue text-white text-sm font-bold disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Phone className="w-4 h-4" />}
            ارسال کد تایید
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="کد ۶ رقمی"
            maxLength={6}
            className="w-full px-4 py-2.5 rounded-xl border border-ig-border focus:border-ig-gray outline-none text-sm text-center tracking-widest"
          />
          <button
            onClick={verifyOtp}
            disabled={verifying || code.length !== 6}
            className="w-full py-2.5 rounded-xl bg-ig-blue text-white text-sm font-bold disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            تایید کد
          </button>
        </div>
      )}

      {error && <p className="text-xs text-ig-red">{error}</p>}
    </div>
  );
}
