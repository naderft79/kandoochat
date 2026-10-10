"use client";

// پنل مدیریت ربات تشویقی — تنظیمات، قالب ها، آمار و اجرای دستی
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Play, Save, Loader2, RefreshCw, MessageSquare, Users, Settings as SettingsIcon, ChevronDown, ChevronRight, AlertCircle, BarChart3, ScrollText, Ban, Boxes, FileText, UserCircle } from "lucide-react";
import { toPersianDigits } from "@/lib/format";
import { useToast } from "@/components/ToastProvider";
import SubBotsPage from "./sub-bots/page";
import StatsPage from "./stats/page";
import LogsPage from "./logs/page";
import BlacklistPage from "./blacklist/page";
import DynamicTemplatesPage from "./dynamic-templates/page";
import FakeUsersPage from "./fake-users/page";

type BotStats = {
  fakeUsers: number;
  totalSent: number;
  sentToday: number;
  sent7Days: number;
  sent30Days: number;
  totalAnswered: number;
  responseRate: number;
  dynamicTemplates: number;
  blacklistCount: number;
  whitelistCount: number;
  likeBotLogs: number;
  viewBotLogs: number;
  giftBotLogs: number;
  matchBotLogs: number;
  storyBotLogs: number;
  autoReplyLogs: number;
  lastSentMapSize: number;
};
type BotSettings = {
  botEnabled: boolean;
  botIntervalMinutes: number;
  botMessagesPerRun: number;
  botActiveHoursStart: number;
  botActiveHoursEnd: number;
  botCooldownHours: number;
  botTargetNewUsers: boolean;
  botTargetOldUsers: boolean;
  botTargetInactive: boolean;
  botTargetNoPhoto: boolean;
  botTargetNoBio: boolean;
  botTargetNoSubscription: boolean;
  botTargetWithSubscription: boolean;
  botTargetGender: string;
  botTargetMinAge: number;
  botTargetMaxAge: number;
  botTargetCity: string;
  botTargetMinConversations: number;
  botTargetMaxConversations: number;
  botSenderGender: string;
  botSenderMinAge: number;
  botSenderMaxAge: number;
  botTemplateCategory: string;
  // بهبود ربات پیام
  botMaxPerHour: number;
  botActiveWeekdays: string;
  botFollowupEnabled: boolean;
  botFollowupHours: number;
  botFollowupMax: number;
  botSkipAnswered: boolean;
  botDryRun: boolean;
  botUseDynamicTemplates: boolean;
  // هدف‌گیری پیشرفته
  botTargetOnlineOnly: boolean;
  botTargetRecentlyOnlineHours: number;
  botTargetMinPhotos: number;
  botTargetMaxPhotos: number;
  botTargetVerifiedOnly: boolean;
  botTargetMinHeight: number;
  botTargetMaxHeight: number;
  botTargetIncomeMin: number;
  botTargetHasJob: boolean;
  botTargetReferralOnly: boolean;
  botUseWhitelist: boolean;
  // ارسال‌کننده فیک پیشرفته
  botSenderMatchCity: boolean;
  botSenderVerifiedOnly: boolean;
  botSenderHasPhoto: boolean;
  botSenderPersonality: string;
};

type TemplateGroup = {
  label: string;
  count: number;
  templates: { id: string; text: string; senderGender: string; targetGender: string }[];
};

const CATEGORIES = [
  { value: "RANDOM", label: "تصادفی" },
  { value: "CHAT_START", label: "شروع گفتگو" },
  { value: "FLIRTY", label: "شیطنت آمیز" },
  { value: "CASUAL", label: "راحت و دوستانه" },
  { value: "COMPLIMENT", label: "تعریف و تمجید" },
  { value: "CURIOSITY", label: "کنجکاوی" },
  { value: "PLAYFUL", label: "شوخ طبعانه" },
  { value: "WARM", label: "گرم و صمیمی" },
];

const TABS = [
  { key: "settings" as const, label: "تنظیمات", icon: SettingsIcon },
  { key: "templates" as const, label: "قالب پیام ها", icon: MessageSquare },
  { key: "dynamic-templates" as const, label: "قالب های داینامیک", icon: FileText },
  { key: "sub-bots" as const, label: "ربات های جانبی", icon: Boxes },
  { key: "fake-users" as const, label: "کاربران فیک", icon: UserCircle },
  { key: "stats" as const, label: "آمار", icon: BarChart3 },
  { key: "logs" as const, label: "لاگ", icon: ScrollText },
  { key: "blacklist" as const, label: "لیست سیاه", icon: Ban },
];

