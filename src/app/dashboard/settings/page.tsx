"use client";

// صفحه تنظیمات: نوتیفیکیشن، حریم خصوصی، حساب کاربری
import { useEffect, useState, useTransition } from "react";
import { SkeletonRow } from "@/components/dashboard/Skeleton";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Bell,
  Lock,
  User,
  LogOut,
  ChevronLeft,
  Heart,
  MessageCircle,
  Eye,
  Gift,
  Flame,
  Sparkles,
  ShieldCheck,
  Check,
  HelpCircle,
  FileText,
  Info,
  Mail,
  KeyRound,
  Loader2,
  EyeOff,
  Eye as EyeIcon,
  X,
  Ban,
  Smartphone,
  Trash2,
  AlertTriangle,
} from "lucide-react";

type UserSettingsData = {
  notifLikes: boolean;
  notifMessages: boolean;
  notifSuperLikes: boolean;
  notifProfileViews: boolean;
  notifGifts: boolean;
  notifStreak: boolean;
  privacyShowOnline: boolean;
  privacyShowAge: boolean;
  privacyShowIncome: boolean;
  privacyOnlyVerified: boolean;
};

const defaultSettings: UserSettingsData = {
  notifLikes: true,
  notifMessages: true,
  notifSuperLikes: true,
  notifProfileViews: true,
  notifGifts: true,
  notifStreak: true,
  privacyShowOnline: true,
  privacyShowAge: true,
  privacyShowIncome: false,
  privacyOnlyVerified: false,
};

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
        checked ? "bg-ig-blue" : "bg-ig-border"
      } ${disabled ? "opacity-50" : ""}`}
    >
      <span
        className={`toggle-knob absolute top-0.5 w-5 h-5 rounded-full shadow-sm transition-transform ${
          checked ? "right-0.5" : "right-5"
        }`}
      />
    </button>
  );
}

function SettingRow({
  icon: Icon,
  title,
  desc,
  checked,
  onChange,
  disabled,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="w-9 h-9 rounded-xl bg-ig-btn2 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-neutral-700" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-foreground">{title}</p>
        {desc && <p className="text-xs text-ig-gray mt-0.5">{desc}</p>}
      </div>
      <Toggle checked={checked} onChange={onChange} disabled={disabled} />
    </div>
  );
}

function LinkRow({
  icon: Icon,
  title,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-3 hover:bg-ig-gray-bg transition-colors"
    >
      <div className="w-9 h-9 rounded-xl bg-ig-btn2 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-neutral-700" />
      </div>
      <span className="flex-1 text-sm font-bold text-foreground">{title}</span>
      <ChevronLeft className="w-4 h-4 text-ig-gray" />
    </Link>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<UserSettingsData>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [, startTransition] = useTransition();

  // --- تغییر رمز عبور ---
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // خروج از همه دستگاه ها و حذف حساب
  const [loggingOutAll, setLoggingOutAll] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteReason, setDeleteReason] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function handleChangePassword() {
    setPasswordError("");
    if (!currentPassword) {
      setPasswordError("رمز فعلی را وارد کنید");
      return;
    }
    if (!/^\d{5,7}$/.test(newPassword)) {
      setPasswordError("رمز جدید باید ۵ تا ۷ رقم باشد");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("تکرار رمز جدید مطابقت ندارد");
      return;
    }
    setChangingPassword(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPasswordError(data.error ?? "خطایی رخ داد");
        return;
      }
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        setPasswordSuccess(false);
        setShowPasswordModal(false);
      }, 2000);
    } catch {
      setPasswordError("خطا در ارتباط با سرور");
    } finally {
      setChangingPassword(false);
    }
  }

  useEffect(() => {
    fetch("/api/me/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.settings) setSettings(data.settings);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function updateSetting(key: keyof UserSettingsData, value: boolean) {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    setSaving(true);
    setSaved(false);
    fetch("/api/me/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: value }),
    })
      .then((r) => r.json())
      .then(() => {
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      })
      .catch(() => {
        setSaving(false);
      });
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    startTransition(() => {
      router.push("/");
      router.refresh();
    });
  }

  // خروج از همه دستگاه ها — همه سشن ها از جمله همین دستگاه باطل می شود
  async function logoutAll() {
    if (loggingOutAll) return;
    setLoggingOutAll(true);
    try {
      const res = await fetch("/api/account/logout-all", { method: "POST" });
      if (res.ok) {
        startTransition(() => {
          router.push("/login");
          router.refresh();
        });
      } else {
        setLoggingOutAll(false);
      }
    } catch {
      setLoggingOutAll(false);
    }
  }

  // حذف خودکار حساب با تایید رمز
  async function deleteAccount() {
    if (deleting || !deletePassword) return;
    setDeleting(true);
    setDeleteError("");
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: deletePassword, reason: deleteReason || undefined }),
      });
      const data = await res.json();
      if (res.ok) {
        startTransition(() => {
          router.push("/");
          router.refresh();
        });
      } else {
        setDeleteError(data.error || "خطایی رخ داد");
        setDeleting(false);
      }
    } catch {
      setDeleteError("خطایی رخ داد");
      setDeleting(false);
    }
  }

  return (
    <div className="max-w-[600px] mx-auto px-4 md:px-0 pt-4 md:pt-8 pb-4 space-y-6">
      {/* سربرگ */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-foreground">تنظیمات</h1>
        {saving && (
          <span className="text-xs text-ig-gray">در حال ذخیره...</span>
        )}
        {saved && (
          <span className="text-xs text-ig-gray flex items-center gap-1 ig-fade-in">
            <Check className="w-3 h-3" />
            ذخیره شد
          </span>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-surface border border-ig-border rounded-2xl overflow-hidden">
              <SkeletonRow />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* === نوتیفیکیشن === */}
          <section>
            <h2 className="text-xs font-bold text-ig-gray mb-2 px-4 flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5" />
              نوتیفیکیشن
            </h2>
            <div className="bg-surface border border-ig-border rounded-2xl divide-y divide-ig-border/50 overflow-hidden">
              <SettingRow
                icon={Heart}
                title="لایک ها"
                desc="اعلام هنگام دریافت لایک"
                checked={settings.notifLikes}
                onChange={(v) => updateSetting("notifLikes", v)}
              />
              <SettingRow
                icon={Sparkles}
                title="سوپر لایک"
                desc="اعلام هنگام دریافت سوپر لایک"
                checked={settings.notifSuperLikes}
                onChange={(v) => updateSetting("notifSuperLikes", v)}
              />
              <SettingRow
                icon={MessageCircle}
                title="پیام ها"
                desc="اعلام پیام های جدید"
                checked={settings.notifMessages}
                onChange={(v) => updateSetting("notifMessages", v)}
              />
              <SettingRow
                icon={Eye}
                title="بازدید پروفایل"
                desc="اعلام بازدید کاربران از پروفایل شما"
                checked={settings.notifProfileViews}
                onChange={(v) => updateSetting("notifProfileViews", v)}
              />
              <SettingRow
                icon={Gift}
                title="هدیه و سکه"
                desc="اعلام دریافت هدیه سکه"
                checked={settings.notifGifts}
                onChange={(v) => updateSetting("notifGifts", v)}
              />
              <SettingRow
                icon={Flame}
                title="استریک"
                desc="اعلام پاداش استریک و یادآوری"
                checked={settings.notifStreak}
                onChange={(v) => updateSetting("notifStreak", v)}
              />
            </div>
          </section>

          {/* === حریم خصوصی === */}
          <section>
            <h2 className="text-xs font-bold text-ig-gray mb-2 px-4 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              حریم خصوصی
            </h2>
            <div className="bg-surface border border-ig-border rounded-2xl divide-y divide-ig-border/50 overflow-hidden">
              <SettingRow
                icon={Eye}
                title="نمایش آنلاین بودن"
                desc="دیگران ببینند که آنلاین هستید"
                checked={settings.privacyShowOnline}
                onChange={(v) => updateSetting("privacyShowOnline", v)}
              />
              <SettingRow
                icon={User}
                title="نمایش سن"
                desc="سن شما در پروفایل نمایش داده شود"
                checked={settings.privacyShowAge}
                onChange={(v) => updateSetting("privacyShowAge", v)}
              />
              <SettingRow
                icon={User}
                title="نمایش درآمد"
                desc="درآمد شما در پروفایل نمایش داده شود"
                checked={settings.privacyShowIncome}
                onChange={(v) => updateSetting("privacyShowIncome", v)}
              />
              <SettingRow
                icon={ShieldCheck}
                title="فقط کاربران تایید شده"
                desc="پروفایل شما فقط برای کاربران تایید شده نمایش داده شود"
                checked={settings.privacyOnlyVerified}
                onChange={(v) => updateSetting("privacyOnlyVerified", v)}
              />
            </div>
          </section>

          {/* === حساب کاربری === */}
          <section>
            <h2 className="text-xs font-bold text-ig-gray mb-2 px-4 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              حساب کاربری
            </h2>
            <div className="bg-surface border border-ig-border rounded-2xl divide-y divide-ig-border/50 overflow-hidden">
              <LinkRow
                icon={User}
                title="ویرایش پروفایل"
                href="/dashboard/profile"
              />
              <LinkRow
                icon={ShieldCheck}
                title="احراز هویت"
                href="/dashboard/verify"
              />
              <button
                onClick={() => setShowPasswordModal(true)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-ig-gray-bg transition-colors text-right"
              >
                <div className="w-9 h-9 rounded-xl bg-ig-btn2 flex items-center justify-center shrink-0">
                  <KeyRound className="w-4 h-4 text-neutral-700" />
                </div>
                <span className="flex-1 text-sm font-bold text-foreground">تغییر رمز عبور</span>
                <ChevronLeft className="w-4 h-4 text-ig-gray" />
              </button>
              <LinkRow
                icon={Ban}
                title="بلاک لیست"
                href="/dashboard/blocked"
              />
              <LinkRow
                icon={HelpCircle}
                title="راهنما و سوالات متداول"
                href="/help"
              />
              <LinkRow
                icon={FileText}
                title="قوانین و مقررات"
                href="/terms"
              />
              <LinkRow
                icon={Lock}
                title="حریم خصوصی"
                href="/privacy"
              />
              <LinkRow
                icon={Info}
                title="درباره کندو"
                href="/about"
              />
              <LinkRow
                icon={Mail}
                title="تماس با ما"
                href="/contact"
              />
            </div>
          </section>

          {/* === خروج === */}
          <section className="space-y-2">
            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-surface border border-ig-border text-ig-red font-bold text-sm hover:bg-ig-red/5 transition-colors active:scale-[0.98]"
            >
              <LogOut className="w-4 h-4" />
              خروج از حساب
            </button>
            <button
              onClick={logoutAll}
              disabled={loggingOutAll}
              className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-surface border border-ig-border text-foreground font-bold text-sm hover:bg-ig-gray-bg transition-colors active:scale-[0.98] disabled:opacity-50"
            >
              {loggingOutAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Smartphone className="w-4 h-4" />}
              خروج از همه دستگاه ها
            </button>
          </section>

          {/* === حذف حساب === */}
          <section>
            <h2 className="text-xs font-bold text-ig-gray mb-2 px-4">منطقه خطر</h2>
            <button
              onClick={() => { setDeletePassword(""); setDeleteReason(""); setDeleteError(""); setShowDeleteModal(true); }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-surface border border-ig-red/40 text-ig-red font-bold text-sm hover:bg-ig-red/5 transition-colors active:scale-[0.98]"
            >
              <Trash2 className="w-4 h-4" />
              حذف حساب کاربری
            </button>
          </section>

          <p className="text-center text-xs text-ig-gray pt-2">
            کندو نسخه ۰.۱.۰
          </p>
        </>
      )}

      {/* مودال تغییر رمز عبور */}
      {showPasswordModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => !changingPassword && setShowPasswordModal(false)}
        >
          <div
            className="w-full max-w-sm bg-surface rounded-2xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <KeyRound className="w-4 h-4" />
                تغییر رمز عبور
              </h3>
              <button
                onClick={() => !changingPassword && setShowPasswordModal(false)}
                className="text-ig-gray hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {passwordSuccess ? (
              <div className="flex flex-col items-center gap-2 py-6">
                <div className="w-12 h-12 rounded-full bg-ig-gray-bg flex items-center justify-center">
                  <Check className="w-6 h-6 text-ig-gray" />
                </div>
                <p className="text-sm font-bold text-ig-gray">رمز عبور با موفقیت تغییر کرد</p>
              </div>
            ) : (
              <>
                {/* رمز فعلی */}
                <div>
                  <label className="block text-xs font-bold text-ig-gray mb-1.5">
                    رمز فعلی
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      dir="ltr"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={7}
                      style={{ WebkitTextSecurity: showCurrent ? "none" : "disc" } as React.CSSProperties}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value.replace(/\D/g, ""))}
                      className="w-full px-3 py-2.5 rounded-lg border border-ig-border bg-ig-gray-bg focus:bg-surface focus:border-ig-gray outline-none transition-colors text-sm text-left pl-10"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent(!showCurrent)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 text-ig-gray hover:text-foreground"
                    >
                      {showCurrent ? <EyeOff className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* رمز جدید */}
                <div>
                  <label className="block text-xs font-bold text-ig-gray mb-1.5">
                    رمز جدید (۵ تا ۷ رقم)
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      dir="ltr"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={7}
                      style={{ WebkitTextSecurity: showNew ? "none" : "disc" } as React.CSSProperties}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value.replace(/\D/g, ""))}
                      className="w-full px-3 py-2.5 rounded-lg border border-ig-border bg-ig-gray-bg focus:bg-surface focus:border-ig-gray outline-none transition-colors text-sm text-left pl-10"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 text-ig-gray hover:text-foreground"
                    >
                      {showNew ? <EyeOff className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* تکرار رمز جدید */}
                <div>
                  <label className="block text-xs font-bold text-ig-gray mb-1.5">
                    تکرار رمز جدید
                  </label>
                  <input
                    type="tel"
                    dir="ltr"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={7}
                    style={{ WebkitTextSecurity: showNew ? "none" : "disc" } as React.CSSProperties}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value.replace(/\D/g, ""))}
                    className="w-full px-3 py-2.5 rounded-lg border border-ig-border bg-ig-gray-bg focus:bg-surface focus:border-ig-gray outline-none transition-colors text-sm text-left"
                    placeholder="••••••••"
                  />
                </div>

                {passwordError && (
                  <p className="text-xs text-ig-red">{passwordError}</p>
                )}

                <button
                  onClick={handleChangePassword}
                  disabled={changingPassword}
                  className="w-full py-2.5 rounded-lg bg-ig-blue text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {changingPassword ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      در حال تغییر...
                    </>
                  ) : (
                    "تغییر رمز"
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* مودال حذف حساب */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => !deleting && setShowDeleteModal(false)}
        >
          <div
            className="w-full max-w-sm bg-surface rounded-2xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 text-ig-red">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-base font-bold">حذف حساب کاربری</h3>
            </div>
            <div className="text-xs text-ig-gray leading-5 space-y-1.5">
              <p>با حذف حساب:</p>
              <ul className="list-disc pr-4 space-y-0.5">
                <li>پروفایل و عکس ها از دید بقیه پنهان می شود</li>
                <li>نام تو در گفتگوها «کاربر حذف شده» نمایش داده می شود</li>
                <li>از همه دستگاه ها خارج می شوی</li>
              </ul>
              <p className="pt-1">
                اگر تا ۳۰ روز پشیمان شدی با پشتیبانی تماس بگیر تا حسابت بازیابی شود.
              </p>
            </div>
            <div>
              <label className="block text-xs font-bold text-ig-gray mb-1.5">
                دلیل حذف (اختیاری)
              </label>
              <input
                type="text"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                maxLength={300}
                className="w-full px-3 py-2.5 rounded-lg border border-ig-border bg-ig-gray-bg focus:bg-surface focus:border-ig-gray outline-none transition-colors text-sm"
                placeholder="چرا می خوای بری؟"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-ig-gray mb-1.5">
                برای تایید، رمز عبورت را وارد کن
              </label>
              <input
                type="tel"
                dir="ltr"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={7}
                style={{ WebkitTextSecurity: "disc" } as React.CSSProperties}
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value.replace(/\D/g, ""))}
                className="w-full px-3 py-2.5 rounded-lg border border-ig-border bg-ig-gray-bg focus:bg-surface focus:border-ig-gray outline-none transition-colors text-sm text-left"
                placeholder="••••••••"
              />
            </div>
            {deleteError && <p className="text-xs text-ig-red">{deleteError}</p>}
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-lg border border-ig-border text-sm font-bold disabled:opacity-50"
              >
                انصراف
              </button>
              <button
                onClick={deleteAccount}
                disabled={deleting || !deletePassword}
                className="flex-1 py-2.5 rounded-lg bg-ig-red text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                حذف حساب
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
