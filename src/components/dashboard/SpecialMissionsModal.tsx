"use client";

// مودال ماموریت های ویژه — bottom sheet با استایل اینستاگرامی
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Portal from "@/components/ui/Portal";
import {
  X, Star, Check, AlertTriangle, Loader2, Gift, Coins,
  MessageCircle, Mic, Image as ImageIcon, Heart, Users, UserCheck,
} from "lucide-react";
import { toPersianDigits } from "@/lib/format";

type Mission = {
  key: string;
  title: string;
  desc: string;
  current: number;
  target: number;
  unit: string;
  icon: string;
  extra?: { count: number; distinctChats: number };
  details?: {
    hasProfilePhoto: boolean;
    galleryPhotos: number;
    hasBio: boolean;
    hasJob: boolean;
    hasNeighborhood: boolean;
  };
};

type TabData = {
  label: string;
  missions: Mission[];
  reward: number;
  claimed: boolean;
  allDone: boolean;
};

type TabsData = {
  once: TabData;
  daily: TabData;
  monthly: TabData;
};

const ICONS: Record<string, typeof Star> = {
  UserCheck,
  MessageCircle,
  Mic,
  Image: ImageIcon,
  Heart,
  Users,
  Check,
  Star,
};

type TabKey = "once" | "daily" | "monthly";

