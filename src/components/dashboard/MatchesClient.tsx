"use client";

// کلاینت صفحه پروفایل ها — فیلتر، تب، گرید
import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { MapPin, Ruler, Briefcase, Car, Heart, X, MessageCircle, Coins, User, ChevronRight, ChevronLeft } from "lucide-react";
import VerifiedBadge from "@/components/dashboard/VerifiedBadge";
import DefaultAvatar from "@/components/dashboard/DefaultAvatar";
import Portal from "@/components/ui/Portal";
import { toPersianDigits, formatToman } from "@/lib/format";
import SearchHeader from "@/components/dashboard/SearchHeader";
import MatchesFilters, { type Filters, defaultFilters, normalizeFilters } from "@/components/dashboard/MatchesFilters";
import { provinceOfCity } from "@/lib/iran";
import MatchModal from "@/components/dashboard/MatchModal";
import { useToast } from "@/components/ToastProvider";
import DailySuggestion from "@/components/dashboard/DailySuggestion";

export type Match = {
  id: string;
  firstName: string;
  username: string;
  gender: string;
  age: number;
  height: number;
  weight: number;
  province: string;
  city: string;
  neighborhood: string | null;
  job: string | null;
  carModel: string | null;
  income: number;
  isVerified: boolean;
  phoneVerified: boolean;
  isOnline: boolean;
  lastSeen: string;
  bio: string | null;
  createdAt: string;
  photos: { url: string; order: number; isProfile: boolean }[];
};

type Props = {
  currentCity: string;
  currentProvince: string;
  initialMatches: Match[];
  initialTotalPages: number;
};

// پنجره شماره صفحات برای نمایش — با سه نقطه برای صفحات زیاد
function pageWindow(current: number, totalPages: number): (number | "…")[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const near = new Set<number>([1, totalPages, current - 1, current, current + 1]);
  if (current <= 3) [2, 3, 4].forEach((n) => near.add(n));
  if (current >= totalPages - 2) [totalPages - 1, totalPages - 2, totalPages - 3].forEach((n) => near.add(n));
  const sorted = [...near].filter((n) => n >= 1 && n <= totalPages).sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  let prev = 0;
  for (const n of sorted) {
    if (prev && n - prev > 1) out.push("…");
    out.push(n);
    prev = n;
  }
  return out;
}

