"use client";

// صفحه دعوت دوستان — کد، لینک، QR، اشتراک گذاری، مایلستون، آمار، لیدربورد و لیست دعوت ها
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import {
  Gift, Copy, Check, Users, Coins, Trophy, UserPlus, ClipboardCheck,
  Share2, Send, MessageCircle, QrCode, Crown, Clock3, BadgeCheck,
} from "lucide-react";
import { toPersianDigits } from "@/lib/format";
import { nativeShare as capShare, nativeCopy } from "@/lib/native";
import DefaultAvatar from "@/components/dashboard/DefaultAvatar";

type ReferralItem = {
  id: string;
  status: "PENDING" | "PAID";
  rewardCoins: number;
  createdAt: string;
  paidAt: string | null;
  referred: { firstName: string; photo: string | null };
};

type ReferralData = {
  code: string;
  rewardCoins: number;
  milestone: { target: number; reward: number; progress: number; paidAt: string | null };
  stats: { invited: number; pending: number; paid: number; earned: number };
  referrals: ReferralItem[];
  leaderboard: { rank: number; invites: number; isMe: boolean }[];
};

export default function ReferralPage() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState<"code" | "link" | null>(null);
  const [qrUrl, setQrUrl] = useState("");

  const inviteLink = useMemo(
    () => (data?.code ? `${window.location.origin}/invite/${data.code}` : ""),
    [data?.code]
  );

  const shareText = useMemo(
    () =>
      data
        ? `به کندو بیا! با لینک دعوت من ثبت نام کن و ${toPersianDigits(data.rewardCoins)} سکه رایگان بگیر:`
        : "",
    [data]
  );

  useEffect(() => {
    fetch("/api/referral")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: ReferralData) => setData(d))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  // تولید QR کد لینک دعوت
  useEffect(() => {
    if (!inviteLink) return;
    QRCode.toDataURL(inviteLink, { width: 240, margin: 1, color: { dark: "#262626", light: "#ffffff" } })
      .then(setQrUrl)
      .catch(() => setQrUrl(""));
  }, [inviteLink]);

  function copyText(text: string, which: "code" | "link") {
    void nativeCopy(text);
    setCopied(which);
    setTimeout(() => setCopied(null), 2000);
  }

  function openShare(url: string) {
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function share() {
    const ok = await capShare({ title: "دعوت به کندو", text: shareText, url: inviteLink });
    if (!ok) copyText(inviteLink, "link");
  }

  if (loading) {
    return (
      <div className="max-w-[600px] mx-auto px-4 py-10 text-center">
        <p className="text-sm text-ig-gray">در حال بارگذاری...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-[600px] mx-auto px-4 py-10 text-center">
        <p className="text-sm font-bold text-foreground mb-2">خطا در بارگذاری</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-xl bg-ig-btn2 text-sm font-bold"
        >
          تلاش مجدد
        </button>
      </div>
    );
  }

  const milestonePct = Math.min(100, Math.round((data.milestone.progress / data.milestone.target) * 100));

  const steps = [
    {
      icon: Share2,
      title: "لینک یا کد دعوتت رو بفرست",
      desc: "لینک اختصاصی خودت رو برای دوستانت بفرست یا QR کد رو بهشون نشون بده",
    },
    {
      icon: ClipboardCheck,
      title: "دوستت ثبت نام و فعال بشه",
      desc: "دوستت ثبت نام می کنه، پروفایلش رو کامل می کنه و یک ماموریت روزانه رو انجام می ده",
    },
    {
      icon: Coins,
      title: "هر دوتون پاداش می گیرید",
      desc: `تو و دوستت هر کدوم ${toPersianDigits(data.rewardCoins)} سکه پاداش می گیرید`,
    },
  ];

  return (
    <div className="max-w-[600px] mx-auto px-4 py-6 md:py-10 space-y-4">
      {/* هدر */}
      <div className="text-center">
        <div className="w-14 h-14 rounded-full bg-ig-btn2 mx-auto flex items-center justify-center mb-2">
          <Gift className="w-7 h-7 text-foreground" />
        </div>
        <h1 className="text-lg font-bold text-foreground">دعوت دوستان</h1>
        <p className="text-sm text-ig-gray mt-1 leading-6">
          با هر دعوت فعال {toPersianDigits(data.rewardCoins)} سکه برای تو و {toPersianDigits(data.rewardCoins)} سکه برای دوستت
        </p>
      </div>

      {/* کد و لینک دعوت */}
      <div className="bg-white border border-ig-border rounded-2xl p-5">
        <p className="text-xs font-bold text-ig-gray mb-2 text-center">کد دعوت شما</p>
        <button
          onClick={() => copyText(data.code, "code")}
          className="w-full flex items-center justify-center gap-3 py-3 rounded-xl bg-ig-gray-bg hover:bg-ig-btn2 transition-colors active:scale-[0.98]"
          dir="ltr"
        >
          <span className="text-3xl md:text-4xl font-black tracking-[0.3em] text-foreground">
            {data.code}
          </span>
          {copied === "code" ? (
            <Check className="w-5 h-5 text-green-600" />
          ) : (
            <Copy className="w-5 h-5 text-ig-gray" />
          )}
        </button>
        {copied === "code" && <p className="text-xs text-green-600 text-center mt-1">کد کپی شد</p>}

        <div className="flex items-center gap-2 mt-3" dir="ltr">
          <input
            type="text"
            readOnly
            value={inviteLink}
            className="flex-1 min-w-0 px-3 py-2.5 rounded-xl bg-ig-gray-bg text-xs text-ig-gray outline-none truncate"
          />
          <button
            onClick={() => copyText(inviteLink, "link")}
            className="px-4 py-2.5 rounded-xl bg-ig-blue text-white text-sm font-bold shrink-0 flex items-center gap-1"
          >
            {copied === "link" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied === "link" ? "کپی شد" : "کپی"}
          </button>
        </div>

        {/* دکمه های اشتراک گذاری */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <button
            onClick={() => openShare(`https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(shareText)}`)}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-ig-btn2 hover:bg-ig-btn2-hover text-sm font-bold transition-colors"
          >
            <Send className="w-4 h-4 text-sky-500" />
            تلگرام
          </button>
          <button
            onClick={() => openShare(`https://wa.me/?text=${encodeURIComponent(`${shareText} ${inviteLink}`)}`)}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-ig-btn2 hover:bg-ig-btn2-hover text-sm font-bold transition-colors"
          >
            <MessageCircle className="w-4 h-4 text-green-600" />
            واتساپ
          </button>
          <button
            onClick={share}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-ig-btn2 hover:bg-ig-btn2-hover text-sm font-bold transition-colors"
          >
            <Share2 className="w-4 h-4 text-foreground" />
            اشتراک
          </button>
        </div>

        {/* QR کد */}
        {qrUrl && (
          <div className="mt-4 flex flex-col items-center">
            <div className="p-3 bg-white border border-ig-border rounded-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrUrl} alt="QR کد دعوت" className="w-36 h-36" />
            </div>
            <p className="text-[11px] text-ig-gray mt-2 flex items-center gap-1">
              <QrCode className="w-3.5 h-3.5" />
              دوستت با اسکن این کد مستقیم وارد صفحه دعوت می شه
            </p>
          </div>
        )}
      </div>

      {/* چطور سکه بگیرید */}
      <div className="bg-white border border-ig-border rounded-2xl p-5">
        <h2 className="font-bold text-foreground text-center mb-4">چطور سکه بگیرید؟</h2>
        <div className="space-y-3">
          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-ig-btn2 flex items-center justify-center shrink-0">
                <step.icon className="w-5 h-5 text-foreground" />
              </div>
              <div className="pt-0.5">
                <p className="text-sm font-semibold text-foreground">
                  {toPersianDigits(i + 1)}. {step.title}
                </p>
                <p className="text-xs text-ig-gray mt-0.5 leading-5">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-ig-border flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
          <p className="text-xs text-ig-gray leading-5">
            بعد از <span className="font-bold text-foreground">{toPersianDigits(data.milestone.target)} دعوت فعال</span>{" "}
            <span className="font-bold text-amber-600">{toPersianDigits(data.milestone.reward)} سکه جایزه ویژه</span> هم می گیری
          </p>
        </div>
      </div>

      {/* پیشرفت مایلستون */}
      <div className="bg-white border border-ig-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-bold text-foreground">جایزه مایلستون</p>
          {data.milestone.paidAt ? (
            <span className="text-xs font-bold text-green-600 flex items-center gap-1">
              <BadgeCheck className="w-4 h-4" />
              دریافت شد
            </span>
          ) : (
            <span className="text-xs text-ig-gray">
              {toPersianDigits(data.milestone.progress)} از {toPersianDigits(data.milestone.target)}
            </span>
          )}
        </div>
        <div className="h-2.5 rounded-full bg-ig-btn2 overflow-hidden">
          <div
            className="h-full rounded-full bg-amber-500 transition-all"
            style={{ width: `${milestonePct}%` }}
          />
        </div>
        <p className="text-[11px] text-ig-gray mt-2">
          {data.milestone.paidAt
            ? `${toPersianDigits(data.milestone.reward)} سکه جایزه مایلستون دریافت شد`
            : `${toPersianDigits(Math.max(0, data.milestone.target - data.milestone.progress))} دعوت فعال دیگر تا ${toPersianDigits(data.milestone.reward)} سکه جایزه`}
        </p>
      </div>

      {/* آمار */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { icon: Users, label: "کل دعوت ها", value: data.stats.invited },
          { icon: Clock3, label: "در انتظار", value: data.stats.pending },
          { icon: BadgeCheck, label: "فعال", value: data.stats.paid },
          { icon: Coins, label: "سکه کسب شده", value: data.stats.earned },
        ].map((s, i) => (
          <div key={i} className="bg-white border border-ig-border rounded-2xl p-3 text-center">
            <s.icon className="w-5 h-5 text-foreground mx-auto mb-1" strokeWidth={1.75} />
            <p className="text-lg md:text-xl font-bold text-foreground leading-6">{toPersianDigits(s.value)}</p>
            <p className="text-[10px] md:text-xs text-ig-gray mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* لیدربورد ناشناس */}
      {data.leaderboard.length > 0 && (
        <div className="bg-white border border-ig-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Crown className="w-5 h-5 text-amber-500" />
            <p className="text-sm font-bold text-foreground">برترین دعوت کننده ها</p>
          </div>
          <div className="space-y-1">
            {data.leaderboard.map((row) => (
              <div
                key={row.rank}
                className={`flex items-center gap-3 py-2 px-2 rounded-xl ${row.isMe ? "bg-ig-gray-bg" : ""}`}
              >
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    row.rank === 1
                      ? "bg-amber-100 text-amber-700"
                      : row.rank === 2
                        ? "bg-slate-100 text-slate-600"
                        : row.rank === 3
                          ? "bg-orange-100 text-orange-700"
                          : "bg-ig-btn2 text-ig-gray"
                  }`}
                >
                  {toPersianDigits(row.rank)}
                </span>
                <span className="text-sm text-foreground flex-1">
                  {row.isMe ? "شما" : "دعوت کننده ناشناس"}
                </span>
                <span className="text-xs font-bold text-foreground">
                  {toPersianDigits(row.invites)} دعوت فعال
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* لیست دعوت ها */}
      {data.referrals.length > 0 ? (
        <div className="bg-white border border-ig-border rounded-2xl p-5">
          <p className="text-sm font-bold text-foreground mb-3">دوستان دعوت شده</p>
          <div className="space-y-1">
            {data.referrals.map((r) => (
              <div key={r.id} className="flex items-center gap-3 py-2 border-b border-ig-border last:border-0">
                {r.referred.photo ? (
                  <Image
                    src={r.referred.photo}
                    alt={r.referred.firstName}
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <DefaultAvatar size={40} />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{r.referred.firstName}</p>
                  <p className="text-[11px] text-ig-gray">
                    {new Date(r.createdAt).toLocaleDateString("fa-IR")}
                  </p>
                </div>
                {r.status === "PAID" ? (
                  <span className="text-[11px] font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-full shrink-0">
                    پرداخت شد +{toPersianDigits(r.rewardCoins)}
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-ig-gray bg-ig-btn2 px-2.5 py-1 rounded-full shrink-0">
                    در انتظار فعالیت
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white border border-ig-border rounded-2xl p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-ig-btn2 flex items-center justify-center mx-auto mb-3">
            <UserPlus className="w-8 h-8 text-ig-gray" strokeWidth={1.5} />
          </div>
          <p className="text-sm font-bold text-foreground mb-1">هنوز دوستی دعوت نکرده اید</p>
          <p className="text-xs text-ig-gray leading-5 mb-4">
            لینک دعوتت رو برای دوستانت بفرست و با هر دعوت فعال سکه بگیر
          </p>
          <button
            onClick={share}
            className="px-5 py-2.5 rounded-xl bg-ig-blue text-white text-sm font-bold"
          >
            اشتراک لینک دعوت
          </button>
        </div>
      )}
    </div>
  );
}
