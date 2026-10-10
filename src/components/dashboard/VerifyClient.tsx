"use client";

// صفحه احراز هویت — دو تب: تیک آبی (۵ سلفی + ویس) و احراز هویت کامل (مدارک + مشخصات)
import { useEffect, useMemo, useRef, useState } from "react";
import {
  BadgeCheck,
  Camera,
  Check,
  Clock,
  IdCard,
  Mic,
  ShieldCheck,
  X,
} from "lucide-react";
import Button from "@/components/ui/Button";
import { cn } from "@/components/ui/cn";
import VoiceRecorder from "@/components/dashboard/VoiceRecorder";
import { toPersianDigits } from "@/lib/format";
import {
  JALALI_MONTHS,
  currentJalaliYear,
  jalaliMonthDays,
  jalaliToISODate,
} from "@/lib/jalali";

type Tab = "bluetick" | "kyc";

type Props = {
  initialTab: Tab;
  isVerified: boolean;
  blueTickStatus: string | null;
  isIdentityVerified: boolean;
  kycStatus: string | null;
};

const inputClass =
  "w-full px-4 py-3 rounded-lg border border-ig-border focus:border-neutral-400 outline-none transition-colors text-left";

// ساخت پیش نمایش امن برای فایل انتخاب شده با آزادسازی خودکار URL
function useObjectUrl(file: File | null) {
  const url = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => {
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [url]);
  return url;
}

// اسلات انتخاب یک عکس با پیش نمایش
function ImageSlot({
  file,
  onChange,
  compact,
}: {
  file: File | null;
  onChange: (f: File | null) => void;
  compact?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const preview = useObjectUrl(file);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={cn(
          "w-full border border-dashed rounded-xl flex flex-col items-center justify-center gap-1 hover:bg-ig-gray-bg transition-colors overflow-hidden relative",
          file ? "border-ig-border" : "border-ig-border",
          compact ? "aspect-square" : "py-6"
        )}
      >
        {file && preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="پیش نمایش"
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <>
            <Camera className="w-6 h-6 text-ig-gray" strokeWidth={2} />
            <span className="text-xs text-ig-gray">انتخاب عکس</span>
          </>
        )}
      </button>
      {file && (
        <button
          type="button"
          aria-label="حذف عکس"
          onClick={() => onChange(null)}
          className="absolute top-1.5 left-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center active:scale-90 transition-transform"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => onChange(e.target.files?.[0] || null)}
        className="hidden"
      />
    </div>
  );
}