export default function MatchesClient({ currentCity, currentProvince, initialMatches, initialTotalPages }: Props) {
  // استان کاربر؛ اگر در پروفایل خالی باشد از روی شهر حدس زده می شود
  const userProvince = currentProvince || provinceOfCity(currentCity) || "ALL";
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>(initialMatches);
  const [loading, setLoading] = useState(false);
  const [photoModal, setPhotoModal] = useState<Match | null>(null);
  const [profileModal, setProfileModal] = useState<Match | null>(null);
  const [likeLoading, setLikeLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [showHeartAnim, setShowHeartAnim] = useState(false);
  const [filters, setFilters] = useState<Filters>(() => defaultFilters(currentCity, userProvince));
  const [matchedUser, setMatchedUser] = useState<Match | null>(null);
  const firstRun = useRef(true);
  const savedLoaded = useRef(false);
  const pendingSave = useRef(false);
  const touched = useRef(false);
  const { toast } = useToast();
  const queryRef = useRef("");
  const filtersRef = useRef<Filters | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  // شمارنده درخواست — فقط پاسخ آخرین درخواست اعمال می شود تا race condition پیش نیاید
  const requestSeq = useRef(0);
  const gridTopRef = useRef<HTMLDivElement>(null);

  // ساخت پارامترهای مشترک جستجو
  const buildParams = useCallback((f: Filters, q: string, page?: number) => {
    const params = new URLSearchParams({
      city: f.city,
      province: f.province,
      hasPhoto: String(f.hasPhoto),
    });
    if (q.trim()) params.set("q", q.trim());
    if (f.ageMin) params.set("ageMin", f.ageMin);
    if (f.ageMax) params.set("ageMax", f.ageMax);
    if (f.heightMin) params.set("heightMin", f.heightMin);
    if (f.heightMax) params.set("heightMax", f.heightMax);
    if (page) params.set("page", String(page));
    return params;
  }, []);

  const fetchMatches = useCallback(async (f: Filters, q: string, page = 1) => {
    const seq = ++requestSeq.current;
    setLoading(true);
    try {
      const params = buildParams(f, q, page);
      const res = await fetch(`/api/matches?${params}`);
      const data = await res.json();
      if (seq !== requestSeq.current) return;
      if (res.ok && data.matches) {
        // حذف موارد تکراری تا key هر کارت یکتا بماند
        const unique = [...new Map((data.matches as Match[]).map((m) => [m.id, m])).values()];
        setMatches(unique);
        setCurrentPage(data.page ?? page);
        setTotalPages(data.totalPages ?? 1);
      }
    } catch {
      // خطای شبکه
    } finally {
      if (seq === requestSeq.current) setLoading(false);
    }
  }, [buildParams]);

  // بارگذاری فیلترهای ذخیره شده کاربر (یک بار)
  useEffect(() => {
    fetch("/api/search/filters")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        // اگر کاربر قبل از رسیدن پاسخ فیلتر را تغییر داده، فیلتر ذخیره شده جایگزین نشود
        if (d?.filters && !touched.current) {
          // فیلترهای قدیمی ممکن است استان نداشته باشند — با مقادیر پیش فرض ادغام و نرمال می شوند
          const merged = normalizeFilters({ ...defaultFilters(currentCity, userProvince), ...d.filters });
          // در فیلترهای قدیمی «همه شهرها» یعنی همه کشور، نه همه شهرهای استان کاربر
          if (!d.filters.province && merged.city === "ALL") merged.province = "ALL";
          setFilters(merged);
        }
      })
      .catch(() => {})
      .finally(() => {
        savedLoaded.current = true;
        // اگر کاربر قبل از رسیدن پاسخ فیلتر را تغییر داده، ذخیره عقب افتاده انجام می شود
        if (pendingSave.current) {
          pendingSave.current = false;
          const f = filtersRef.current;
          if (f) {
            fetch("/api/search/filters", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) }).catch(() => {});
          }
        }
      });
  }, [currentCity, userProvince]);

  // با هر تغییر فیلتر: جستجوی دوباره
  useEffect(() => {
    filtersRef.current = filters;
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    void fetchMatches(filters, queryRef.current);
  }, [filters, fetchMatches]);

  // ذخیره خودکار فیلترها (debounce) — فقط تغییرات کاربر ذخیره می شود
  useEffect(() => {
    if (!touched.current) return;
    const t = setTimeout(() => {
      if (!savedLoaded.current) {
        // فیلترهای ذخیره شده هنوز نیامده اند؛ پس از رسیدن پاسخ GET ذخیره انجام می شود
        pendingSave.current = true;
        return;
      }
      fetch("/api/search/filters", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(filters) }).catch(() => {});
    }, 800);
    return () => clearTimeout(t);
  }, [filters]);

  // جستجوی متنی با debounce
  const handleSearch = useCallback((q: string) => {
    queryRef.current = q;
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      void fetchMatches(filtersRef.current ?? filters, q);
    }, 400);
  }, [fetchMatches, filters]);

  // رفتن به صفحه مشخص و اسکرول به ابتدای لیست
  const goToPage = useCallback((p: number) => {
    if (loading || p < 1 || p > totalPages || p === currentPage) return;
    void fetchMatches(filtersRef.current ?? filters, queryRef.current, p);
    gridTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [loading, totalPages, currentPage, fetchMatches, filters]);

  async function startChat(targetUserId: string) {
    setChatLoading(true);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId }),
      });
      const data = await res.json();
      // شرط تکمیل پروفایل حذف شد — فقط نیاز به اشتراک (402) بررسی می شود
      if (res.status === 402) {
        router.push("/dashboard/subscription");
        return;
      }
      if (res.ok && data.conversationId) {
        router.push(`/dashboard/chat/${data.conversationId}`);
        return;
      }
      toast(data.error ?? "شروع گفتگو ناموفق بود", "error");
    } catch {
      toast("خطا در ارتباط با سرور", "error");
    } finally {
      setChatLoading(false);
    }
  }

  async function sendLike(targetUserId: string) {
    if (likedIds.has(targetUserId)) return;
    setLikeLoading(true);
    setShowHeartAnim(true);
    setTimeout(() => setShowHeartAnim(false), 1000);
    setLikedIds((prev) => new Set(prev).add(targetUserId));
    const rollback = () => setLikedIds((prev) => { const s = new Set(prev); s.delete(targetUserId); return s; });
    try {
      const res = await fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: targetUserId, type: "LIKE" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        rollback();
        toast(data.error ?? "ثبت لایک ناموفق بود", "error");
      } else if (data.isMatch) {
        setMatchedUser(matches.find((m) => m.id === targetUserId) ?? null);
      }
    } catch {
      rollback();
      toast("خطا در ارتباط با سرور", "error");
    } finally {
      setLikeLoading(false);
    }
  }

  function openCoinTransfer(targetUserId: string) {
    setPhotoModal(null);
    router.push(`/dashboard/chat`);
    // انتقال سکه در چت انجام می شود
    void targetUserId;
  }

  return (
    <>
    <div>
      <SearchHeader onSearch={handleSearch} />
      <div ref={gridTopRef} className="px-1 md:px-6 pt-2 md:pt-8">
        {/* پیشنهاد امروز */}
        <div className="mb-3 md:mb-4">
          <DailySuggestion city={filters.city} province={filters.province} />
        </div>

        <MatchesFilters
          defaultCity={currentCity}
          defaultProvince={userProvince}
          value={filters}
          onChange={(f) => {
            touched.current = true;
            setFilters(f);
          }}
        />

        {matches.length === 0 ? (
          <div className="py-16 ig-fade-in">
            <div className="flex flex-col items-center justify-center text-center px-6">
              <div className="w-20 h-20 rounded-full bg-ig-btn2 flex items-center justify-center mb-4">
                <Heart className="w-10 h-10 text-neutral-400" strokeWidth={1.5} />
              </div>
              <h3 className="text-base font-bold text-foreground mb-1.5">
                {loading ? "در حال جستجو..." : "هیچ کاربری یافت نشد"}
              </h3>
              <p className="text-sm text-ig-gray leading-6 max-w-xs">
                فیلترها را تغییر دهید یا شهر دیگری را انتخاب کنید
              </p>
            </div>
          </div>
        ) : (
          /* گرید کارت های دایره ای — دو پروفایل در هر ردیف */
          <div className="grid grid-cols-2 gap-3 md:gap-4 mt-3">
            {matches.map((m) => {
              const profilePhoto = m.photos.find((p) => p.isProfile)?.url;
              const hasPhoto = !!profilePhoto;
              const isLiked = likedIds.has(m.id);
              return (
                <div
                  key={m.id}
                  className="group relative bg-surface rounded-2xl border border-ig-border ig-shadow-sm overflow-hidden flex flex-col items-center pt-4 pb-3 px-3 ig-fade-in"
                >
                  {/* عکس دایره ای وسط کارت — حدود ۷۰٪ عرض کارت */}
                  <div
                    role="button"
                    tabIndex={0}
                    aria-label={`عکس ${m.firstName}`}
                    className={`relative w-[68%] aspect-square rounded-full overflow-hidden bg-ig-gray-bg ring-1 ring-ig-border transition-transform duration-200 group-hover:scale-[1.02] ${hasPhoto ? "cursor-pointer active:scale-95" : ""}`}
                    onClick={() => hasPhoto && setPhotoModal(m)}
                    onKeyDown={(e) => {
                      if (hasPhoto && (e.key === "Enter" || e.key === " ")) setPhotoModal(m);
                    }}
                  >
                    {hasPhoto ? (
                      <Image
                        src={profilePhoto!}
                        alt={m.firstName}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 34vw, 220px"
                      />
                    ) : (
                      <DefaultAvatar size={80} className="!w-full !h-full" />
                    )}
                    {m.isOnline && (
                      <span className="absolute bottom-[8%] right-[8%] w-4 h-4 bg-ig-online rounded-full border-2 border-white ig-pulse" />
                    )}
                    {isLiked && (
                      <span className="absolute top-[7%] left-[9%] w-7 h-7 rounded-full bg-surface/95 flex items-center justify-center ig-shadow-sm">
                        <Heart className="w-3.5 h-3.5 text-ig-red" fill="currentColor" strokeWidth={0} />
                      </span>
                    )}
                  </div>

                  {/* نام و مشخصات — باز کردن مودال پروفایل */}
                  <button
                    className="mt-2.5 w-full min-w-0 cursor-pointer transition-transform active:scale-95"
                    onClick={() => setProfileModal(m)}
                  >
                    <p className="text-sm font-bold text-foreground flex items-center justify-center gap-1">
                      <span className="truncate">{m.firstName}</span>
                      {m.isVerified && <VerifiedBadge className="w-4 h-4 shrink-0" />}
                    </p>
                    <p className="text-xs text-foreground/60 mt-0.5">
                      {m.age ? `${toPersianDigits(m.age)} ساله` : ""}
                    </p>
                    <p className="text-[11px] text-foreground/40 leading-4 line-clamp-1 mt-0.5 flex items-center justify-center gap-0.5">
                      <MapPin className="w-3 h-3 shrink-0" aria-hidden />
                      {m.province ? `${m.province}، ${m.city}` : m.city}
                    </p>
                  </button>

                  {/* دکمه های اکشن */}
                  <div className="w-full flex items-center gap-1.5 mt-3 pt-3 border-t border-ig-divider">
                    <button
                      onClick={() => startChat(m.id)}
                      disabled={chatLoading}
                      className="flex-1 h-8 rounded-lg bg-ig-blue text-white text-xs font-bold flex items-center justify-center gap-1 hover:bg-ig-blue-hover active:scale-95 transition-all disabled:opacity-50"
                    >
                      <MessageCircle className="w-3.5 h-3.5" aria-hidden />
                      گفتگو
                    </button>
                    <button
                      onClick={() => sendLike(m.id)}
                      disabled={likeLoading || isLiked}
                      aria-label={isLiked ? "لایک شد" : "لایک"}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center active:scale-95 transition-all disabled:opacity-50 ${
                        isLiked ? "bg-ig-red text-white" : "bg-ig-gray-bg text-ig-red hover:bg-neutral-200"
                      }`}
                    >
                      <Heart className="w-4 h-4" fill={isLiked ? "currentColor" : "none"} strokeWidth={2} aria-hidden />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* صفحه بندی شماره ای */}
        {totalPages > 1 && (
          <nav className="flex items-center justify-center gap-1.5 md:gap-2 py-6 md:py-8 ig-fade-in" aria-label="صفحه بندی">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={loading || currentPage === 1}
              aria-label="صفحه قبلی"
              className="cursor-pointer w-9 h-9 md:w-10 md:h-10 rounded-xl bg-ig-gray-bg flex items-center justify-center text-foreground hover:bg-neutral-200 transition-colors disabled:opacity-40 disabled:cursor-default"
            >
              <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
            </button>
            {pageWindow(currentPage, totalPages).map((p, i) =>
              p === "…" ? (
                <span key={`dots-${i}`} className="w-8 text-center text-ig-gray text-sm select-none">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => goToPage(p)}
                  disabled={loading}
                  aria-current={p === currentPage ? "page" : undefined}
                  className={`cursor-pointer min-w-9 h-9 md:min-w-10 md:h-10 px-2 rounded-xl text-sm font-bold transition-colors disabled:cursor-default ${
                    p === currentPage
                      ? "bg-ig-blue text-white ig-shadow-sm"
                      : "bg-ig-gray-bg text-foreground hover:bg-neutral-200 disabled:opacity-60"
                  }`}
                >
                  {toPersianDigits(p)}
                </button>
              )
            )}
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={loading || currentPage === totalPages}
              aria-label="صفحه بعدی"
              className="cursor-pointer w-9 h-9 md:w-10 md:h-10 rounded-xl bg-ig-gray-bg flex items-center justify-center text-foreground hover:bg-neutral-200 transition-colors disabled:opacity-40 disabled:cursor-default"
            >
              <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </nav>
        )}
      </div>

      {/* مودال مشاهده پروفایل */}
      {profileModal && (
        <Portal>
        <div
          className="fixed inset-0 z-50 bg-black/60 ig-glass flex items-center justify-center p-4 ig-fade-in"
          onClick={() => setProfileModal(null)}
        >
          <div
            className="bg-surface rounded-2xl max-w-md w-full ig-modal-in overflow-hidden ig-shadow-lg max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* هدر با عکس */}
            <div className="relative p-6 bg-ig-gray-bg shrink-0">
              <button
                onClick={() => setProfileModal(null)}
                className="cursor-pointer absolute top-3 left-3 w-8 h-8 rounded-full bg-surface/80 hover:bg-surface flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-foreground" />
              </button>
              <div className="flex flex-col items-center text-center">
                <div
                  className={`w-24 h-24 rounded-full mb-3 relative ig-shadow-lg overflow-hidden flex items-center justify-center ${profileModal.photos.find((p) => p.isProfile)?.url ? "cursor-pointer" : ""}`}
                  onClick={() => profileModal.photos.find((p) => p.isProfile)?.url && setPhotoModal(profileModal)}
                >
                  {profileModal.photos.find((p) => p.isProfile)?.url ? (
                    <div className="relative w-full h-full">
                      <Image src={profileModal.photos.find((p) => p.isProfile)!.url} alt={profileModal.firstName} fill className="object-cover" sizes="96px" />
                    </div>
                  ) : (
                    <DefaultAvatar size={96} />
                  )}
                  {profileModal.isOnline && (
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-ig-blue rounded-full border-2 border-white ig-pulse" />
                  )}
                </div>
                <p className="font-bold flex items-center gap-1 text-lg">
                  {profileModal.firstName}
                  {profileModal.isVerified && <VerifiedBadge className="w-5 h-5" />}
                </p>
                <p className="text-xs text-ig-gray mt-1">
                  {profileModal.age ? `${toPersianDigits(profileModal.age)} ساله` : ""} · {profileModal.city}
                </p>
              </div>
            </div>

            {/* بدنه */}
            <div className="p-5 space-y-3 overflow-y-auto">
              {profileModal.bio && (
                <p className="text-sm text-foreground leading-6 bg-ig-gray-bg rounded-xl p-3">{profileModal.bio}</p>
              )}
              <div className="grid grid-cols-2 gap-2">
                {profileModal.height && (
                  <div className="flex items-center gap-2 text-xs text-ig-gray bg-ig-gray-bg rounded-lg px-3 py-2">
                    <Ruler className="w-4 h-4 shrink-0" />
                    قد {toPersianDigits(profileModal.height)} cm
                  </div>
                )}
                {profileModal.job && (
                  <div className="flex items-center gap-2 text-xs text-ig-gray bg-ig-gray-bg rounded-lg px-3 py-2">
                    <Briefcase className="w-4 h-4 shrink-0" />
                    {profileModal.job}
                  </div>
                )}
                {profileModal.carModel && (
                  <div className="flex items-center gap-2 text-xs text-ig-gray bg-ig-gray-bg rounded-lg px-3 py-2">
                    <Car className="w-4 h-4 shrink-0" />
                    {profileModal.carModel}
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs text-ig-gray bg-ig-gray-bg rounded-lg px-3 py-2">
                  <MapPin className="w-4 h-4 shrink-0" />
                  {profileModal.neighborhood ? profileModal.neighborhood : profileModal.city}
                </div>
              </div>

              {profileModal.income > 0 && (
                <div className="text-xs text-ig-gray">
                  درآمد: {formatToman(profileModal.income)}
                </div>
              )}

              {/* دکمه های اکشن */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => startChat(profileModal.id)}
                  disabled={chatLoading}
                  className="flex-1 py-2.5 rounded-xl bg-ig-blue text-white text-sm font-bold flex items-center justify-center gap-1.5 hover:bg-ig-blue-hover active:scale-95 transition-all disabled:opacity-50"
                >
                  <MessageCircle className="w-4 h-4" />
                  {chatLoading ? "..." : "گفتگو"}
                </button>
                <button
                  onClick={() => sendLike(profileModal.id)}
                  disabled={likeLoading || likedIds.has(profileModal.id)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all disabled:opacity-50 ${
                    likedIds.has(profileModal.id)
                      ? "bg-ig-red text-white"
                      : "bg-ig-gray-bg text-ig-red hover:bg-neutral-200"
                  }`}
                >
                  <Heart className="w-4 h-4" fill={likedIds.has(profileModal.id) ? "currentColor" : "none"} />
                  {likedIds.has(profileModal.id) ? "لایک شد" : "لایک"}
                </button>
              </div>
            </div>
          </div>
        </div>
        </Portal>
      )}

      {/* مودال بزرگ عکس پروفایل */}
      {photoModal && (
        <Portal>
        <div
          className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4 ig-fade-in"
          onClick={() => setPhotoModal(null)}
        >
          <div
            className="relative max-w-sm w-full ig-modal-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* دکمه ضربدر */}
            <button
              onClick={() => setPhotoModal(null)}
              className="absolute -top-3 -right-3 z-10 w-9 h-9 rounded-full bg-surface ig-shadow-lg flex items-center justify-center active:scale-90 transition-transform"
            >
              <X className="w-5 h-5 text-foreground" />
            </button>

            {/* عکس بزرگ */}
            <div className="rounded-2xl overflow-hidden ig-shadow-lg relative aspect-square">
              <Image
                src={photoModal.photos.find((p) => p.isProfile)?.url ?? photoModal.photos[0]?.url ?? ""}
                alt={photoModal.firstName}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 90vw, 384px"
                priority
              />

              {/* انیمیشن قلب لایک */}
              {showHeartAnim && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <Heart
                    className="w-24 h-24 text-white ig-double-tap-heart"
                    fill="currentColor"
                    strokeWidth={1}
                  />
                </div>
              )}

              {/* نام روی عکس */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 pt-12">
                <p className="text-white font-bold text-lg flex items-center gap-1.5">
                  {photoModal.firstName}
                  {photoModal.isVerified && <VerifiedBadge className="w-5 h-5" />}
                </p>
                <p className="text-white/80 text-xs">
                  {toPersianDigits(photoModal.age)} ساله · {photoModal.city}
                </p>
              </div>

              {/* دکمه ها روی عکس */}
              <div className="absolute bottom-0 left-0 right-0 flex items-center gap-2.5 pb-5 justify-end pr-8 pl-4">
                <button
                  onClick={() => startChat(photoModal.id)}
                  disabled={chatLoading}
                  className="w-11 h-11 rounded-full bg-surface hover:bg-ig-btn2 text-foreground flex items-center justify-center ig-shadow-lg active:scale-90 transition-all disabled:opacity-50"
                  title="گفتگو"
                >
                  <MessageCircle className="w-5 h-5" />
                </button>
                <button
                  onClick={() => sendLike(photoModal.id)}
                  disabled={likeLoading || likedIds.has(photoModal.id)}
                  className="w-11 h-11 rounded-full bg-surface hover:bg-ig-btn2 text-foreground flex items-center justify-center ig-shadow-lg active:scale-90 transition-all disabled:opacity-50"
                  title="لایک"
                >
                  <Heart className="w-5 h-5" fill={likedIds.has(photoModal.id) ? "currentColor" : "none"} strokeWidth={2} />
                </button>
                <button
                  onClick={() => openCoinTransfer(photoModal.id)}
                  className="w-11 h-11 rounded-full bg-surface hover:bg-ig-btn2 text-foreground flex items-center justify-center ig-shadow-lg active:scale-90 transition-all"
                  title="انتقال سکه"
                >
                  <Coins className="w-5 h-5" />
                </button>
                <button
                  onClick={() => router.push(`/profile/${photoModal.username}`)}
                  className="w-11 h-11 rounded-full bg-surface hover:bg-ig-btn2 text-foreground flex items-center justify-center ig-shadow-lg active:scale-90 transition-all"
                  title="مشاهده پروفایل"
                >
                  <User className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
        </Portal>
      )}
    </div>
      <MatchModal
        open={!!matchedUser}
        onClose={() => setMatchedUser(null)}
        onStartChat={() => {
          const id = matchedUser?.id;
          setMatchedUser(null);
          if (id) void startChat(id);
        }}
        starting={chatLoading}
        otherName={matchedUser?.firstName ?? ""}
        otherPhoto={matchedUser?.photos.find((p) => p.isProfile)?.url ?? matchedUser?.photos[0]?.url ?? null}
        myPhoto={null}
      />
    </>
  );
}
