"use client";

// مدیریت کاربران — جستجو، فیلتر و لود به هنگام اسکرول
import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { BadgeCheck, Ban, Search, Filter, X, Loader2, User, MapPin, Briefcase, Calendar, Crown, Phone, Image as ImageIcon, UserCog, Lock, Trash2, RotateCcw, Gift } from "lucide-react";
import VerifiedBadge from "@/components/dashboard/VerifiedBadge";
import { formatCoins, formatDate, formatToman, toPersianDigits } from "@/lib/format";
import { PROVINCES, PROVINCE_NAMES } from "@/lib/iran";
import type { UserStats } from "@/lib/user-stats";
import UserActions from "@/components/admin/UserActions";
import UserCoinModal from "@/components/admin/UserCoinModal";
import UserSubscriptionModal from "@/components/admin/UserSubscriptionModal";
import UserEditModal from "@/components/admin/UserEditModal";
import MessageLockModal from "@/components/admin/MessageLockModal";
import AdminUserPhotosModal from "@/components/admin/AdminUserPhotosModal";
import DefaultAvatar from "@/components/dashboard/DefaultAvatar";
import { IpCountryBadge } from "@/components/admin/CountryFlag";
import DeleteUserModal from "@/components/admin/DeleteUserModal";
import UserLink from "@/components/admin/user-modal/UserLink";

type UserItem = {
  id: string;
  phone: string;
  username: string;
  firstName: string;
  lastName: string;
  gender: string;
  age: number;
  height: number;
  weight: number;
  income: number;
  province: string;
  city: string;
  neighborhood: string | null;
  job: string | null;
  carModel: string | null;
  bio: string | null;
  messageLockUntil: string | null;
  messageLockReason: string | null;
  role: string;
  isVerified: boolean;
  isActive: boolean;
  phoneVerified: boolean;
  isSpecial: boolean;
  isFake: boolean;
  hasSubscription: boolean;
  subscription: { startsAt: string; endsAt: string } | null;
  createdAt: string | Date;
  lastIp: string | null;
  lastIpAt: string | null;
  lastCountry: string | null;
  deletedAt: string | null;
  deletePurgeAfter: string | null;
  stats: UserStats;
  referredBy: { phone: string; username: string } | null;
  wallet: { balance: number;[key: string]: unknown } | null;
  photos: { id: string; url: string; isProfile: boolean }[];
};

type Props = {
  initialUsers: UserItem[];
  total: number;
  hasMore: boolean;
  canSetRole?: boolean;
  canSeeIp?: boolean;
};

const TAKE = 50;

// کارت های آمار بخش مشخصات هر کاربر (مبالغ تومانی و سکه ای به صورت فارسی)
function buildStatCards(s: UserStats) {
  return [
    { label: "تعداد پیام های ارسالی", value: toPersianDigits(s.messagesSent) },
    { label: "تعداد عکس های ارسالی", value: toPersianDigits(s.imagesSent) },
    { label: "تعداد خرید اشتراک", value: toPersianDigits(s.subscriptionCount) },
    {
      label: "جمع خرید اشتراک",
      value: formatToman(s.subscriptionToman),
      sub: s.subscriptionCoins > 0 ? `${formatCoins(s.subscriptionCoins)} با سکه` : undefined,
    },
    { label: "جمع سکه خریداری شده", value: formatCoins(s.coinsPurchased) },
    { label: "جمع سکه انتقالی", value: formatCoins(s.coinsTransferred) },
    { label: "جمع سکه برداشتی", value: formatCoins(s.coinsWithdrawn) },
    { label: "جمع مبلغ برداشتی", value: formatToman(s.withdrawnToman) },
  ];
}

// کلید ذخیره سازی ترجیح عدم نمایش فیک در مرورگر ادمین
const HIDE_FAKE_KEY = "admin-users-hide-fake";

