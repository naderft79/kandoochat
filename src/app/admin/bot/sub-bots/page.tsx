"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Boxes, Play, Save, Loader2, RefreshCw, Heart, Eye, Gift, UserCheck, MessageCircle, Eye as EyeIcon } from "lucide-react";
import { toPersianDigits } from "@/lib/format";
import { useToast } from "@/components/ToastProvider";

type SubBotSettings = {
  like: { enabled: boolean; perRun: number; intervalMinutes: number; superLikeChance: number; cooldownHours: number };
  view: { enabled: boolean; perRun: number; intervalMinutes: number; cooldownHours: number };
  story: { enabled: boolean; perRun: number; intervalMinutes: number };
  gift: { enabled: boolean; perRun: number; intervalMinutes: number; cooldownHours: number; maxCoins: number };
  match: { enabled: boolean; perRun: number; intervalMinutes: number };
  autoReply: { enabled: boolean; delaySeconds: number; maxPerUser: number };
};

const inputClass = "w-full px-3 py-2 rounded-lg bg-[#0d0d0d] border border-[rgba(212,175,55,0.15)] text-[#e8e8e8] text-sm focus:outline-none focus:border-[rgba(212,175,55,0.4)]";
const labelClass = "text-[10px] text-[#888] mb-1 block";

const BOT_CARDS = [
  { key: "like", label: "ربات لایک", icon: Heart, color: "#f472b6", desc: "ارسال لایک و سوپر لایک از فیک به واقعی" },
  { key: "view", label: "ربات بازدید پروفایل", icon: Eye, color: "#60a5fa", desc: "بازدید پروفایل کاربران توسط فیک" },
  { key: "story", label: "ربات بازدید استوری", icon: EyeIcon, color: "#a78bfa", desc: "بازدید استوری کاربران توسط فیک" },
  { key: "gift", label: "ربات هدیه", icon: Gift, color: "#fbbf24", desc: "ارسال هدیه از فیک به واقعی" },
  { key: "match", label: "ربات مچ", icon: UserCheck, color: "#4ade80", desc: "ایجاد لایک متقابل و مچ" },
  { key: "autoReply", label: "ربات پاسخ خودکار", icon: MessageCircle, color: "#fb923c", desc: "پاسخ خودکار به کاربرانی که جواب داده‌اند" },
] as const;

export default function SubBotsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<SubBotSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/bot/sub-bots");
      const data = await res.json();
      if (res.ok) setSettings(data);
    } catch { /* */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  async function saveSettings() {
    if (!settings) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/bot/sub-bots", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) toast("تنظیمات ذخیره شد", "success");
      else { const d = await res.json(); toast(d.error ?? "خطا", "error"); }
    } catch { toast("خطا در ارتباط", "error"); } finally { setSaving(false); }
  }

  async function runBot(botType: string) {
    setRunning(botType);
    try {
      const res = await fetch("/api/admin/bot/sub-bots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botType }),
      });
      const data = await res.json();
      if (res.ok) toast(`${toPersianDigits(data.sent)} ارسال، ${toPersianDigits(data.skipped)} رد شد`, "success");
      else toast(data.error ?? "خطا", "error");
    } catch { toast("خطا در ارتباط", "error"); } finally { setRunning(null); }
  }

  function updateBot<K extends keyof SubBotSettings>(botKey: K, field: string, value: string | number | boolean) {
    setSettings((prev) => prev ? { ...prev, [botKey]: { ...prev[botKey], [field]: value } } : prev);
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
      {/* هدر */}
      <div className="lux-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-black text-[#e8e8e8] flex items-center gap-2">
              <Boxes className="w-5 h-5 text-[#d4af37]" />
              ربات های جانبی
            </h1>
            <p className="text-[#888] mt-1 text-xs">لایک، بازدید، استوری، هدیه، مچ و پاسخ خودکار</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => fetchSettings()} className="px-3 py-2 rounded-xl lux-card text-xs font-bold text-[#888] hover:text-[#d4af37] flex items-center gap-1.5 transition-all">
              <RefreshCw className="w-4 h-4" />
            </button>
            <button onClick={saveSettings} disabled={saving} className="px-4 py-2 rounded-xl lux-btn-gold text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              ذخیره
            </button>
          </div>
        </div>
      </div>

      {/* کارت ربات‌ها */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {BOT_CARDS.map((bot, index) => {
          const botKey = bot.key as keyof SubBotSettings;
          const botSettings = settings[botKey];
          const Icon = bot.icon;
          return (
            <motion.div
              key={bot.key}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="lux-card p-5 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="w-5 h-5" style={{ color: bot.color }} />
                  <div>
                    <h2 className="text-sm font-black text-[#e8e8e8]">{bot.label}</h2>
                    <p className="text-[10px] text-[#888]">{bot.desc}</p>
                  </div>
                </div>
                <button
                  onClick={() => updateBot(botKey, "enabled", !botSettings.enabled)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${botSettings.enabled ? "bg-[#d4af37]" : "bg-[#333]"}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${botSettings.enabled ? "left-0.5" : "right-0.5"}`} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {Object.entries(botSettings).filter(([k]) => k !== "enabled").map(([field, val]) => (
                  <div key={field}>
                    <label className={labelClass}>{fieldLabel(field)}</label>
                    <input
                      type="number"
                      value={val as number}
                      onChange={(e) => updateBot(botKey, field, parseInt(e.target.value) || 0)}
                      className={inputClass}
                    />
                  </div>
                ))}
              </div>

              <button
                onClick={() => runBot(bot.key)}
                disabled={running === bot.key}
                className="w-full px-3 py-2 rounded-xl lux-card text-xs font-bold text-[#d4af37] hover:bg-[rgba(212,175,55,0.1)] flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
              >
                {running === bot.key ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                اجرای دستی
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function fieldLabel(field: string): string {
  const labels: Record<string, string> = {
    perRun: "تعداد در هر اجرا",
    intervalMinutes: "فاصله اجرا (دقیقه)",
    cooldownHours: "فاصله به یک کاربر (ساعت)",
    superLikeChance: "احتمال سوپر لایک (٪)",
    maxCoins: "حداکثر سکه هدیه",
    delaySeconds: "تاخیر پاسخ (ثانیه)",
    maxPerUser: "حداکثر پاسخ به یک کاربر",
  };
  return labels[field] ?? field;
}