const TOGGLE_ITEMS = [
  { key: "botTargetNewUsers" as const, label: "کاربران جدید (کمتر از ۷ روز)" },
  { key: "botTargetOldUsers" as const, label: "کاربران قدیمی (بیشتر از ۷ روز)" },
  { key: "botTargetInactive" as const, label: "کاربران غیرفعال (۳ روز آنلاین نبودن)" },
  { key: "botTargetNoPhoto" as const, label: "کاربران بدون عکس پروفایل" },
  { key: "botTargetNoBio" as const, label: "کاربران بدون بیوگرافی" },
  { key: "botTargetNoSubscription" as const, label: "کاربران بدون اشتراک" },
  { key: "botTargetWithSubscription" as const, label: "کاربران با اشتراک فعال" },
  { key: "botTargetOnlineOnly" as const, label: "فقط کاربران آنلاین" },
  { key: "botTargetVerifiedOnly" as const, label: "فقط کاربران تایید شده" },
  { key: "botTargetHasJob" as const, label: "فقط کاربران با شغل" },
  { key: "botTargetReferralOnly" as const, label: "فقط کاربران رفرالی" },
];

const ADVANCED_TOGGLE_ITEMS = [
  { key: "botFollowupEnabled" as const, label: "زنجیره پیام (Follow-up)" },
  { key: "botSkipAnswered" as const, label: "رد کردن کاربرانی که جواب داده اند" },
  { key: "botDryRun" as const, label: "حالت شبیه ساز (بدون ارسال واقعی)" },
  { key: "botUseDynamicTemplates" as const, label: "استفاده از قالب های داینامیک" },
  { key: "botSenderMatchCity" as const, label: "تطبیق شهر ارسال کننده با هدف" },
  { key: "botSenderVerifiedOnly" as const, label: "فقط فیک های تایید شده" },
  { key: "botSenderHasPhoto" as const, label: "فقط فیک های عکس دار" },
];

const inputClass = "w-full px-3 py-2 rounded-lg bg-[#0d0d0d] border border-[rgba(212,175,55,0.15)] text-[#e8e8e8] text-sm focus:outline-none focus:border-[rgba(212,175,55,0.4)]";
const labelClass = "text-[10px] text-[#888] mb-1 block";