export default function AdminUsersClient({ initialUsers, total, hasMore: initialHasMore, canSetRole = false, canSeeIp = false }: Props) {
  const router = useRouter();
  const [users, setUsers] = useState<UserItem[]>(initialUsers);
  const [skip, setSkip] = useState(initialUsers.length);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [genderFilter, setGenderFilter] = useState("");
  const [provinceFilter, setProvinceFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [verifiedFilter, setVerifiedFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [hideFake, setHideFake] = useState(false);
  const [sort, setSort] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [coinModalUserId, setCoinModalUserId] = useState<string | null>(null);
  const [subscriptionModalUserId, setSubscriptionModalUserId] = useState<string | null>(null);
  const [photosModalUserId, setPhotosModalUserId] = useState<string | null>(null);
  const [editModalUserId, setEditModalUserId] = useState<string | null>(null);
  const [lockModalUserId, setLockModalUserId] = useState<string | null>(null);
  const [deleteModalUserId, setDeleteModalUserId] = useState<string | null>(null);
  const [restoreBusyId, setRestoreBusyId] = useState<string | null>(null);
  const [restoreConfirmId, setRestoreConfirmId] = useState<string | null>(null);

  const loadMoreRef = useRef<HTMLDivElement>(null);
  const latestReqRef = useRef(0);

  const tabs = [
    { key: "overview", label: "نگاه کلی" },
    { key: "messageLocked", label: "قفل پیام" },
    { key: "blocked", label: "مسدود شده" },
    { key: "special", label: "کاربران ویژه" },
    { key: "verified", label: "تیک آبی" },
    { key: "female", label: "دختران" },
    { key: "male", label: "پسران" },
    { key: "subscribed", label: "با اشتراک" },
    { key: "unsubscribed", label: "بدون اشتراک" },
    { key: "mostCoins", label: "بیشترین سکه" },
    { key: "leastCoins", label: "کمترین سکه" },
    { key: "fake", label: "فیک (ربات)" },
    { key: "admins", label: "مدیران" },
    ...(canSetRole ? [{ key: "deleted", label: "حذف شده ها" }] : []),
  ];

  function buildParams(
    overrides?: Partial<{
      search: string;
      activeTab: string;
      genderFilter: string;
      provinceFilter: string;
      cityFilter: string;
      verifiedFilter: string;
      activeFilter: string;
      hideFake: boolean;
      sort: string;
    }>
  ) {
    const s = overrides?.search ?? search;
    const tab = overrides?.activeTab ?? activeTab;
    const gender = overrides?.genderFilter ?? genderFilter;
    const province = overrides?.provinceFilter ?? provinceFilter;
    const city = overrides?.cityFilter ?? cityFilter;
    const verified = overrides?.verifiedFilter ?? verifiedFilter;
    const active = overrides?.activeFilter ?? activeFilter;
    const hideFakeVal = overrides?.hideFake ?? hideFake;
    const sortVal = overrides?.sort ?? sort;

    const p = new URLSearchParams();
    if (s) p.set("search", s);
    if (gender) p.set("gender", gender);
    if (province) p.set("province", province);
    if (city) p.set("city", city);
    if (verified) p.set("verified", verified);
    if (active) p.set("active", active);
    if (hideFakeVal) p.set("hideFake", "true");
    if (sortVal && sortVal !== "newest") p.set("sort", sortVal);
    p.set("tab", tab);
    if (tab === "admins") p.set("admins", "true");
    if (tab === "deleted") p.set("deleted", "true");
    p.set("take", String(TAKE));
    return p;
  }

  async function restoreUser(userId: string) {
    if (restoreConfirmId !== userId) {
      setRestoreConfirmId(userId);
      setTimeout(() => setRestoreConfirmId(null), 4000);
      return;
    }
    setRestoreConfirmId(null);
    setRestoreBusyId(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action: "restoreUser" }),
      });
      const data = await res.json();
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        router.refresh();
      } else {
        alert(data.error ?? "خطا در بازیابی");
      }
    } finally {
      setRestoreBusyId(null);
    }
  }

  async function fetchUsers(
    nextSkip: number,
    replace: boolean,
    overrides?: Parameters<typeof buildParams>[0]
  ) {
    const reqId = ++latestReqRef.current;
    setLoading(true);
    try {
      const p = buildParams(overrides);
      p.set("skip", String(nextSkip));
      const res = await fetch(`/api/admin/users?${p.toString()}`);
      const data = await res.json();
      if (reqId !== latestReqRef.current) return; // پاسخ قدیمی را نادیده می گیریم
      if (!res.ok) {
        console.error("[admin/users] fetch error:", data.error);
        return;
      }
      if (replace) {
        setUsers(data.users);
        setSkip(data.users.length);
      } else {
        setUsers((prev) => [...prev, ...data.users]);
        setSkip(nextSkip + data.users.length);
      }
      setHasMore(data.hasMore);
    } finally {
      if (reqId === latestReqRef.current) {
        setLoading(false);
      }
    }
  }

  const didMountRef = useRef(false);

  // بازیابی ترجیح «عدم نمایش فیک» از حافظه محلی — چون لیست اولیه سمت سرور ساخته شده، با فیلتر دوباره واکشی می کنیم
  useEffect(() => {
    if (localStorage.getItem(HIDE_FAKE_KEY) === "1") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- ترجیح کاربر فقط در کلاینت قابل خواندن است
      setHideFake(true);
      fetchUsers(0, true, { hideFake: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // جستجو با تاخیر کوتاه
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    const timer = setTimeout(() => {
      fetchUsers(0, true);
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // اسکرول بی نهایت
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const target = entries[0];
      if (target.isIntersecting && hasMore && !loading) {
        fetchUsers(skip, false);
      }
    },
    [hasMore, loading, skip]
  );

  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(handleObserver, { rootMargin: "200px" });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleObserver]);

  // گزینه های شهر از لیست ثابت استان ها (نه فقط کاربران بارگذاری شده)
  const cities = provinceFilter ? PROVINCES[provinceFilter] ?? [] : [];

  const hasActiveFilters = genderFilter || provinceFilter || cityFilter || verifiedFilter || activeFilter || hideFake;

  // تغییر وضعیت عدم نمایش فیک + ماندگاری در مرورگر
  function toggleHideFake(value: boolean) {
    setHideFake(value);
    if (value) {
      localStorage.setItem(HIDE_FAKE_KEY, "1");
    } else {
      localStorage.removeItem(HIDE_FAKE_KEY);
    }
    fetchUsers(0, true, { hideFake: value });
  }

  function clearFilters() {
    setGenderFilter("");
    setProvinceFilter("");
    setCityFilter("");
    setVerifiedFilter("");
    setActiveFilter("");
    setHideFake(false);
    localStorage.removeItem(HIDE_FAKE_KEY);
  }

  function handleActionComplete() {
    fetchUsers(0, true);
  }

  return (
    <div className="space-y-4">
      {/* تب های فیلتر و مرتب سازی */}
      <div className="flex flex-wrap gap-2 pb-1">
        {tabs.map((t) => {
          const active = activeTab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => {
                setActiveTab(t.key);
                fetchUsers(0, true, { activeTab: t.key });
              }}
              className={`shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                active
                  ? t.key === "female"
                    ? "bg-pink-500 text-white border-transparent"
                    : t.key === "male"
                      ? "bg-blue-500 text-white border-transparent"
                      : "lux-btn-gold border-transparent"
                  : t.key === "female"
                    ? "lux-card text-pink-400 hover:bg-pink-500/10 hover:text-pink-300"
                    : t.key === "male"
                      ? "lux-card text-blue-400 hover:bg-blue-500/10 hover:text-blue-300"
                      : "lux-card text-[#888] hover:text-[#d4af37]"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* جستجو */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جستجو بر اساس اسم، یوزرنیم یا تلفن..."
            className="w-full pr-9 pl-3 py-2.5 rounded-xl border border-[rgba(212,175,55,0.15)] bg-[#0d0d0d] text-[#e8e8e8] text-sm focus:outline-none focus:border-[rgba(212,175,55,0.4)] placeholder:text-[#555]"
          />
        </div>
        <select
          aria-label="مرتب سازی"
          value={sort}
          onChange={(e) => {
            const value = e.target.value;
            setSort(value);
            fetchUsers(0, true, { sort: value });
          }}
          className="shrink-0 px-2 sm:px-3 py-2.5 rounded-xl border border-[rgba(212,175,55,0.15)] bg-[#0d0d0d] text-[#e8e8e8] text-xs sm:text-sm font-medium focus:outline-none focus:border-[rgba(212,175,55,0.4)]"
        >
          <option value="newest">جدیدترین</option>
          <option value="oldest">قدیمی ترین</option>
          <option value="coins">بیشترین سکه</option>
          <option value="income">بیشترین درآمد</option>
          <option value="lastSeen">آخرین بازدید</option>
          <option value="ageAsc">کمترین سن</option>
          <option value="ageDesc">بیشترین سن</option>
        </select>
        {/* عدم نمایش فیک — کنار مرتب سازی؛ وضعیتش در مرورگر ذخیره می شود */}
        <label className="shrink-0 flex items-center gap-2 px-3 py-2.5 rounded-xl border border-[rgba(212,175,55,0.15)] text-xs sm:text-sm font-medium text-[#e8e8e8] cursor-pointer select-none whitespace-nowrap">
          <input
            type="checkbox"
            checked={hideFake}
            onChange={(e) => toggleHideFake(e.target.checked)}
            className="w-4 h-4 accent-[#d4af37]"
          />
          عدم نمایش فیک
        </label>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-3 py-2.5 rounded-xl border text-sm font-bold flex items-center gap-1.5 transition-all ${
            showFilters || hasActiveFilters
              ? "lux-btn-outline border-[rgba(212,175,55,0.4)]"
              : "lux-card text-[#888] hover:text-[#d4af37]"
          }`}
        >
          <Filter className="w-4 h-4" />
          فیلتر
          {hasActiveFilters && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37]" />
          )}
        </button>
      </div>

      {/* فیلتر استان و شهر — همیشه قابل مشاهده؛ گزینه ها از لیست ثابت استان ها و شهرها */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <select
          aria-label="فیلتر استان"
          value={provinceFilter}
          onChange={(e) => {
            const value = e.target.value;
            setProvinceFilter(value);
            setCityFilter("");
            fetchUsers(0, true, { provinceFilter: value, cityFilter: "" });
          }}
          className="px-3 py-2.5 rounded-xl border border-[rgba(212,175,55,0.15)] bg-[#0d0d0d] text-[#e8e8e8] text-sm focus:outline-none focus:border-[rgba(212,175,55,0.4)]"
        >
          <option value="">همه استان ها</option>
          {PROVINCE_NAMES.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <select
          aria-label="فیلتر شهر"
          value={cityFilter}
          disabled={!provinceFilter}
          onChange={(e) => {
            const value = e.target.value;
            setCityFilter(value);
            fetchUsers(0, true, { cityFilter: value });
          }}
          className="px-3 py-2.5 rounded-xl border border-[rgba(212,175,55,0.15)] bg-[#0d0d0d] text-[#e8e8e8] text-sm focus:outline-none focus:border-[rgba(212,175,55,0.4)] disabled:opacity-50"
        >
          <option value="">{provinceFilter ? "همه شهرها" : "ابتدا استان را انتخاب کنید"}</option>
          {cities.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* پنل فیلترها */}
      {showFilters && (
        <div className="lux-card p-3 space-y-3 animate-fade-in-up">
          <div className="flex flex-wrap gap-2">
            {/* جنسیت */}
            <select
              value={genderFilter}
              onChange={(e) => {
                const value = e.target.value;
                setGenderFilter(value);
                fetchUsers(0, true, { genderFilter: value });
              }}
              className="px-3 py-2 rounded-lg border border-[rgba(212,175,55,0.15)] bg-[#0d0d0d] text-[#e8e8e8] text-xs font-medium focus:outline-none focus:border-[rgba(212,175,55,0.4)]"
            >
              <option value="">همه جنسیت ها</option>
              <option value="MALE">مرد</option>
              <option value="FEMALE">زن</option>
            </select>

            {/* تایید شده */}
            <select
              value={verifiedFilter}
              onChange={(e) => {
                const value = e.target.value;
                setVerifiedFilter(value);
                fetchUsers(0, true, { verifiedFilter: value });
              }}
              className="px-3 py-2 rounded-lg border border-[rgba(212,175,55,0.15)] bg-[#0d0d0d] text-[#e8e8e8] text-xs font-medium focus:outline-none focus:border-[rgba(212,175,55,0.4)]"
            >
              <option value="">همه وضعیت تایید</option>
              <option value="verified">تایید شده</option>
              <option value="unverified">تایید نشده</option>
            </select>

            {/* فعال/مسدود */}
            <select
              value={activeFilter}
              onChange={(e) => {
                const value = e.target.value;
                setActiveFilter(value);
                fetchUsers(0, true, { activeFilter: value });
              }}
              className="px-3 py-2 rounded-lg border border-[rgba(212,175,55,0.15)] bg-[#0d0d0d] text-[#e8e8e8] text-xs font-medium focus:outline-none focus:border-[rgba(212,175,55,0.4)]"
            >
              <option value="">همه وضعیت ها</option>
              <option value="active">فعال</option>
              <option value="blocked">مسدود</option>
            </select>

            {hasActiveFilters && (
              <button
                onClick={() => {
                  clearFilters();
                  fetchUsers(0, true, {
                    genderFilter: "",
                    provinceFilter: "",
                    cityFilter: "",
                    verifiedFilter: "",
                    activeFilter: "",
                    hideFake: false,
                  });
                }}
                className="px-3 py-2 rounded-lg border border-[rgba(239,68,68,0.2)] text-xs font-medium text-[#f87171] hover:bg-[rgba(239,68,68,0.08)] flex items-center gap-1 transition-colors"
              >
                <X className="w-3 h-3" />
                پاک کردن
              </button>
            )}
          </div>
        </div>
      )}

      {/* تعداد نتایج */}
      <p className="text-xs text-[#888]">
        {toPersianDigits(users.length)} از {toPersianDigits(total)} کاربر
      </p>

      {/* لیست کاربران */}
      <div className="space-y-2">
        {users.length === 0 && !loading && (
          <div className="lux-card p-8 text-center">
            <p className="text-sm text-[#666]">کاربری یافت نشد</p>
          </div>
        )}
        {users.map((u, idx) => (
          <div
            key={u.id}
            className={`lux-card p-3 flex flex-col xl:flex-row gap-3 animate-fade-in-up ${
              !u.isActive
                ? "border-[rgba(239,68,68,0.25)]"
                : u.hasSubscription
                  ? "border-[rgba(16,185,129,0.2)]"
                  : ""
            }`}
            style={{ animationDelay: `${Math.min(idx * 0.03, 0.3)}s` }}
          >
            {/* ستون عکس پروفایل + نام + آیدی + سکه */}
            <div className="flex xl:flex-col items-center xl:items-center gap-3 xl:gap-3 min-w-[5.5rem] xl:w-32 shrink-0 xl:pt-2">
              <div className="relative shrink-0 flex flex-col items-center gap-1.5">
                {u.photos.find((p) => p.isProfile)?.url ? (
                  <div
                    onClick={() => window.open(`/profile/${u.id}`, "_blank", "width=400,height=800")}
                    className="relative w-16 h-16 xl:w-20 xl:h-20 rounded-full overflow-hidden ring-2 ring-neutral-100 cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <Image
                      src={u.photos.find((p) => p.isProfile)?.url ?? ""}
                      alt={u.firstName}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </div>
                ) : (
                  <div
                    onClick={() => window.open(`/profile/${u.id}`, "_blank", "width=400,height=800")}
                    className="inline-block cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <DefaultAvatar size={80} />
                  </div>
                )}
                <span
                  onClick={() => setCoinModalUserId(u.id)}
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[10px] font-black text-black bg-[#d4af37] px-1.5 py-0.5 rounded-lg whitespace-nowrap border border-[#b8941f] shadow-sm cursor-pointer hover:bg-[#e6c558]"
                >
                  {formatCoins(u.wallet?.balance ?? 0)}
                </span>
              </div>
              <div className="xl:text-center min-w-0">
                <p className="font-black text-foreground text-sm flex items-center gap-1 flex-wrap xl:justify-center">
                  <UserLink userId={u.id}>{u.firstName} {u.lastName}</UserLink>
                  {u.isVerified && <VerifiedBadge className="w-5 h-5" />}
                </p>
                {!u.isActive && (
                  <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded bg-red-50 text-[9px] text-ig-red font-bold">
                    <Ban className="w-2.5 h-2.5" />
                    مسدود
                  </span>
                )}
                {u.referredBy && (
                  <p className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 border border-purple-200 text-[9px] font-bold text-purple-700 xl:justify-center">
                    <Gift className="w-2.5 h-2.5" />
                    دعوت شده توسط:
                    <span dir="ltr">{u.referredBy.phone}</span>
                    <span dir="ltr">@{u.referredBy.username}</span>
                  </p>
                )}
              </div>
            </div>

            {/* ستون مشخصات */}
            <div className="flex-1 bg-neutral-50 rounded-xl p-3 space-y-2 min-w-0">
              <p className="text-[11px] font-bold text-ig-gray flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                مشخصات
              </p>
              <div className="flex flex-wrap gap-1.5 text-[11px]">
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white border border-ig-border text-foreground font-medium" dir="ltr">
                  @{u.username}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white border border-ig-border text-foreground font-medium" dir="ltr">
                  <Phone className="w-3 h-3 text-ig-gray" />
                  {u.phone}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white border border-ig-border text-foreground font-medium">
                  {u.gender === "MALE" ? "پسر" : "دختر"}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white border border-ig-border text-foreground font-medium">
                  {toPersianDigits(u.age)} ساله
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white border border-ig-border text-foreground font-medium">
                  <MapPin className="w-3 h-3 text-ig-gray" />
                  {u.province}، {u.city}
                </span>
                {u.job && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white border border-ig-border text-foreground font-medium">
                    <Briefcase className="w-3 h-3 text-ig-gray" />
                    {u.job}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white border border-ig-border text-foreground font-medium">
                  <Calendar className="w-3 h-3 text-ig-gray" />
                  عضویت {formatDate(u.createdAt)}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white border border-ig-border text-foreground font-medium" title="آخرین IP و کشور">
                  <IpCountryBadge ip={u.lastIp} country={u.lastCountry} canSeeIp={canSeeIp} />
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 pt-2 border-t border-ig-border">
                {buildStatCards(u.stats).map((c) => (
                  <div key={c.label} className="rounded-lg bg-white border border-ig-border px-2 py-1.5 min-w-0">
                    <p className="text-[10px] text-ig-gray truncate">{c.label}</p>
                    <p className="text-[12px] font-black text-foreground truncate">{c.value}</p>
                    {c.sub && <p className="text-[10px] text-ig-gray truncate">{c.sub}</p>}
                  </div>
                ))}
              </div>
            </div>

            {/* ستون اشتراک */}
            <div className={`rounded-xl p-3 space-y-2 w-full xl:w-44 shrink-0 ${u.hasSubscription ? "bg-[rgba(16,185,129,0.06)] border border-[rgba(16,185,129,0.15)]" : "lux-card"}`}>
              <p className={`text-[11px] font-bold flex items-center gap-1.5 ${u.hasSubscription ? "text-[#34d399]" : "text-[#888]"}`}>
                <Crown className="w-3.5 h-3.5" />
                اشتراک
              </p>
              {u.hasSubscription && u.subscription ? (
                <div className="space-y-1 text-[11px] text-[#34d399]">
                  <p className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    شروع: {formatDate(u.subscription.startsAt)}
                  </p>
                  <p className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    پایان: {formatDate(u.subscription.endsAt)}
                  </p>
                </div>
              ) : (
                <p className="text-[11px] text-[#666] font-medium">بدون اشتراک</p>
              )}
              <button
                onClick={() => setSubscriptionModalUserId(u.id)}
                className="mt-2 w-full py-1.5 rounded-lg lux-btn-gold text-[10px] font-bold transition-all"
              >
                تغییر وضعیت
              </button>
            </div>

            {/* ستون اکشن‌ها */}
            <div className="w-full xl:w-[28rem] shrink-0">
              <div className="grid grid-cols-4 gap-1.5">
                <button
                  onClick={() => setPhotosModalUserId(u.id)}
                  className="px-2 py-2 rounded-lg lux-btn-gold text-[10px] font-bold transition-all flex items-center justify-center gap-1 text-center"
                >
                  <ImageIcon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{toPersianDigits(u.photos.length)} عکس</span>
                </button>
                <button
                  onClick={() => setEditModalUserId(u.id)}
                  className="px-2 py-2 rounded-lg lux-btn-gold text-[10px] font-bold transition-all flex items-center justify-center gap-1 text-center"
                >
                  <UserCog className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">ویرایش مشخصات</span>
                </button>
                <button
                  onClick={() => setLockModalUserId(u.id)}
                  className={`px-2 py-2 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 text-center ${u.messageLockUntil && new Date(u.messageLockUntil) > new Date() ? "bg-[rgba(239,68,68,0.15)] text-[#f87171] border border-[rgba(239,68,68,0.3)]" : "lux-btn-gold"}`}
                >
                  <Lock className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">قفل پیام</span>
                </button>
                <UserActions
                  userId={u.id}
                  role={u.role}
                  isActive={u.isActive}
                  phoneVerified={u.phoneVerified}
                  isSpecial={u.isSpecial}
                  isFake={u.isFake}
                  canSetRole={canSetRole}
                  offset={1}
                />
                {canSetRole && !u.deletedAt && (
                  <button
                    type="button"
                    onClick={() => setDeleteModalUserId(u.id)}
                    className="px-2 py-2 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 bg-[rgba(239,68,68,0.12)] text-[#f87171] border border-[rgba(239,68,68,0.35)] hover:bg-[rgba(239,68,68,0.2)]"
                    title="حذف کامل کاربر (با ۳۰ روز مهلت بازیابی)"
                  >
                    <Trash2 className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">حذف کامل</span>
                  </button>
                )}
                {canSetRole && u.deletedAt && (
                  <button
                    type="button"
                    onClick={() => restoreUser(u.id)}
                    disabled={restoreBusyId === u.id}
                    className="px-2 py-2 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 lux-btn-gold disabled:opacity-50"
                    title={u.deletePurgeAfter ? `مهلت بازیابی تا ${formatDate(u.deletePurgeAfter)}` : "بازیابی کاربر"}
                  >
                    <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{restoreConfirmId === u.id ? "تایید بازیابی؟" : "بازیابی"}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {coinModalUserId && (() => {
          const user = users.find((u) => u.id === coinModalUserId);
          if (!user) return null;
          return (
            <UserCoinModal
              userId={user.id}
              currentBalance={user.wallet?.balance ?? 0}
              onClose={() => setCoinModalUserId(null)}
              onSuccess={() => {
                setCoinModalUserId(null);
                fetchUsers(0, true);
              }}
            />
          );
        })()}

        {subscriptionModalUserId && (() => {
          const user = users.find((u) => u.id === subscriptionModalUserId);
          if (!user) return null;
          return (
            <UserSubscriptionModal
              userId={user.id}
              subscription={user.subscription}
              onClose={() => setSubscriptionModalUserId(null)}
              onSuccess={() => {
                setSubscriptionModalUserId(null);
                fetchUsers(0, true);
              }}
            />
          );
        })()}

        {photosModalUserId && (() => {
          const user = users.find((u) => u.id === photosModalUserId);
          if (!user) return null;
          return (
            <AdminUserPhotosModal
              user={user}
              onClose={() => setPhotosModalUserId(null)}
              onUpdate={(userId, photos) => {
                setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, photos } : u)));
              }}
            />
          );
        })()}

        {editModalUserId && (() => {
          const user = users.find((u) => u.id === editModalUserId);
          if (!user) return null;
          return (
            <UserEditModal
              user={user}
              onClose={() => setEditModalUserId(null)}
              onSuccess={() => {
                setEditModalUserId(null);
                fetchUsers(0, true);
              }}
            />
          );
        })()}

        {lockModalUserId && (() => {
          const user = users.find((u) => u.id === lockModalUserId);
          if (!user) return null;
          return (
            <MessageLockModal
              userId={user.id}
              messageLockUntil={user.messageLockUntil}
              messageLockReason={user.messageLockReason}
              onClose={() => setLockModalUserId(null)}
              onSuccess={() => {
                setLockModalUserId(null);
                fetchUsers(0, true);
              }}
            />
          );
        })()}

        {deleteModalUserId && (() => {
          const user = users.find((u) => u.id === deleteModalUserId);
          if (!user) return null;
          return (
            <DeleteUserModal
              userId={user.id}
              displayName={`${user.firstName} ${user.lastName}`}
              username={user.username}
              onClose={() => setDeleteModalUserId(null)}
              onSuccess={() => {
                setUsers((prev) => prev.filter((u) => u.id !== user.id));
                fetchUsers(0, true);
              }}
            />
          );
        })()}

        {/* نقطه رهگیری برای لود بیشتر */}
        <div ref={loadMoreRef} className="py-4 flex justify-center">
          {loading && (
            <Loader2 className="w-5 h-5 animate-spin text-ig-gray" />
          )}
          {!loading && !hasMore && users.length > 0 && (
            <span className="text-xs text-ig-gray">پایان لیست</span>
          )}
        </div>
      </div>
    </div>
  );
}
