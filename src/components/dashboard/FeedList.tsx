"use client";

// لیست بی نهایت فید: صفحه بندی سروری با seed پایدار، تلاش مجدد در خطا، حذف کارت پس از «نشان نده»
import { useState, useRef, useEffect, useCallback } from "react";
import { Loader2 } from "lucide-react";
import FeedCard, { type FeedMatch } from "@/components/dashboard/FeedCard";
import Button from "@/components/ui/Button";

const SEED_COOKIE = "kandoo_feed_seed";
const SEED_TTL = 30 * 60;

export default function FeedList({
  initialItems,
  initialOffset,
  initialHasMore,
  seed,
  myPhoto = null,
}: {
  initialItems: FeedMatch[];
  initialOffset: number;
  initialHasMore: boolean;
  seed: string;
  myPhoto?: string | null;
}) {
  const [items, setItems] = useState<FeedMatch[]>(initialItems);
  const [offset, setOffset] = useState(initialOffset);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const busy = useRef(false);

  // ذخیره seed برای ۳۰ دقیقه تا ترتیب فید با رفرش عوض نشود
  useEffect(() => {
    document.cookie = `${SEED_COOKIE}=${seed}; path=/; max-age=${SEED_TTL}; samesite=lax`;
  }, [seed]);

  const loadMore = useCallback(async () => {
    if (busy.current || !hasMore) return;
    busy.current = true;
    setLoading(true);
    setFailed(false);
    try {
      const res = await fetch(`/api/feed/home?seed=${seed}&offset=${offset}`);
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      setItems((prev) => {
        const seen = new Set(prev.map((m) => m.id));
        return [...prev, ...(data.items as FeedMatch[]).filter((m) => !seen.has(m.id))];
      });
      setOffset(data.nextOffset);
      setHasMore(data.hasMore);
    } catch {
      setFailed(true);
    } finally {
      busy.current = false;
      setLoading(false);
    }
  }, [hasMore, offset, seed]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || failed) return;
    const io = new IntersectionObserver((e) => e[0].isIntersecting && loadMore(), { rootMargin: "400px" });
    io.observe(el);
    return () => io.disconnect();
  }, [loadMore, failed]);

  return (
    <div>
      {items.map((m) => (
        <FeedCard key={m.id} match={m} isLiked={m.liked} myPhoto={myPhoto} onHidden={(id) => setItems((p) => p.filter((x) => x.id !== id))} />
      ))}

      {hasMore && (
        <div ref={sentinelRef} className="flex items-center justify-center py-8 min-h-24">
          {failed ? (
            <div className="text-center space-y-2">
              <p className="text-sm text-ig-gray">بارگذاری ادامه فید ناموفق بود</p>
              <Button variant="secondary" size="sm" onClick={loadMore}>
                تلاش مجدد
              </Button>
            </div>
          ) : loading ? (
            <div className="flex items-center gap-2 text-ig-gray" role="status">
              <Loader2 className="w-5 h-5 animate-spin" aria-hidden />
              <span className="text-sm">در حال بارگذاری...</span>
            </div>
          ) : null}
        </div>
      )}

      {!hasMore && items.length > 10 && (
        <div className="flex items-center justify-center py-8">
          <span className="text-sm text-ig-gray">همه پروفایل ها نمایش داده شدند</span>
        </div>
      )}
    </div>
  );
}