// بنر وضعیت درخواست — تایید شده یا در حال بررسی
function StatusBanner({ kind }: { kind: "ok" | "pending" }) {
  if (kind === "ok") {
    return (
      <div className="bg-white border border-ig-border rounded-2xl p-5 flex items-center gap-3 ig-rise">
        <span className="w-11 h-11 rounded-full bg-ig-blue/10 flex items-center justify-center shrink-0">
          <BadgeCheck className="w-6 h-6 text-ig-blue" />
        </span>
        <div>
          <p className="text-sm font-bold text-foreground">تایید شده</p>
          <p className="text-xs text-ig-gray mt-0.5">
            درخواست شما توسط مدیر تایید شده است
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="bg-white border border-ig-border rounded-2xl p-5 flex items-center gap-3 ig-rise">
      <span className="w-11 h-11 rounded-full bg-ig-gray-bg flex items-center justify-center shrink-0">
        <Clock className="w-6 h-6 text-ig-gray" />
      </span>
      <div>
        <p className="text-sm font-bold text-foreground">
          مدارک شما در حال بررسی است
        </p>
        <p className="text-xs text-ig-gray mt-0.5">
          نتیجه بررسی از طریق اعلان به شما اطلاع داده می شود
        </p>
      </div>
    </div>
  );
}

export default function VerifyClient({
  initialTab,
  isVerified,
  blueTickStatus,
  isIdentityVerified,
  kycStatus,
}: Props) {
  const [tab, setTab] = useState<Tab>(initialTab);

  // --- وضعیت فرم تیک آبی ---
  const [btSelfies, setBtSelfies] = useState<(File | null)[]>([
    null,
    null,
    null,
    null,
    null,
  ]);
  const [btVoice, setBtVoice] = useState<File | null>(null);
  const [btRules, setBtRules] = useState(false);
  const [btLoading, setBtLoading] = useState(false);
  const [btMsg, setBtMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [btDone, setBtDone] = useState<string | null>(
    blueTickStatus === "PENDING" ? "PENDING" : null
  );

  // --- وضعیت فرم احراز هویت کامل ---
  const [kycSelfie, setKycSelfie] = useState<File | null>(null);
  const [kycVoice, setKycVoice] = useState<File | null>(null);
  const [kycFront, setKycFront] = useState<File | null>(null);
  const [kycBack, setKycBack] = useState<File | null>(null);
  const [kycName, setKycName] = useState("");
  const [kycCode, setKycCode] = useState("");
  // تاریخ تولد شمسی — سه لیست جداگانه روز/ماه/سال
  const [kycDay, setKycDay] = useState("");
  const [kycMonth, setKycMonth] = useState("");
  const [kycYear, setKycYear] = useState("");
  const [kycRules, setKycRules] = useState(false);
  const [kycLoading, setKycLoading] = useState(false);
  const [kycMsg, setKycMsg] = useState<{ ok: boolean; text: string } | null>(
    null
  );
  const [kycDone, setKycDone] = useState<string | null>(
    kycStatus === "PENDING" ? "PENDING" : null
  );

  async function submitBlueTick(e: React.FormEvent) {
    e.preventDefault();
    setBtMsg(null);
    setBtLoading(true);
    try {
      const formData = new FormData();
      btSelfies.forEach((f) => f && formData.append("selfies", f));
      if (btVoice) formData.append("voice", btVoice);
      formData.append("acceptedRules", String(btRules));
      const res = await fetch("/api/verify-badge", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setBtMsg({ ok: false, text: data.error ?? "خطایی رخ داد" });
        return;
      }
      setBtDone("PENDING");
      setBtSelfies([null, null, null, null, null]);
      setBtVoice(null);
      setBtRules(false);
    } catch {
      setBtMsg({ ok: false, text: "خطا در ارتباط با سرور" });
    } finally {
      setBtLoading(false);
    }
  }

  async function submitKyc(e: React.FormEvent) {
    e.preventDefault();
    setKycMsg(null);
    setKycLoading(true);
    try {
      const formData = new FormData();
      if (kycSelfie) formData.append("selfie", kycSelfie);
      if (kycVoice) formData.append("voice", kycVoice);
      if (kycFront) formData.append("idCardFront", kycFront);
      if (kycBack) formData.append("idCardBack", kycBack);
      formData.append("nationalCode", kycCode);
      formData.append("fullName", kycName);
      // تبدیل تاریخ تولد شمسی انتخابی به میلادی برای ذخیره
      formData.append(
        "birthDate",
        jalaliToISODate(Number(kycYear), Number(kycMonth), Number(kycDay))
      );
      formData.append("acceptedRules", String(kycRules));
      const res = await fetch("/api/verify-identity", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setKycMsg({ ok: false, text: data.error ?? "خطایی رخ داد" });
        return;
      }
      setKycDone("PENDING");
      setKycSelfie(null);
      setKycVoice(null);
      setKycFront(null);
      setKycBack(null);
      setKycName("");
      setKycCode("");
      setKycDay("");
      setKycMonth("");
      setKycYear("");
      setKycRules(false);
    } catch {
      setKycMsg({ ok: false, text: "خطا در ارتباط با سرور" });
    } finally {
      setKycLoading(false);
    }
  }

  const btFormReady =
    btSelfies.every(Boolean) && !!btVoice && btRules && !btLoading;
  const kycFormReady =
    !!kycSelfie &&
    !!kycVoice &&
    !!kycFront &&
    !!kycBack &&
    kycName.trim().length >= 3 &&
    /^\d{10}$/.test(kycCode) &&
    !!kycDay &&
    !!kycMonth &&
    !!kycYear &&
    kycRules &&
    !kycLoading;

  const tabs: { key: Tab; label: string; icon: typeof BadgeCheck }[] = [
    { key: "bluetick", label: "تیک آبی", icon: BadgeCheck },
    { key: "kyc", label: "احراز هویت کامل", icon: ShieldCheck },
  ];

  return (
    <div className="space-y-4">
      {/* تب ها — زیرخط متحرک مثل بقیه صفحات */}
      <div className="relative flex border-b border-ig-divider" role="tablist">
        {tabs.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-bold transition-colors ${
                active ? "text-foreground" : "text-ig-gray hover:text-foreground"
              }`}
            >
              <t.icon className="w-4 h-4" strokeWidth={2} />
              {t.label}
            </button>
          );
        })}
        <span
          aria-hidden
          className="absolute bottom-0 h-0.5 bg-foreground transition-[inset-inline-start] duration-300 ease-out"
          style={{
            width: `${100 / tabs.length}%`,
            insetInlineStart: `${
              (Math.max(0, tabs.findIndex((t) => t.key === tab)) * 100) /
              tabs.length
            }%`,
          }}
        />
      </div>

      {/* === تب تیک آبی === */}
      {tab === "bluetick" && (
        <div key="bluetick" className="space-y-4 ig-rise">
          {isVerified ? (
            <StatusBanner kind="ok" />
          ) : btDone === "PENDING" || blueTickStatus === "PENDING" ? (
            <StatusBanner kind="pending" />
          ) : (
            <form
              onSubmit={submitBlueTick}
              className="bg-white border border-ig-border rounded-2xl p-5 space-y-4"
            >
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                <BadgeCheck className="w-5 h-5 text-foreground" strokeWidth={1.5} />
                درخواست تیک آبی
              </h2>
              <p className="text-xs text-ig-gray leading-5">
                ۵ عکس سلفی واضح و شبیه به هم از چهره خودتان بفرستید و یک پیام
                صوتی ضبط کنید. پس از تایید مدیر، تیک آبی کنار نام شما نمایش داده
                می شود.
              </p>

              {blueTickStatus === "REJECTED" && (
                <p className="text-xs bg-ig-gray-bg text-ig-red rounded-lg px-4 py-3">
                  درخواست قبلی شما رد شد. لطفا مدارک دقیق تر ارسال کنید.
                </p>
              )}

              {/* ۵ اسلات سلفی */}
              <div>
                <label className="text-xs font-bold text-ig-gray mb-1.5 block">
                  ۵ عکس سلفی از چهره شما
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {btSelfies.map((f, i) => (
                    <ImageSlot
                      key={i}
                      compact
                      file={f}
                      onChange={(file) =>
                        setBtSelfies((prev) => {
                          const next = [...prev];
                          next[i] = file;
                          return next;
                        })
                      }
                    />
                  ))}
                </div>
                <p className="text-xs text-ig-gray mt-1.5 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  {toPersianDigits(btSelfies.filter(Boolean).length)} از ۵
                  عکس انتخاب شده
                </p>
              </div>

              {/* پیام صوتی */}
              <div>
                <label className="text-xs font-bold text-ig-gray mb-1.5 flex items-center gap-1">
                  <Mic className="w-3.5 h-3.5" />
                  پیام صوتی
                </label>
                <VoiceRecorder value={btVoice} onChange={setBtVoice} />
                <p className="text-xs text-ig-gray mt-1.5">
                  نام و نام خانوادگی خود را در پیام صوتی بگویید
                </p>
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={btRules}
                  onChange={(e) => setBtRules(e.target.checked)}
                  className="w-4 h-4 rounded accent-foreground mt-0.5 shrink-0"
                />
                <span className="text-xs text-ig-gray leading-5">
                  تایید می کنم مدارک ارسالی متعلق به خودم است و چهره ها واقعی
                  هستند.
                </span>
              </label>

              {btMsg && (
                <p
                  className={`text-sm rounded-lg px-4 py-3 ${
                    btMsg.ok
                      ? "bg-neutral-100 text-foreground"
                      : "bg-ig-gray-bg text-ig-red"
                  }`}
                >
                  {btMsg.text}
                </p>
              )}

              <Button
                type="submit"
                size="lg"
                fullWidth
                loading={btLoading}
                disabled={!btFormReady}
              >
                {btLoading ? "در حال ارسال..." : "ارسال مدارک"}
              </Button>
            </form>
          )}
        </div>
      )}

      {/* === تب احراز هویت کامل === */}
      {tab === "kyc" && (
        <div key="kyc" className="space-y-4 ig-rise">
          {isIdentityVerified ? (
            <StatusBanner kind="ok" />
          ) : kycDone === "PENDING" || kycStatus === "PENDING" ? (
            <StatusBanner kind="pending" />
          ) : (
            <form
              onSubmit={submitKyc}
              className="bg-white border border-ig-border rounded-2xl p-5 space-y-4"
            >
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                <ShieldCheck
                  className="w-5 h-5 text-foreground"
                  strokeWidth={1.5}
                />
                احراز هویت کامل
              </h2>
              <p className="text-xs text-ig-gray leading-5">
                برای فعال شدن برداشت، مدارک هویتی واقعی خود را ارسال کنید. پس از
                تایید مدیر، احراز هویت شما تکمیل می شود.
              </p>

              {kycStatus === "REJECTED" && (
                <p className="text-xs bg-ig-gray-bg text-ig-red rounded-lg px-4 py-3">
                  درخواست قبلی شما رد شد. لطفا مدارک دقیق تر ارسال کنید.
                </p>
              )}

              {/* مشخصات متنی */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-ig-gray mb-1.5 block">
                    نام و نام خانوادگی واقعی
                  </label>
                  <input
                    type="text"
                    value={kycName}
                    onChange={(e) => setKycName(e.target.value)}
                    className={inputClass}
                    placeholder="مطابق کارت ملی"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-ig-gray mb-1.5 block">
                    کد ملی
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    inputMode="numeric"
                    maxLength={10}
                    value={kycCode}
                    onChange={(e) =>
                      setKycCode(e.target.value.replace(/\D/g, ""))
                    }
                    className={inputClass}
                    placeholder="۱۰ رقم"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-ig-gray mb-1.5 block">
                    تاریخ تولد واقعی (شمسی)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(() => {
                      const nowJy = currentJalaliYear();
                      const minYear = nowJy - 80;
                      const maxYear = nowJy - 18;
                      const yearNum = Number(kycYear) || null;
                      const monthNum = Number(kycMonth) || null;
                      const maxDay = yearNum && monthNum ? jalaliMonthDays(yearNum, monthNum) : 31;
                      const selectCls =
                        "w-full px-3 py-3 rounded-lg border border-ig-border focus:border-neutral-400 outline-none transition-colors bg-white text-sm";
                      return (
                        <>
                          <select
                            value={kycDay}
                            onChange={(e) => setKycDay(e.target.value)}
                            className={selectCls}
                            aria-label="روز تولد"
                          >
                            <option value="">روز</option>
                            {Array.from({ length: maxDay }, (_, i) => i + 1).map((d) => (
                              <option key={d} value={d}>
                                {toPersianDigits(d)}
                              </option>
                            ))}
                          </select>
                          <select
                            value={kycMonth}
                            onChange={(e) => {
                              setKycMonth(e.target.value);
                              // اگر روز انتخابی از تعداد روزهای ماه جدید بیشتر بود، پاک شود
                              const newMonth = Number(e.target.value);
                              if (yearNum && newMonth && Number(kycDay) > jalaliMonthDays(yearNum, newMonth)) {
                                setKycDay("");
                              }
                            }}
                            className={selectCls}
                            aria-label="ماه تولد"
                          >
                            <option value="">ماه</option>
                            {JALALI_MONTHS.map((name, i) => (
                              <option key={i + 1} value={i + 1}>
                                {name}
                              </option>
                            ))}
                          </select>
                          <select
                            value={kycYear}
                            onChange={(e) => {
                              setKycYear(e.target.value);
                              const newYear = Number(e.target.value);
                              if (monthNum && newYear && Number(kycDay) > jalaliMonthDays(newYear, monthNum)) {
                                setKycDay("");
                              }
                            }}
                            className={selectCls}
                            aria-label="سال تولد"
                          >
                            <option value="">سال</option>
                            {Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i).map((y) => (
                              <option key={y} value={y}>
                                {toPersianDigits(y)}
                              </option>
                            ))}
                          </select>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* عکس ها */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="text-xs font-bold text-ig-gray mb-1.5 block">
                    عکس سلفی
                  </label>
                  <ImageSlot file={kycSelfie} onChange={setKycSelfie} />
                </div>
                <div>
                  <label className="text-xs font-bold text-ig-gray mb-1.5 block">
                    روی کارت ملی
                  </label>
                  <ImageSlot file={kycFront} onChange={setKycFront} />
                </div>
                <div>
                  <label className="text-xs font-bold text-ig-gray mb-1.5 block">
                    پشت کارت ملی
                  </label>
                  <ImageSlot file={kycBack} onChange={setKycBack} />
                </div>
              </div>

              {/* پیام صوتی */}
              <div>
                <label className="text-xs font-bold text-ig-gray mb-1.5 flex items-center gap-1">
                  <Mic className="w-3.5 h-3.5" />
                  پیام صوتی
                </label>
                <VoiceRecorder value={kycVoice} onChange={setKycVoice} />
                <p className="text-xs text-ig-gray mt-1.5">
                  نام و نام خانوادگی و کد ملی خود را در پیام صوتی بگویید
                </p>
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={kycRules}
                  onChange={(e) => setKycRules(e.target.checked)}
                  className="w-4 h-4 rounded accent-foreground mt-0.5 shrink-0"
                />
                <span className="text-xs text-ig-gray leading-5">
                  تایید می کنم تمام مدارک و مشخصات ارسالی واقعی و متعلق به خودم
                  است.
                </span>
              </label>

              {kycMsg && (
                <p
                  className={`text-sm rounded-lg px-4 py-3 ${
                    kycMsg.ok
                      ? "bg-neutral-100 text-foreground"
                      : "bg-ig-gray-bg text-ig-red"
                  }`}
                >
                  {kycMsg.text}
                </p>
              )}

              <Button
                type="submit"
                size="lg"
                fullWidth
                loading={kycLoading}
                disabled={!kycFormReady}
              >
                {kycLoading ? "در حال ارسال..." : "ارسال مدارک"}
              </Button>
            </form>
          )}
        </div>
      )}

      {/* نکته امنیتی */}
      <p className="text-xs text-ig-gray text-center leading-5 px-4 flex items-center justify-center gap-1.5">
        <IdCard className="w-3.5 h-3.5 shrink-0" />
        مدارک شما فقط برای بررسی توسط مدیر استفاده و محفوظ نگه داشته می شود
      </p>
    </div>
  );
}