export default function SpecialMissionsModal({ onClose }: { onClose: () => void }) {
  const [data, setData] = useState<TabsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("daily");
  const [claiming, setClaiming] = useState(false);
  const [claimResult, setClaimResult] = useState<{ ok: boolean; text: string } | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/special/missions");
      if (!res.ok) throw new Error();
      const json = await res.json();
      setData(json.tabs);
    } catch {
      setError("خطا در دریافت اطلاعات");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // بارگذاری اولیه با نادیده گرفتن نتیجه پس از unmount
    let ignore = false;
    (async () => {
      try {
        const res = await fetch("/api/special/missions");
        if (!res.ok) throw new Error();
        const json = await res.json();
        if (!ignore) setData(json.tabs);
      } catch {
        if (!ignore) setError("خطا در دریافت اطلاعات");
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, []);

  async function claimReward(tab: TabKey) {
    setClaiming(true);
    setClaimResult(null);
    try {
      const res = await fetch("/api/special/missions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tab }),
      });
      const json = await res.json();
      if (!res.ok) {
        setClaimResult({ ok: false, text: json.error ?? "خطا در دریافت جایزه" });
        return;
      }
      setClaimResult({ ok: true, text: `${toPersianDigits(json.reward)} سکه به کیف پول شما اضافه شد!` });
      fetchData();
    } catch {
      setClaimResult({ ok: false, text: "خطا در ارتباط با سرور" });
    } finally {
      setClaiming(false);
    }
  }

  const tabKeys: TabKey[] = ["once", "daily", "monthly"];
  const currentTab = data?.[activeTab];

  return (
    <Portal>
      <>
      <div
        className="fixed inset-0 z-50 bg-black/50 ig-fade-in"
        onClick={onClose}
      />

      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-surface rounded-t-3xl flex flex-col"
        style={{ maxHeight: "80vh" }}
      >
        {/* handle bar */}
        <div className="flex justify-center pt-2.5 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-neutral-300" />
        </div>

        {/* هدر */}
        <div className="px-5 pb-3 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-ig-gray-bg flex items-center justify-center">
              <Star className="w-4 h-4 text-white fill-ig-gold" />
            </div>
            <div>
              <h2 className="text-sm font-black text-foreground">ماموریت های ویژه</h2>
              {!loading && currentTab && (
                <p className="text-xs text-ig-gray">
                  {currentTab.allDone ? "آماده دریافت جایزه" : `${toPersianDigits(currentTab.missions.filter((m) => m.current >= m.target).length)} از ${toPersianDigits(currentTab.missions.length)} تکمیل شده`}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-ig-btn2 hover:bg-neutral-200 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-ig-gray" />
          </button>
        </div>

        {/* تب ها */}
        {!loading && data && (
          <div className="px-5 pb-2 shrink-0">
            <div className="flex gap-1 bg-ig-btn2 rounded-xl p-1">
              {tabKeys.map((key) => {
                const tab = data[key];
                const done = tab.allDone && !tab.claimed;
                return (
                  <button
                    key={key}
                    onClick={() => { setActiveTab(key); setClaimResult(null); }}
                    className={`relative flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                      activeTab === key
                        ? "bg-surface text-foreground shadow-sm"
                        : "text-ig-gray"
                    }`}
                  >
                    {tab.label}
                    {done && (
                      <span className="absolute -top-1 -left-1 w-3 h-3 bg-ig-red rounded-full border-2 border-white" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* محتوا */}
        <div className="flex-1 overflow-y-auto px-5 pb-4">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-7 h-7 text-ig-red animate-spin" />
            </div>
          )}

          {error && (
            <div className="text-center py-8 text-ig-red text-sm">{error}</div>
          )}

          {!loading && currentTab && (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-2.5 pt-2"
              >
                {currentTab.missions.map((m, idx) => {
                  const Icon = ICONS[m.icon] ?? Star;
                  const done = m.current >= m.target;
                  const pct = Math.min(100, (m.current / m.target) * 100);

                  return (
                    <motion.div
                      key={m.key}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`rounded-2xl p-3 border transition-all ${
                        done
                          ? "border-ig-border bg-ig-gray-bg"
                          : "border-neutral-200 bg-ig-gray-bg"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                            done
                              ? "bg-ig-gray-bg"
                              : "bg-ig-gray-bg"
                          }`}
                        >
                          <Icon className="w-4 h-4 text-white" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <p className="text-xs font-bold text-foreground truncate">{m.title}</p>
                            {done ? (
                              <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-5 h-5 rounded-full bg-ig-blue flex items-center justify-center shrink-0"
                              >
                                <Check className="w-3 h-3 text-white" strokeWidth={3} />
                              </motion.span>
                            ) : (
                              <span className="text-xs font-bold text-ig-gray shrink-0">
                                {toPersianDigits(m.current)}/{toPersianDigits(m.target)} {m.unit}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-neutral-400 mt-0.5 truncate">{m.desc}</p>

                          <div className="mt-1.5 h-1.5 rounded-full bg-neutral-200 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.5, delay: idx * 0.05 }}
                              className={`h-full rounded-full ${done ? "bg-ig-blue" : "bg-ig-gray-bg"}`}
                            />
                          </div>

                          {m.extra && (
                            <p className="text-xs text-neutral-400 mt-1">
                              {toPersianDigits(m.extra.count)} پیام در {toPersianDigits(m.extra.distinctChats)} چت مختلف
                            </p>
                          )}

                          {m.details && (
                            <div className="mt-1.5 grid grid-cols-2 gap-1">
                              <DetailChip ok={m.details.hasProfilePhoto} label="عکس پروفایل" />
                              <DetailChip ok={m.details.galleryPhotos >= 3} label={`گالری (${toPersianDigits(m.details.galleryPhotos)}/۳)`} />
                              <DetailChip ok={m.details.hasBio} label="بیو" />
                              <DetailChip ok={m.details.hasJob} label="شغل" />
                              <DetailChip ok={m.details.hasNeighborhood} label="محله" />
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}

                {/* دکمه دریافت جایزه */}
                <div className="pt-2">
                  {currentTab.claimed ? (
                    <div className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-ig-btn2 text-neutral-400 text-xs font-bold">
                      <Check className="w-4 h-4" />
                      جایزه این دوره دریافت شده
                    </div>
                  ) : currentTab.allDone ? (
                    <motion.button
                      initial={{ scale: 0.95 }}
                      animate={{ scale: 1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => claimReward(activeTab)}
                      disabled={claiming}
                      className="w-full py-3 rounded-2xl bg-ig-blue text-white text-sm font-black flex items-center justify-center gap-2 hover:bg-ig-blue-hover transition-all disabled:opacity-50 shadow-lg shadow-red-500/20"
                    >
                      {claiming ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Gift className="w-5 h-5" />
                          دریافت {toPersianDigits(currentTab.reward)} سکه جایزه
                        </>
                      )}
                    </motion.button>
                  ) : (
                    <div className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-ig-btn2 text-neutral-400 text-xs font-bold">
                      <Coins className="w-4 h-4" />
                      تکمیل همه ماموریت ها برای دریافت {toPersianDigits(currentTab.reward)} سکه
                    </div>
                  )}

                  <AnimatePresence>
                    {claimResult && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className={`mt-2 rounded-xl px-3 py-2 text-xs font-bold text-center ${
                          claimResult.ok
                            ? "bg-ig-gray-bg text-ig-gray"
                            : "bg-ig-gray-bg text-ig-red"
                        }`}
                      >
                        {claimResult.text}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {/* هشدار پایین */}
        {!loading && !error && (
          <div className="shrink-0 px-5 py-3 bg-ig-gray-bg border-t border-ig-border">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-ig-red shrink-0 mt-0.5" />
              <p className="text-xs text-ig-red font-bold leading-4">
                اگر ۵ روز متوالی ماموریت های ویژه انجام نشوند، حساب ویژه لغو می شود و تمام امکانات ویژه گرفته می شود.
              </p>
            </div>
          </div>
        )}
      </motion.div>
      </>
    </Portal>
  );
}

function DetailChip({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold ${
      ok ? "bg-ig-gray-bg text-ig-gray" : "bg-neutral-200 text-neutral-400"
    }`}>
      <span className={`w-3 h-3 rounded-full flex items-center justify-center shrink-0 ${
        ok ? "bg-ig-blue" : "bg-neutral-400"
      }`}>
        {ok && <Check className="w-2 h-2 text-white" strokeWidth={3} />}
      </span>
      {label}
    </div>
  );
}
