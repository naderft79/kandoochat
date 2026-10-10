"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2 } from "lucide-react";

const inputClass =
  "w-full px-4 py-3 rounded-lg border border-[rgba(212,175,55,0.15)] bg-[#0d0b14] text-[#e8e8e8] focus:border-[rgba(212,175,55,0.4)] outline-none transition-colors text-left";

type Props = {
  boostCostCoins: number;
  boostDurationMinutes: number;
  referralRewardCoins: number;
  referralMilestoneCount: number;
  referralMilestoneCoins: number;
  referralDailyLimit: number;
  referralMaxRewarded: number;
  streakRewardCoins: number;
};

export default function BoostSettings(props: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    boostCostCoins: String(props.boostCostCoins),
    boostDurationMinutes: String(props.boostDurationMinutes),
    referralRewardCoins: String(props.referralRewardCoins),
    referralMilestoneCount: String(props.referralMilestoneCount),
    referralMilestoneCoins: String(props.referralMilestoneCoins),
    referralDailyLimit: String(props.referralDailyLimit),
    referralMaxRewarded: String(props.referralMaxRewarded),
    streakRewardCoins: String(props.streakRewardCoins),
  });
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          boostCostCoins: parseInt(form.boostCostCoins, 10),
          boostDurationMinutes: parseInt(form.boostDurationMinutes, 10),
          referralRewardCoins: parseInt(form.referralRewardCoins, 10),
          referralMilestoneCount: parseInt(form.referralMilestoneCount, 10),
          referralMilestoneCoins: parseInt(form.referralMilestoneCoins, 10),
          referralDailyLimit: parseInt(form.referralDailyLimit, 10),
          referralMaxRewarded: parseInt(form.referralMaxRewarded, 10),
          streakRewardCoins: parseInt(form.streakRewardCoins, 10),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setMessage({ ok: false, text: data.error ?? "خطایی رخ داد" }); return; }
      setMessage({ ok: true, text: "تنظیمات ذخیره شد" });
      router.refresh();
    } catch {
      setMessage({ ok: false, text: "خطا در ارتباط با سرور" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="lux-card p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#888] mb-1.5">هزینه بوست پروفایل (سکه)</label>
            <input type="number" dir="ltr" value={form.boostCostCoins} onChange={(e) => setForm((f) => ({ ...f, boostCostCoins: e.target.value }))} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#888] mb-1.5">مدت بوست (دقیقه)</label>
            <input type="number" dir="ltr" value={form.boostDurationMinutes} onChange={(e) => setForm((f) => ({ ...f, boostDurationMinutes: e.target.value }))} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#888] mb-1.5">پاداش دعوت دوستان (سکه)</label>
            <input type="number" dir="ltr" value={form.referralRewardCoins} onChange={(e) => setForm((f) => ({ ...f, referralRewardCoins: e.target.value }))} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#888] mb-1.5">تعداد دعوت برای جایزه مایلستون</label>
            <input type="number" dir="ltr" value={form.referralMilestoneCount} onChange={(e) => setForm((f) => ({ ...f, referralMilestoneCount: e.target.value }))} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#888] mb-1.5">جایزه مایلستون (سکه)</label>
            <input type="number" dir="ltr" value={form.referralMilestoneCoins} onChange={(e) => setForm((f) => ({ ...f, referralMilestoneCoins: e.target.value }))} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#888] mb-1.5">سقف دعوت روزانه</label>
            <input type="number" dir="ltr" value={form.referralDailyLimit} onChange={(e) => setForm((f) => ({ ...f, referralDailyLimit: e.target.value }))} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#888] mb-1.5">حداکثر دعوت پاداش دار</label>
            <input type="number" dir="ltr" value={form.referralMaxRewarded} onChange={(e) => setForm((f) => ({ ...f, referralMaxRewarded: e.target.value }))} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#888] mb-1.5">پاداش استریک هفتگی (سکه)</label>
            <input type="number" dir="ltr" value={form.streakRewardCoins} onChange={(e) => setForm((f) => ({ ...f, streakRewardCoins: e.target.value }))} className={inputClass} />
          </div>
        </div>
      </div>

      {message && (
        <p className={`text-sm rounded-lg px-4 py-3 ${message.ok ? "bg-[rgba(16,185,129,0.1)] text-[#34d399] border border-[rgba(16,185,129,0.2)]" : "bg-[rgba(239,68,68,0.1)] text-[#f87171] border border-[rgba(239,68,68,0.2)]"}`}>
          {message.text}
        </p>
      )}

      <button type="submit" disabled={loading} className="px-6 py-2.5 rounded-lg lux-btn-gold font-bold transition-all disabled:opacity-50 flex items-center gap-2">
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
        {loading ? "در حال ذخیره..." : "ذخیره"}
      </button>
    </form>
  );
}
