"use client";

// مدیریت کاربران — جستجو، فیلتر و لود به هنگام اسکرول
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Image from "next/image";
import { BadgeCheck, Ban, Search, Filter, X, Loader2, User, MapPin, Briefcase, Calendar, Crown, Phone, Image as ImageIcon, UserCog, Lock } from "lucide-react";
import VerifiedBadge from "@/components/dashboard/VerifiedBadge";
import { formatCoins, formatDate, toPersianDigits } from "@/lib/format";
import UserActions from "@/components/admin/UserActions";
import UserCoinModal from "@/components/admin/UserCoinModal";
import UserSubscriptionModal from "@/components/admin/UserSubscriptionModal";
import UserEditModal from "@/components/admin/UserEditModal";
import MessageLockModal from "@/components/admin/MessageLockModal";
import AdminUserPhotosModal from "@/components/admin/AdminUserPhotosModal";
import DefaultAvatar from "@/components/dashboard/DefaultAvatar";

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
  wallet: { balance: number;[key: string]: unknown } | null;
  photos: { id: string; url: string; isProfile: boolean }[];
};

type Props = {
  initialUsers: UserItem[];
  total: number;
  hasMore: boolean;
  canSetRole?: boolean;
};

const TAKE = 50;

export default function AdminUsersClient({ initialUsers, total, hasMore: initialHasMore, canSetRole = false }: Props) {
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
  const [showFilters, setShowFilters] = useState(false);
  const [coinModalUserId, setCoinModalUserId] = useState<string | null>(null);
  const [subscriptionModalUserId, setSubscriptionModalUserId] = useState<string | null>(null);
  const [photosModalUserId, setPhotosModalUserId] = useState<string | null>(null);
  const [editModalUserId, setEditModalUserId] = useState<string | null>(null);
  const [lockModalUserId, setLockModalUserId] = useState<string | null>(null);

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
    }>
  ) {
    const s = overrides?.search ?? search;
    const tab = overrides?.activeTab ?? activeTab;
    const gender = overrides?.genderFilter ?? genderFilter;
    const province = overrides?.provinceFilter ?? provinceFilter;
    const city = overrides?.cityFilter ?? cityFilter;
    const verified = overrides?.verifiedFilter ?? verifiedFilter;
    const active = overrides?.activeFilter ?? activeFilter;

    const p = new URLSearchParams();
    if (s) p.set("search", s);
    if (gender) p.set("gender", gender);
    if (province) p.set("province", province);
    if (city) p.set("city", city);
    if (verified) p.set("verified", verified);
    if (active) p.set("active", active);
    p.set("tab", tab);
    if (tab === "admins") p.set("admins", "true");
    p.set("take", String(TAKE));
    return p;
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

  // لیست استان ها و شهر های موجود
  const provinces = useMemo(() => {
    const set = new Set(users.map((u) => u.province).filter(Boolean));
    return Array.from(set).sort();
  }, [users]);

  const cities = useMemo(() => {
    const set = new Set(
      users
        .filter((u) => !provinceFilter || u.province === provinceFilter)
        .map((u) => u.city)
        .filter(Boolean)
    );
    return Array.from(set).sort();
  }, [users, provinceFilter]);

  const hasActiveFilters = genderFilter || provinceFilter || cityFilter || verifiedFilter || activeFilter;

  function clearFilters() {
    setGenderFilter("");
    setProvinceFilter("");
    setCityFilter("");
    setVerifiedFilter("");
    setActiveFilter("");
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

            {/* استان */}
            <select
              value={provinceFilter}
              onChange={(e) => {
                const value = e.target.value;
                setProvinceFilter(value);
                setCityFilter("");
                fetchUsers(0, true, { provinceFilter: value, cityFilter: "" });
              }}
              className="px-3 py-2 rounded-lg border border-[rgba(212,175,55,0.15)] bg-[#0d0d0d] text-[#e8e8e8] text-xs font-medium focus:outline-none focus:border-[rgba(212,175,55,0.4)]"
            >
              <option value="">همه استان ها</option>
              {provinces.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>

            {/* شهر */}
            <select
              value={cityFilter}
              onChange={(e) => {
                const value = e.target.value;
                setCityFilter(value);
                fetchUsers(0, true, { cityFilter: value });
              }}
              className="px-3 py-2 rounded-lg border border-[rgba(212,175,55,0.15)] bg-[#0d0d0d] text-[#e8e8e8] text-xs font-medium focus:outline-none focus:border-[rgba(212,175,55,0.4)]"
            >
              <option value="">همه شهرها</option>
              {cities.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
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
                    onClick={() => window.open(`/profile/${u.username}`, "_blank", "width=400,height=800")}
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
                    onClick={() => window.open(`/profile/${u.username}`, "_blank", "width=400,height=800")}
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
                  {u.firstName} {u.lastName}
                  {u.isVerified && <VerifiedBadge className="w-5 h-5" />}
                </p>
                {!u.isActive && (
                  <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded bg-red-50 text-[9px] text-ig-red font-bold">
                    <Ban className="w-2.5 h-2.5" />
                    مسدود
                  </span>
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