export default function AdminBotPage() {
  const { toast } = useToast();
  const [stats, setStats] = useState<BotStats | null>(null);
  const [settings, setSettings] = useState<BotSettings | null>(null);
  const [templates, setTemplates] = useState<Record<string, TemplateGroup>>({});
  const [totalTemplates, setTotalTemplates] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [tab, setTab] = useState<"settings" | "templates" | "dynamic-templates" | "sub-bots" | "fake-users" | "stats" | "logs" | "blacklist">("settings");

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch("/api/admin/bot");
      const data = await res.json();
      if (res.ok) {
        setStats(data.stats);
        setSettings(data.settings);
        setTemplates(data.templates);
        setTotalTemplates(data.totalTemplates);
      }
    } catch {
      // خطای شبکه
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function saveSettings() {
    if (!settings) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/bot", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        toast("تنظیمات ذخیره شد", "success");
      } else {
        const data = await res.json();
        toast(data.error ?? "خطا", "error");
      }
    } catch {
      toast("خطا در ارتباط", "error");
    } finally {
      setSaving(false);
    }
  }

  async function runManual() {
    setRunning(true);
    try {
      const res = await fetch("/api/admin/bot", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        toast(`${toPersianDigits(data.sent)} پیام ارسال شد، ${toPersianDigits(data.skipped)} رد شد`, "success");
        fetchData();
      } else {
        toast(data.error ?? "خطا", "error");
      }
    } catch {
      toast("خطا در ارتباط", "error");
    } finally {
      setRunning(false);
    }
  }

  function updateSetting<K extends keyof BotSettings>(key: K, value: BotSettings[K]) {
    setSettings((prev) => prev ? { ...prev, [key]: value } : prev);
  }

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-[#d4af37] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* هدر + آمار — مثل تایید عکس */}
      <div className="lux-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-black text-[#e8e8e8] flex items-center gap-2">
              <Bot className="w-5 h-5 text-[#d4af37]" />
              ربات تشویقی
            </h1>
            <p className="text-[#888] mt-1 text-xs">ارسال خودکار پیام از کاربران فیک به کاربران واقعی</p>
          </div>
          {stats && (
            <div className="hidden sm:flex gap-2">
              <div className="lux-card px-3 py-2 text-center min-w-[80px]">
                <p className="text-[10px] text-[#888]">کاربر فیک</p>
                <p className="text-sm font-black text-[#d4af37]">{toPersianDigits(stats.fakeUsers)}</p>
              </div>
              <div className="lux-card px-3 py-2 text-center min-w-[80px]">
                <p className="text-[10px] text-[#888]">پیام امروز</p>
                <p className="text-sm font-black text-[#4ade80]">{toPersianDigits(stats.sentToday)}</p>
              </div>
              <div className="lux-card px-3 py-2 text-center min-w-[80px]">
                <p className="text-[10px] text-[#888]">کل پیام</p>
                <p className="text-sm font-black text-[#e8e8e8]">{toPersianDigits(stats.totalSent)}</p>
              </div>
              <div className="lux-card px-3 py-2 text-center min-w-[80px]">
                <p className="text-[10px] text-[#888]">نرخ پاسخ</p>
                <p className="text-sm font-black text-[#d4af37]">{toPersianDigits(stats.responseRate)}٪</p>
              </div>
              <div className="lux-card px-3 py-2 text-center min-w-[80px]">
                <p className="text-[10px] text-[#888]">قالب داینامیک</p>
                <p className="text-sm font-black text-[#e8e8e8]">{toPersianDigits(stats.dynamicTemplates)}</p>
              </div>
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={runManual}
              disabled={running}
              className="px-3 py-2 rounded-xl lux-btn-gold text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              اجرای دستی
            </button>
            <button
              onClick={() => fetchData()}
              className="px-3 py-2 rounded-xl lux-card text-xs font-bold text-[#888] hover:text-[#d4af37] flex items-center gap-1.5 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
        {stats && (
          <div className="flex sm:hidden gap-2 mt-3">
            <div className="flex-1 lux-card px-2 py-1.5 text-center">
              <p className="text-[9px] text-[#888]">فیک</p>
              <p className="text-xs font-black text-[#d4af37]">{toPersianDigits(stats.fakeUsers)}</p>
            </div>
            <div className="flex-1 lux-card px-2 py-1.5 text-center">
              <p className="text-[9px] text-[#888]">امروز</p>
              <p className="text-xs font-black text-[#4ade80]">{toPersianDigits(stats.sentToday)}</p>
            </div>
            <div className="flex-1 lux-card px-2 py-1.5 text-center">
              <p className="text-[9px] text-[#888]">کل</p>
              <p className="text-xs font-black text-[#e8e8e8]">{toPersianDigits(stats.totalSent)}</p>
            </div>
            <div className="flex-1 lux-card px-2 py-1.5 text-center">
              <p className="text-[9px] text-[#888]">پاسخ</p>
              <p className="text-xs font-black text-[#d4af37]">{toPersianDigits(stats.responseRate)}٪</p>
            </div>
          </div>
        )}
      </div>

      {/* تب ها — مثل فیلتر تایید عکس */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {TABS.map((t) => {
          const active = tab === t.key;
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                active ? "lux-btn-gold border-transparent" : "lux-card text-[#888] hover:text-[#d4af37]"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* محتوای تب تنظیمات */}
      {tab === "settings" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* ستون اول: تنظیمات اصلی + شرایط هدف */}
          <div className="space-y-4">
            <div className="lux-card p-5 space-y-4">
              <h2 className="text-sm font-black text-[#d4af37] sticky top-0 bg-[#12101c] py-2 z-10 border-b border-[rgba(212,175,55,0.1)] flex items-center gap-2">
                <SettingsIcon className="w-4 h-4" />
                تنظیمات اصلی
              </h2>

              {/* فعال/غیرفعال */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#e8e8e8]">فعال سازی ربات</span>
                <button
                  onClick={() => updateSetting("botEnabled", !settings.botEnabled)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${settings.botEnabled ? "bg-[#d4af37]" : "bg-[#333]"}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${settings.botEnabled ? "left-0.5" : "right-0.5"}`} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>فاصله اجرا (دقیقه)</label>
                  <input type="number" value={settings.botIntervalMinutes} onChange={(e) => updateSetting("botIntervalMinutes", parseInt(e.target.value) || 30)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>پیام در هر اجرا</label>
                  <input type="number" value={settings.botMessagesPerRun} onChange={(e) => updateSetting("botMessagesPerRun", parseInt(e.target.value) || 5)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>ساعت شروع فعالیت</label>
                  <input type="number" min={0} max={23} value={settings.botActiveHoursStart} onChange={(e) => updateSetting("botActiveHoursStart", parseInt(e.target.value) || 8)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>ساعت پایان فعالیت</label>
                  <input type="number" min={0} max={23} value={settings.botActiveHoursEnd} onChange={(e) => updateSetting("botActiveHoursEnd", parseInt(e.target.value) || 23)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>فاصله بین پیام به یک کاربر (ساعت)</label>
                  <input type="number" value={settings.botCooldownHours} onChange={(e) => updateSetting("botCooldownHours", parseInt(e.target.value) || 24)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>حداکثر پیام در ساعت</label>
                  <input type="number" value={settings.botMaxPerHour} onChange={(e) => updateSetting("botMaxPerHour", parseInt(e.target.value) || 20)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>دسته قالب پیام</label>
                  <select value={settings.botTemplateCategory} onChange={(e) => updateSetting("botTemplateCategory", e.target.value)} className={inputClass}>
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>روزهای فعال هفته</label>
                  <input type="text" value={settings.botActiveWeekdays} onChange={(e) => updateSetting("botActiveWeekdays", e.target.value)} placeholder="everyday یا sat,sun,mon" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>فاصله پیام follow-up (ساعت)</label>
                  <input type="number" value={settings.botFollowupHours} onChange={(e) => updateSetting("botFollowupHours", parseInt(e.target.value) || 4)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>حداکثر follow-up</label>
                  <input type="number" value={settings.botFollowupMax} onChange={(e) => updateSetting("botFollowupMax", parseInt(e.target.value) || 2)} className={inputClass} />
                </div>
              </div>

              {/* toggle های پیشرفته */}
              <div className="space-y-2 pt-2 border-t border-[rgba(212,175,55,0.1)]">
                {ADVANCED_TOGGLE_ITEMS.map((item) => (
                  <div key={item.key} className="flex items-center justify-between">
                    <span className="text-xs text-[#e8e8e8]">{item.label}</span>
                    <button
                      onClick={() => updateSetting(item.key, !settings[item.key])}
                      className={`relative w-10 h-5 rounded-full transition-colors ${settings[item.key] ? "bg-[#d4af37]" : "bg-[#333]"}`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${settings[item.key] ? "left-0.5" : "right-0.5"}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* شرایط ارسال کننده */}
            <div className="lux-card p-5 space-y-4">
              <h2 className="text-sm font-black text-[#d4af37] flex items-center gap-2">
                <Bot className="w-4 h-4" />
                شرایط ارسال کننده (فیک)
              </h2>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelClass}>جنسیت ارسال کننده</label>
                  <select value={settings.botSenderGender} onChange={(e) => updateSetting("botSenderGender", e.target.value)} className={inputClass}>
                    <option value="ANY">خودکار</option>
                    <option value="MALE">مرد</option>
                    <option value="FEMALE">زن</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>حداقل سن</label>
                  <input type="number" value={settings.botSenderMinAge} onChange={(e) => updateSetting("botSenderMinAge", parseInt(e.target.value) || 18)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>حداکثر سن</label>
                  <input type="number" value={settings.botSenderMaxAge} onChange={(e) => updateSetting("botSenderMaxAge", parseInt(e.target.value) || 99)} className={inputClass} />
                </div>
              </div>
            </div>
          </div>

          {/* ستون دوم: شرایط هدف */}
          <div className="space-y-4">
            <div className="lux-card p-5 space-y-4">
              <h2 className="text-sm font-black text-[#d4af37] sticky top-0 bg-[#12101c] py-2 z-10 border-b border-[rgba(212,175,55,0.1)] flex items-center gap-2">
                <Users className="w-4 h-4" />
                شرایط کاربران هدف
              </h2>

              <div className="space-y-2">
                {TOGGLE_ITEMS.map((item) => (
                  <div key={item.key} className="flex items-center justify-between">
                    <span className="text-xs text-[#e8e8e8]">{item.label}</span>
                    <button
                      onClick={() => updateSetting(item.key, !settings[item.key])}
                      className={`relative w-10 h-5 rounded-full transition-colors ${settings[item.key] ? "bg-[#d4af37]" : "bg-[#333]"}`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${settings[item.key] ? "left-0.5" : "right-0.5"}`} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[rgba(212,175,55,0.1)]">
                <div>
                  <label className={labelClass}>حداقل تعداد عکس</label>
                  <input type="number" value={settings.botTargetMinPhotos} onChange={(e) => updateSetting("botTargetMinPhotos", parseInt(e.target.value) || 0)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>حداکثر تعداد عکس (۰ = نامحدود)</label>
                  <input type="number" value={settings.botTargetMaxPhotos} onChange={(e) => updateSetting("botTargetMaxPhotos", parseInt(e.target.value) || 0)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>حداقل قد (cm)</label>
                  <input type="number" value={settings.botTargetMinHeight} onChange={(e) => updateSetting("botTargetMinHeight", parseInt(e.target.value) || 0)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>حداکثر قد (۰ = نامحدود)</label>
                  <input type="number" value={settings.botTargetMaxHeight} onChange={(e) => updateSetting("botTargetMaxHeight", parseInt(e.target.value) || 0)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>حداقل درآمد (تومان)</label>
                  <input type="number" value={settings.botTargetIncomeMin} onChange={(e) => updateSetting("botTargetIncomeMin", parseInt(e.target.value) || 0)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>آنلاین در X ساعت گذشته (۰ = غیرفعال)</label>
                  <input type="number" value={settings.botTargetRecentlyOnlineHours} onChange={(e) => updateSetting("botTargetRecentlyOnlineHours", parseInt(e.target.value) || 0)} className={inputClass} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>جنسیت هدف</label>
                  <select value={settings.botTargetGender} onChange={(e) => updateSetting("botTargetGender", e.target.value)} className={inputClass}>
                    <option value="ALL">همه</option>
                    <option value="MALE">مرد</option>
                    <option value="FEMALE">زن</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>شهر خاص (خالی = همه)</label>
                  <input type="text" value={settings.botTargetCity} onChange={(e) => updateSetting("botTargetCity", e.target.value)} placeholder="مثلا تهران" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>حداقل سن</label>
                  <input type="number" value={settings.botTargetMinAge} onChange={(e) => updateSetting("botTargetMinAge", parseInt(e.target.value) || 18)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>حداکثر سن</label>
                  <input type="number" value={settings.botTargetMaxAge} onChange={(e) => updateSetting("botTargetMaxAge", parseInt(e.target.value) || 99)} className={inputClass} />
                </div>
              </div>
            </div>

            {/* دکمه ذخیره */}
            <div className="flex justify-end">
              <button
                onClick={saveSettings}
                disabled={saving}
                className="px-6 py-2.5 rounded-xl lux-btn-gold text-sm font-bold flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                ذخیره تنظیمات
              </button>
            </div>
          </div>
        </div>
      )}

      {/* محتوای تب قالب ها */}
      {tab === "templates" && (
        <div className="space-y-3">
          {Object.keys(templates).length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-[#666]">
              <AlertCircle className="w-12 h-12 mb-2 text-[rgba(212,175,55,0.3)]" />
              <p className="text-sm font-bold">قالبی برای نمایش وجود ندارد</p>
            </div>
          )}
          <AnimatePresence>
            {Object.entries(templates).map(([key, group], index) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.03 }}
                className="lux-card overflow-hidden"
              >
                <button
                  onClick={() => setExpandedCategory(expandedCategory === key ? null : key)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-[rgba(212,175,55,0.05)] transition-colors"
                >
                  <span className="text-sm font-bold text-[#e8e8e8]">{group.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[#888]">{toPersianDigits(group.count)} قالب</span>
                    {expandedCategory === key ? <ChevronDown className="w-4 h-4 text-[#888]" /> : <ChevronRight className="w-4 h-4 text-[#888]" />}
                  </div>
                </button>
                <AnimatePresence>
                  {expandedCategory === key && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      className="overflow-hidden border-t border-[rgba(212,175,55,0.1)]"
                    >
                      <div className="max-h-80 overflow-y-auto">
                        {group.templates.map((t) => (
                          <div key={t.id} className="px-4 py-2.5 border-b border-[rgba(212,175,55,0.05)] last:border-0">
                            <p className="text-xs text-[#e8e8e8] leading-5">{t.text}</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
      {/* محتوای تب قالب های داینامیک */}
      {tab === "dynamic-templates" && <DynamicTemplatesPage />}

      {/* محتوای تب ربات های جانبی */}
      {tab === "sub-bots" && <SubBotsPage />}

      {/* محتوای تب کاربران فیک */}
      {tab === "fake-users" && <FakeUsersPage />}

      {/* محتوای تب آمار */}
      {tab === "stats" && <StatsPage />}

      {/* محتوای تب لاگ */}
      {tab === "logs" && <LogsPage />}

      {/* محتوای تب لیست سیاه */}
      {tab === "blacklist" && <BlacklistPage />}
    </div>
  );
}
