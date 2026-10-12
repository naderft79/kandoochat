"use client";

// کلاینت صفحه ماموریت ها — لیست روزانه با نوار پیشرفت و دریافت پاداش
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Check, Loader2, ClipboardList } from "lucide-react";
import { MISSION_ICONS } from "@/lib/mission-icons";
import { toPersianDigits } from "@/lib/format";
import { SkeletonRow } from "@/components/dashboard/Skeleton";
import { useToast } from "@/components/ToastProvider";
import SpecialMissionsButton from "@/components/dashboard/SpecialMissionsButton";

type Mission = {
  id: string;
  key: string;
  title: string;
  description: string;
  rewardCoins: number;
  target: number;
  icon: string;
  progress: number;
  completed: boolean;
  claimed: boolean;
};

export default function MissionsClient({ isSpecial }: { isSpecial: boolean }) {
  const router = useRouter();
  const { toast } = useToast();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  async function fetchMissions() {
    try {
      const res = await fetch("/api/missions");
      const data = await res.json();
      if (data.missions) setMissions(data.missions);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    fetch("/api/missions")
      .then((r) => r.json())
      .then((data) => {
        if (active && data.missions) setMissions(data.missions);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  async function handleClaim(missionId: string) {
    if (claimingId) return;
    setClaimingId(missionId);
    try {
      const res = await fetch("/api/missions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ missionId }),
      });
      const data = await res.json();
      if (res.ok) {
        toast("پاداش دریافت شد", "success");
        await fetchMissions();
        router.refresh();
      } else {
        toast(data.error || "خطا در دریافت پاداش", "error");
      }
    } finally {
      setClaimingId(null);
    }
  }

  const readyCount = missions.filter((m) => m.completed && !m.claimed).length;
  const doneCount = missions.filter((m) => m.completed).length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 lg:pb-10">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <ClipboardList className="w-6 h-6" />
          ماموریت ها
        </h1>
        {isSpecial && <SpecialMissionsButton />}
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        هر روز با انجام ماموریت ها سکه رایگان بگیر
      </p>

      {/* خلاصه پیشرفت */}
      <div className="mb-6 p-4 rounded-2xl border border-ig-border bg-surface flex items-center gap-4">
        <div className="w-11 h-11 rounded-full bg-ig-gold/10 flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5 text-ig-gold" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm">
            {toPersianDigits(doneCount)} از {toPersianDigits(missions.length)} ماموریت امروز
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {readyCount > 0
              ? `${toPersianDigits(readyCount)} پاداش آماده دریافت است`
              : "ماموریت ها هر روز تازه می شوند"}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-surface border border-ig-border rounded-2xl overflow-hidden">
              <SkeletonRow />
            </div>
          ))}
        </div>
      ) : missions.length === 0 ? (
        <div className="text-center py-20">
          <Sparkles className="w-14 h-14 text-ig-border mx-auto mb-4" />
          <p className="font-medium">ماموریتی فعال نیست</p>
          <p className="text-sm text-muted-foreground mt-1">به زودی ماموریت های جدید می آیند</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {missions.map((m, idx) => {
            const MissionIcon = MISSION_ICONS[m.key] ?? Sparkles;
            const pct = Math.min(100, (m.progress / m.target) * 100);
            return (
              <div
                key={m.id}
                style={{ animationDelay: `${idx * 50}ms` }}
                className="rounded-2xl p-4 border border-ig-border bg-surface ig-rise"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-ig-btn2 flex items-center justify-center shrink-0">
                    <MissionIcon className="w-5 h-5 text-foreground" strokeWidth={1.75} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold text-foreground truncate">{m.title}</p>
                      {m.claimed ? (
                        <span className="w-6 h-6 rounded-full bg-ig-blue flex items-center justify-center shrink-0">
                          <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                        </span>
                      ) : m.completed ? (
                        <button
                          type="button"
                          onClick={() => handleClaim(m.id)}
                          disabled={claimingId === m.id}
                          className="px-4 py-1.5 rounded-full bg-ig-blue text-white text-xs font-bold hover:bg-ig-blue-hover transition-all active:scale-90 disabled:opacity-50 shrink-0"
                        >
                          {claimingId === m.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            `+${toPersianDigits(m.rewardCoins)} سکه`
                          )}
                        </button>
                      ) : (
                        <span className="text-xs font-bold text-ig-gold shrink-0">
                          +{toPersianDigits(m.rewardCoins)} سکه
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{m.description}</p>

                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-2 flex-1 rounded-full bg-ig-gray-bg overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-[width] duration-700 ease-out ${
                            m.completed ? "bg-ig-blue" : "bg-neutral-400"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-ig-gray font-bold shrink-0 tabular-nums">
                        {toPersianDigits(m.progress)}/{toPersianDigits(m.target)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
