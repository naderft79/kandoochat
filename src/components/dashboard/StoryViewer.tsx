"use client";

// مودال مشاهده استوری — full-screen با طراحی اینستاگرامی
// شامل: لایک، ریپلای، انیمیشن قلب، caption، hold to pause، منوی سه نقطه، اشتراک
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  X, Eye, Trash2, Heart, MoreHorizontal, Clock,
  Coins, MessageCircle, Flag, Crown, Gift, Loader2,
} from "lucide-react";
import DefaultAvatar from "@/components/dashboard/DefaultAvatar";
import VerifiedBadge from "@/components/dashboard/VerifiedBadge";
import { toPersianDigits, formatTime } from "@/lib/format";
import Portal from "@/components/ui/Portal";

type StoryElement = {
  id: string;
  type: "text" | "coinButton" | "sticker";
  text: string;
  x: number;
  y: number;
  scale: number;
  color: string;
  bgColor: string | null;
  fontSize: number;
  bold: boolean;
  italic: boolean;
  rotation: number;
};

type StoryElements = {
  elements: StoryElement[];
  strokes: { points: { x: number; y: number }[]; color: string; width: number }[];
  filter: string;
};

type StoryItem = {
  id: string;
  url: string;
  type: string;
  caption?: string | null;
  elements?: string | null;
  filter?: string | null;
  createdAt: string;
  viewed: boolean;
  liked?: boolean;
  likeCount?: number;
  viewCount?: number;
  isApproved?: boolean;
};

type UserStory = {
  userId: string;
  firstName: string;
  username: string;
  isVerified: boolean;
  isGolden?: boolean;
  photo: string | null;
  stories: StoryItem[];
};

type Props = {
  userStories: UserStory[];
  initialIndex: number;
  onClose: () => void;
  onStoriesChange?: () => void;
  currentUserId?: string;
  hasSubscription?: boolean;
};

const STORY_DURATION = 5000;

// کامپوننت رندر نقاشی استوری روی canvas
function StoryDrawingCanvas({ strokes }: {
  strokes: { points: { x: number; y: number }[]; color: string; width: number }[];
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    function render() {
      if (!canvasRef.current || !parent) return;
      const rect = parent.getBoundingClientRect();
      canvasRef.current.width = rect.width;
      canvasRef.current.height = rect.height;
      const ctx = canvasRef.current.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      for (const stroke of strokes) {
        if (!stroke || !stroke.points || stroke.points.length < 2) continue;
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.width;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        const pts = stroke.points;
        ctx.moveTo((pts[0].x / 100) * canvasRef.current.width, (pts[0].y / 100) * canvasRef.current.height);
        for (let i = 1; i < pts.length; i++) {
          ctx.lineTo((pts[i].x / 100) * canvasRef.current.width, (pts[i].y / 100) * canvasRef.current.height);
        }
        ctx.stroke();
      }
    }

    render();
    const ro = new ResizeObserver(render);
    ro.observe(parent);
    return () => ro.disconnect();
  }, [strokes]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-15"
    />
  );
}

export default function StoryViewer({
  userStories, initialIndex, onClose, onStoriesChange,
  currentUserId, hasSubscription,
}: Props) {
  const router = useRouter();
  const [userIndex, setUserIndex] = useState(initialIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [showHeart, setShowHeart] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replySent, setReplySent] = useState(false);
  const [slideDirection, setSlideDirection] = useState<"next" | "prev" | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showSubModal, setShowSubModal] = useState(false);
  // مودال انتقال سکه
  const [showCoinModal, setShowCoinModal] = useState(false);
  const [coinAmount, setCoinAmount] = useState("");
  const [coinMsg, setCoinMsg] = useState("");
  const [coinSending, setCoinSending] = useState(false);
  const [coinResult, setCoinResult] = useState<{ ok: boolean; text: string } | null>(null);
  // swipe سه بعدی
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef(0);
  const viewedRef = useRef<Set<string>>(new Set());
  const lastTapRef = useRef<number>(0);

  const currentUser = userStories[userIndex];
  const currentStory = currentUser?.stories[storyIndex];
  const isMyStory = currentUser?.userId === "me" || currentUser?.userId === currentUserId;
  // تعداد بازدید فقط برای استوری خودم نمایش داده می شود
  const viewCount = isMyStory ? currentStory?.viewCount ?? null : null;

  const registerView = useCallback(async (storyId: string) => {
    if (viewedRef.current.has(storyId)) return;
    viewedRef.current.add(storyId);
    try {
      await fetch(`/api/stories/${storyId}/view`, { method: "POST" });
    } catch {}
  }, []);

  const toggleLike = useCallback(async () => {
    if (!currentStory || isMyStory) return;
    try {
      const res = await fetch(`/api/stories/${currentStory.id}/like`, { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        setLiked(data.liked);
        setLikeCount((prev) => (data.liked ? prev + 1 : Math.max(0, prev - 1)));
      }
    } catch {}
  }, [currentStory, isMyStory]);

  const sendReply = useCallback(async () => {
    if (!currentStory || !replyText.trim() || isMyStory) return;
    setPaused(true);
    try {
      const res = await fetch(`/api/stories/${currentStory.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyText.trim() }),
      });
      const data = await res.json();
      if (res.status === 402) {
        setShowSubModal(true);
        setPaused(false);
        return;
      }
      // شرط تکمیل پروفایل حذف شد — فقط نیاز به اشتراک (402) بررسی می شود
      if (data.ok) {
        setReplyText("");
        setReplySent(true);
        setTimeout(() => {
          setReplySent(false);
          setPaused(false);
          // رفتن به صفحه چت
          if (data.conversationId) {
            router.push(`/dashboard/chat/${data.conversationId}`);
          }
        }, 1200);
      }
    } catch {
      setPaused(false);
    }
  }, [currentStory, replyText, isMyStory, router]);

  // ریست وضعیت هنگام تغییر استوری — در زمان رندر (الگوی رسمی ری‌اکت)
  const storyKey = userIndex * 1000 + storyIndex;
  const [lastStoryKey, setLastStoryKey] = useState(storyKey);
  if (storyKey !== lastStoryKey) {
    setLastStoryKey(storyKey);
    setLiked(currentStory?.liked ?? false);
    setLikeCount(currentStory?.likeCount ?? 0);
    setReplyText("");
    setReplySent(false);
    setShowMenu(false);
    setProgress(0);
    progressRef.current = 0;
  }

  // تایمر پیشرفت — pause قابل کنترل
  useEffect(() => {
    if (!currentStory || paused) return;
    if (!isMyStory) registerView(currentStory.id);
    const startTime = Date.now() - (progressRef.current / 100) * STORY_DURATION;
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, (elapsed / STORY_DURATION) * 100);
      progressRef.current = pct;
      setProgress(pct);
      if (pct >= 100) {
        if (timerRef.current) clearInterval(timerRef.current);
        goToNext();
      }
    }, 50);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
    // goToNext و registerView عمدا خارج از وابستگی ها هستند تا تایمر با هر رندر ریست نشود
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userIndex, storyIndex, paused]);

  function goToNext() {
    if (!currentUser) return;
    setSlideDirection("next");
    setTimeout(() => setSlideDirection(null), 300);
    if (storyIndex < currentUser.stories.length - 1) {
      setStoryIndex(storyIndex + 1);
    } else if (userIndex < userStories.length - 1) {
      setUserIndex(userIndex + 1);
      setStoryIndex(0);
    } else {
      onClose();
    }
  }

  function goToPrev() {
    setSlideDirection("prev");
    setTimeout(() => setSlideDirection(null), 300);
    if (storyIndex > 0) {
      setStoryIndex(storyIndex - 1);
    } else if (userIndex > 0) {
      const prevUser = userStories[userIndex - 1];
      setUserIndex(userIndex - 1);
      setStoryIndex(prevUser.stories.length - 1);
    }
  }

  function handleStoryTap() {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      if (!isMyStory && !liked) toggleLike();
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 800);
    }
    lastTapRef.current = now;
  }

  // hold to pause
  function handlePressStart() {
    setPaused(true);
  }
  function handlePressEnd() {
    setPaused(false);
  }

  async function deleteStory() {
    if (!currentStory || !isMyStory) return;
    try {
      await fetch(`/api/stories?id=${currentStory.id}`, { method: "DELETE" });
      if (onStoriesChange) onStoriesChange();
      if (storyIndex < currentUser.stories.length - 1) {
        setStoryIndex(storyIndex);
      } else if (userIndex < userStories.length - 1) {
        setUserIndex(userIndex + 1);
        setStoryIndex(0);
      } else {
        onClose();
      }
    } catch {}
  }

  async function startChat() {
    if (!currentUser || isMyStory) return;
    setShowMenu(false);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: currentUser.userId }),
      });
      const data = await res.json();
      if (res.status === 402) {
        setShowSubModal(true);
        return;
      }
      // شرط تکمیل پروفایل حذف شد — فقط نیاز به اشتراک (402) بررسی می شود
      if (data.conversationId) {
        router.push(`/dashboard/chat/${data.conversationId}`);
      }
    } catch {}
  }

  // گزارش تخلف — ارسال مستقیم به API
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportSent, setReportSent] = useState(false);

  function reportUser() {
    if (!currentUser) return;
    setShowMenu(false);
    setShowReportModal(true);
    setReportReason("");
    setReportSent(false);
  }

  async function submitReport() {
    if (!currentUser || !reportReason) return;
    try {
      await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportedId: currentUser.userId, reason: reportReason }),
      });
      setReportSent(true);
      setTimeout(() => setShowReportModal(false), 1500);
    } catch {}
  }

  function viewProfile() {
    if (!currentUser) return;
    setShowMenu(false);
    router.push(`/profile/${currentUser.username}`);
  }

  // باز کردن مودال انتقال سکه
  function openCoinModal(fromButton = false) {
    void fromButton; // در حال حاضر هر دو مسیر رفتار یکسان دارند
    if (!currentUser || isMyStory) return;
    setShowMenu(false);
    setShowCoinModal(true);
    setCoinAmount("");
    setCoinMsg("");
    setCoinResult(null);
    setPaused(true);
  }

  // پارس عناصر استوری
  function parseStoryElements(raw: string | null | undefined): StoryElement[] {
    if (!raw) return [];
    try {
      const parsed: StoryElements = JSON.parse(raw);
      return parsed.elements || [];
    } catch {
      return [];
    }
  }

  // پارس نقاشی استوری
  function parseStoryStrokes(raw: string | null | undefined) {
    if (!raw) return [];
    try {
      const parsed: StoryElements = JSON.parse(raw);
      return parsed.strokes || [];
    } catch {
      return [];
    }
  }

  // فیلتر CSS استوری
  function getFilterCss(filterId: string | null | undefined): string | undefined {
    if (!filterId || filterId === "none") return undefined;
    const filters: Record<string, string> = {
      grayscale: "grayscale(1)",
      sepia: "sepia(0.8)",
      warm: "saturate(1.4) hue-rotate(-10deg) brightness(1.1)",
      cool: "saturate(1.2) hue-rotate(15deg) brightness(1.05)",
      vintage: "sepia(0.4) contrast(1.2) brightness(0.9)",
      vivid: "saturate(2) contrast(1.1)",
      fade: "contrast(0.8) brightness(1.1) saturate(0.7)",
      noir: "grayscale(1) contrast(1.4) brightness(0.9)",
      drama: "contrast(1.5) saturate(1.3) brightness(0.95)",
    };
    return filters[filterId];
  }

  // ارسال هدیه سکه
  async function sendCoinGift() {
    if (!currentUser || !coinAmount) return;
    const coins = parseInt(coinAmount, 10);
    if (!coins || coins < 1) return;
    setCoinSending(true);
    setCoinResult(null);
    try {
      const res = await fetch("/api/transfer/gift", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: currentUser.userId, coins, message: coinMsg || undefined }),
      });
      const data = await res.json();
      if (res.ok) {
        setCoinResult({ ok: true, text: `${toPersianDigits(data.coins)} سکه هدیه داده شد` });
        setTimeout(() => {
          setShowCoinModal(false);
          setPaused(false);
          if (data.conversationId) {
            router.push(`/dashboard/chat/${data.conversationId}`);
          }
        }, 1200);
      } else {
        setCoinResult({ ok: false, text: data.error || "خطایی رخ داد" });
      }
    } catch {
      setCoinResult({ ok: false, text: "خطای شبکه" });
    } finally {
      setCoinSending(false);
    }
  }

  // --- swipe سه بعدی بین استوری ها ---
  function handleDragStart(e: React.MouseEvent | React.TouchEvent) {
    const x = "touches" in e ? e.touches[0].clientX : e.clientX;
    const y = "touches" in e ? e.touches[0].clientY : e.clientY;
    dragStartRef.current = { x, y };
    setDragging(true);
  }

  function handleDragMove(e: React.MouseEvent | React.TouchEvent) {
    if (!dragging || !dragStartRef.current) return;
    const x = "touches" in e ? e.touches[0].clientX : e.clientX;
    const dx = x - dragStartRef.current.x;
    setDragX(dx);
  }

  function handleDragEnd() {
    if (!dragging) return;
    setDragging(false);
    const threshold = 80;
    if (dragX > threshold) {
      goToPrev();
    } else if (dragX < -threshold) {
      goToNext();
    }
    setDragX(0);
    dragStartRef.current = null;
  }

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (showMenu) { setShowMenu(false); return; }
        if (showSubModal) { setShowSubModal(false); return; }
        if (showCoinModal) { setShowCoinModal(false); return; }
        if (showReportModal) { setShowReportModal(false); return; }
        onClose();
      }
      if (e.key === "ArrowRight") goToPrev();
      if (e.key === "ArrowLeft") goToNext();
      if (e.key === " ") { e.preventDefault(); setPaused((p) => !p); }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
    // توابع ناوبری در هر رندر بازسازی می شوند؛ اضافه کردن آن ها باعث ریست بی مورد لیسنر می شود
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storyIndex, userIndex, showMenu, showSubModal, showCoinModal, showReportModal]);

  if (!currentUser || !currentStory) {
    onClose();
    return null;
  }

  return (
    <>
    <Portal>
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center ig-fade-in overflow-hidden">
      <div
        className="relative w-full h-full max-w-md mx-auto overflow-hidden"
        style={{
          transform: dragging
            ? `translateX(${dragX}px) scale(${1 - Math.min(Math.abs(dragX) / 400, 0.25)}) rotateY(${dragX * 0.05}deg)`
            : slideDirection === "next"
            ? "translateX(-30px) scale(0.95)"
            : slideDirection === "prev"
            ? "translateX(30px) scale(0.95)"
            : "translateX(0) scale(1)",
          transition: dragging ? "none" : "transform 0.3s ease-out, opacity 0.3s ease-out",
          opacity: dragging ? 1 - Math.min(Math.abs(dragX) / 300, 0.5) : slideDirection ? 0.5 : 1,
          transformStyle: "preserve-3d",
          perspective: "1000px",
        }}
        onMouseDown={handleDragStart}
        onMouseMove={dragging ? handleDragMove : undefined}
        onMouseUp={handleDragEnd}
        onMouseLeave={dragging ? handleDragEnd : undefined}
        onTouchStart={handleDragStart}
        onTouchMove={dragging ? handleDragMove : undefined}
        onTouchEnd={handleDragEnd}
      >
        {currentStory.type === "VIDEO" ? (
          <video src={currentStory.url} autoPlay muted loop className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
        ) : (
          <Image src={currentStory.url} alt={currentUser.firstName} fill className="object-cover pointer-events-none" sizes="(max-width: 768px) 100vw, 448px" style={{ filter: getFilterCss(currentStory.filter) }} priority />
        )}

        <div className="absolute top-0 left-0 right-0 h-36 bg-gradient-to-b from-black/70 to-transparent z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black/80 to-transparent z-10 pointer-events-none" />

        {showHeart && (
          <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
            <Heart className="text-white fill-white ig-heart-pop" style={{ width: 100, height: 100, filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.5))" }} />
          </div>
        )}

        {/* نوار پیشرفت + هدر */}
        <div className="absolute top-0 left-0 right-0 z-20 pt-[max(0.75rem,env(safe-area-inset-top))] px-3">
          <div className="flex gap-1 mb-3">
            {currentUser.stories.map((s, i) => (
              <div key={s.id} className="flex-1 h-[3px] bg-surface/30 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${currentUser.isGolden ? "bg-ig-gold" : "bg-surface"}`}
                  style={{
                    width: i < storyIndex ? "100%" : i === storyIndex ? `${progress}%` : "0%",
                    transition: i === storyIndex && paused ? "none" : i === storyIndex ? "width 0.05s linear" : "none",
                  }}
                />
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={`w-9 h-9 rounded-full overflow-hidden bg-surface/20 ${currentUser.isGolden ? "ring-2 ring-ig-border" : "ring-2 ring-white/30"}`}>
                {currentUser.photo ? (
                  <div className="relative w-full h-full">
                    <Image src={currentUser.photo} alt={currentUser.firstName} fill className="object-cover" sizes="36px" />
                  </div>
                ) : (
                  <DefaultAvatar size={36} />
                )}
              </div>
              <div>
                <p className="text-sm font-bold text-white flex items-center gap-1">
                  {currentUser.firstName}
                  {currentUser.isGolden && <Crown className="w-3.5 h-3.5 text-ig-gold" fill="currentColor" />}
                  {currentUser.isVerified && <VerifiedBadge className="w-3.5 h-3.5" />}
                </p>
                <p className="text-xs text-white/70">{formatTime(currentStory.createdAt)}</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {isMyStory && viewCount !== null && (
                <span className="flex items-center gap-1 text-xs text-white/80 px-2 py-1 rounded-full bg-surface/10">
                  <Eye className="w-3.5 h-3.5" />
                  {toPersianDigits(viewCount)}
                </span>
              )}
              {isMyStory && (
                <button onClick={deleteStory} className="p-2 rounded-full hover:bg-surface/20 transition-colors">
                  <Trash2 className="w-5 h-5 text-white" />
                </button>
              )}
              <button onClick={onClose} className="p-2 rounded-full hover:bg-surface/20 transition-colors">
                <X className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* عناصر روی استوری (دکمه سکه و متن) */}
        {/* canvas نقاشی */}
        {(() => {
          const storyStrokes = parseStoryStrokes(currentStory.elements);
          if (storyStrokes.length === 0) return null;
          return (
            <StoryDrawingCanvas strokes={storyStrokes} />
          );
        })()}
        {parseStoryElements(currentStory.elements).map((el) => (
          <div key={el.id} className="absolute z-25" style={{ left: `${el.x}%`, top: `${el.y}%`, transform: `translate(-50%, -50%) rotate(${el.rotation}deg) scale(${el.scale})`, transformOrigin: "center center" }}>
            {el.type === "coinButton" ? (
              <button onClick={(e) => { e.stopPropagation(); if (!isMyStory) openCoinModal(true); }} className="active:scale-90 transition-transform" style={{ fontSize: `${el.fontSize}px`, color: el.color, backgroundColor: el.bgColor || "#ffd700", fontWeight: el.bold ? "bold" : "normal", fontStyle: el.italic ? "italic" : "normal", padding: "0.4em 0.8em", borderRadius: "9999px", whiteSpace: "nowrap", display: "inline-block" }}>
                {el.text}
              </button>
            ) : el.type === "sticker" ? (
              <span style={{ fontSize: `${el.fontSize}px`, lineHeight: 1 }}>{el.text}</span>
            ) : (
              <span style={{ fontSize: `${el.fontSize}px`, color: el.color, backgroundColor: el.bgColor && el.bgColor !== "transparent" ? el.bgColor : "transparent", fontWeight: el.bold ? "bold" : "normal", fontStyle: el.italic ? "italic" : "normal", padding: el.bgColor && el.bgColor !== "transparent" ? "0.2em 0.4em" : "0", borderRadius: "0.3em", whiteSpace: "nowrap", display: "inline-block", textShadow: el.bgColor === "transparent" ? "0 1px 3px rgba(0,0,0,0.6)" : "none" }}>{el.text}</span>
            )}
          </div>
        ))}

        {/* بنر در انتظار تایید مدیر */}
        {isMyStory && currentStory.isApproved === false && (
          <div className="absolute top-[88px] left-1/2 -translate-x-1/2 z-20">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-ig-gold backdrop-blur-sm text-white text-xs font-bold ig-fade-in">
              <Clock className="w-3.5 h-3.5" />
              در انتظار تایید مدیر
            </span>
          </div>
        )}

        {/* نشان pause */}
        {paused && !replyText && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none">
            <div className="w-14 h-14 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center ig-fade-in">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="5" width="4" height="14" rx="1" />
                <rect x="14" y="5" width="4" height="14" rx="1" />
              </svg>
            </div>
          </div>
        )}

        {/* caption */}
        {currentStory.caption && (
          <div className="absolute bottom-28 left-4 right-4 z-20">
            <p className="text-sm text-white font-medium leading-6 drop-shadow-lg">
              {currentStory.caption}
            </p>
          </div>
        )}

        {/* نواحی لمس — با hold to pause */}
        <div
          className="absolute left-0 top-20 bottom-28 w-1/3 z-15"
          onClick={(e) => { e.stopPropagation(); goToPrev(); }}
          onDoubleClick={handleStoryTap}
          onMouseDown={handlePressStart}
          onMouseUp={handlePressEnd}
          onMouseLeave={handlePressEnd}
          onTouchStart={handlePressStart}
          onTouchEnd={handlePressEnd}
        />
        <div
          className="absolute right-0 top-20 bottom-28 w-1/3 z-15"
          onClick={(e) => { e.stopPropagation(); goToNext(); }}
          onDoubleClick={handleStoryTap}
          onMouseDown={handlePressStart}
          onMouseUp={handlePressEnd}
          onMouseLeave={handlePressEnd}
          onTouchStart={handlePressStart}
          onTouchEnd={handlePressEnd}
        />
        <div
          className="absolute left-1/3 right-1/3 top-20 bottom-28 z-15"
          onClick={handleStoryTap}
          onDoubleClick={handleStoryTap}
          onMouseDown={handlePressStart}
          onMouseUp={handlePressEnd}
          onMouseLeave={handlePressEnd}
          onTouchStart={handlePressStart}
          onTouchEnd={handlePressEnd}
        />

        {/* منوی سه نقطه */}
        {showMenu && !isMyStory && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
            <div className="absolute bottom-20 right-4 z-50 bg-surface rounded-2xl shadow-xl overflow-hidden ig-modal-in min-w-[180px]">
              <button onClick={startChat} className="flex items-center gap-3 w-full px-4 py-3 hover:bg-ig-gray-bg transition-colors text-right">
                <MessageCircle className="w-5 h-5 text-ig-gray" strokeWidth={1.5} />
                <span className="text-sm font-bold text-foreground">شروع گفتگو</span>
              </button>
              <button onClick={viewProfile} className="flex items-center gap-3 w-full px-4 py-3 hover:bg-ig-gray-bg transition-colors text-right">
                <Eye className="w-5 h-5 text-ig-gray" strokeWidth={1.5} />
                <span className="text-sm font-bold text-foreground">مشاهده پروفایل</span>
              </button>
              <button onClick={reportUser} className="flex items-center gap-3 w-full px-4 py-3 hover:bg-ig-gray-bg transition-colors text-right border-t border-ig-border">
                <Flag className="w-5 h-5 text-ig-red" strokeWidth={1.5} />
                <span className="text-sm font-bold text-ig-red">گزارش تخلف</span>
              </button>
            </div>
          </>
        )}

        {/* بخش پایین: لایک + ریپلای */}
        <div className="absolute bottom-0 left-0 right-0 z-20 pb-[max(1rem,env(safe-area-inset-bottom))] px-4 pt-4">
          {isMyStory ? (
            <div className="flex items-center justify-center gap-6 pb-2">
              <span className="flex items-center gap-1.5 text-sm text-white/90">
                <Eye className="w-4 h-4" />
                {toPersianDigits(likeCount > 0 ? likeCount : 0)} بازدید
              </span>
              <span className="flex items-center gap-1.5 text-sm text-white/90">
                <Heart className="w-4 h-4" />
                {toPersianDigits(likeCount)}
              </span>
            </div>
          ) : replySent ? (
            <div className="flex flex-col items-center gap-2 pb-3">
              <span className="text-sm text-white/90 bg-surface/10 px-4 py-2 rounded-full">
                ارسال شد ✓
              </span>
              <span className="text-xs text-white/60">در حال انتقال به چت...</span>
            </div>
          ) : !hasSubscription ? (
            /* کاربر بدون اشتراک */
            <div className="pb-2">
              <div className="flex items-center gap-2 bg-surface/10 backdrop-blur-md rounded-2xl px-4 py-3 border border-white/20 mb-2">
                <Crown className="w-5 h-5 text-ig-gold shrink-0" />
                <p className="text-xs text-white/90 leading-5">
                  برای پاسخ و شروع گفتگو با این کاربر نیاز به خرید اشتراک می باشد
                </p>
              </div>
              <button
                onClick={() => router.push("/dashboard/subscription")}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-ig-blue text-white text-sm font-bold active:scale-95 transition-transform"
              >
                <Crown className="w-4 h-4" />
                خرید اشتراک
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 pb-2">
              <button onClick={toggleLike} className="p-2 shrink-0 active:scale-90 transition-transform">
                <Heart className={`w-7 h-7 transition-all ${liked ? "text-ig-red fill-current scale-110" : "text-white"}`} />
              </button>
              <button onClick={() => openCoinModal(false)} className="p-2 shrink-0 active:scale-90 transition-transform">
                <Gift className="w-6 h-6 text-white" />
              </button>
              <div className="flex-1 flex items-center gap-2 bg-surface/10 backdrop-blur-md rounded-full px-4 py-2.5 border border-white/20">
                <input
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") sendReply(); }}
                  onFocus={() => setPaused(true)}
                  onBlur={() => setPaused(false)}
                  placeholder={`پاسخ به ${currentUser.firstName}...`}
                  maxLength={500}
                  className="flex-1 min-w-0 bg-transparent outline-none text-sm text-white placeholder:text-white/60"
                />
                {replyText.trim() && (
                  <button onClick={sendReply} className="shrink-0 text-sm font-bold text-white hover:text-white/80 transition-colors">
                    ارسال
                  </button>
                )}
              </div>
              <button onClick={() => setShowMenu((v) => !v)} className="p-2 shrink-0 active:scale-90 transition-transform">
                <MoreHorizontal className="w-6 h-6 text-white" />
              </button>
            </div>
          )}

          {currentUser.stories.length > 1 && (
            <div className="flex items-center justify-center gap-1 pb-1">
              {currentUser.stories.map((_, i) => (
                <span key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === storyIndex ? "bg-surface w-4" : "bg-surface/40"}`} />
              ))}
            </div>
          )}
        </div>

        {/* مودال هدیه سکه — bottom sheet */}
        {showCoinModal && (
          <div className="absolute inset-0 z-50 flex items-end justify-center bg-black/40 ig-fade-in" onClick={() => setShowCoinModal(false)}>
            <div className="bg-surface w-full max-w-md rounded-t-2xl ig-slide-up overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-100">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Gift className="w-4 h-4 text-neutral-700" />
                  هدیه سکه به {currentUser.firstName}
                </h3>
                <button onClick={() => setShowCoinModal(false)} className="w-8 h-8 rounded-lg hover:bg-ig-btn2 flex items-center justify-center transition-colors">
                  <X className="w-4 h-4 text-ig-gray" />
                </button>
              </div>
              <div className="px-5 py-4">
                {coinResult ? (
                  <div className="text-center py-6">
                    <div className={`w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center ${coinResult.ok ? "bg-ig-gray-bg" : "bg-ig-gray-bg"}`}>
                      {coinResult.ok ? (
                        <svg className="w-7 h-7 text-ig-gray" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      ) : (
                        <X className="w-7 h-7 text-ig-red" />
                      )}
                    </div>
                    <p className={`text-sm font-bold ${coinResult.ok ? "text-foreground" : "text-ig-red"}`}>{coinResult.text}</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2.5">
                      <div className="relative">
                        <input
                          type="number"
                          dir="ltr"
                          value={coinAmount}
                          onChange={(e) => setCoinAmount(e.target.value)}
                          placeholder="تعداد سکه"
                          className="w-full px-3 py-2.5 rounded-lg border border-neutral-200 focus:border-neutral-500 focus:ring-2 focus:ring-neutral-100 outline-none text-sm text-center font-bold"
                        />
                        <Coins className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      </div>
                      <input
                        value={coinMsg}
                        onChange={(e) => setCoinMsg(e.target.value)}
                        placeholder="پیام (اختیاری)"
                        maxLength={200}
                        className="w-full px-3 py-2.5 rounded-lg border border-neutral-200 focus:border-neutral-500 focus:ring-2 focus:ring-neutral-100 outline-none text-sm"
                      />
                    </div>
                    {/* دکمه های سریع */}
                    <div className="flex gap-2 mt-3">
                      {[10, 50, 100, 200].map((amt) => (
                        <button
                          key={amt}
                          onClick={() => setCoinAmount(String(amt))}
                          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${coinAmount === String(amt) ? "bg-neutral-800 text-white" : "bg-ig-btn2 text-ig-gray hover:bg-neutral-200"}`}
                        >
                          {toPersianDigits(amt)}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              {!coinResult && (
                <div className="px-5 py-3.5 border-t border-neutral-100">
                  <button
                    onClick={sendCoinGift}
                    disabled={!coinAmount || coinSending}
                    className="w-full py-2.5 rounded-lg bg-neutral-800 text-white text-sm font-bold disabled:opacity-40 hover:bg-neutral-700 transition-colors flex items-center justify-center gap-2"
                  >
                    {coinSending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        در حال ارسال...
                      </>
                    ) : (
                      <>
                        <Gift className="w-4 h-4" />
                        هدیه بده
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* مودال گزارش تخلف */}
        {showReportModal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 ig-fade-in" onClick={() => setShowReportModal(false)}>
            <div className="bg-surface rounded-3xl mx-6 max-w-xs w-full overflow-hidden ig-modal-in" onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                {reportSent ? (
                  <div className="text-center">
                    <div className="w-14 h-14 rounded-full bg-ig-gray-bg flex items-center justify-center mx-auto mb-3">
                      <svg className="w-7 h-7 text-ig-gray" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <p className="text-sm font-bold text-foreground">گزارش شما ثبت شد</p>
                  </div>
                ) : (
                  <>
                    <h3 className="text-base font-bold text-foreground mb-1 text-center">گزارش تخلف</h3>
                    <p className="text-xs text-ig-gray mb-4 text-center">دلیل گزارش {currentUser.firstName} را انتخاب کنید</p>
                    <div className="space-y-2">
                      {[
                        { value: "HARASSMENT", label: "آزار و اذیت" },
                        { value: "FAKE_PROFILE", label: "پروفایل جعلی" },
                        { value: "INAPPROPRIATE_CONTENT", label: "محتوای نامناسب" },
                        { value: "SCAM", label: "کلاهبرداری" },
                        { value: "OTHER", label: "سایر" },
                      ].map((r) => (
                        <button
                          key={r.value}
                          onClick={() => setReportReason(r.value)}
                          className={`w-full text-right px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                            reportReason === r.value ? "bg-ig-red/10 text-ig-red" : "bg-ig-gray-bg text-foreground hover:bg-neutral-200"
                          }`}
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={submitReport}
                      disabled={!reportReason}
                      className="w-full mt-4 py-3 rounded-full bg-ig-red text-white text-sm font-bold disabled:opacity-40 active:scale-95 transition-transform"
                    >
                      ثبت گزارش
                    </button>
                    <button onClick={() => setShowReportModal(false)} className="w-full py-2.5 mt-1 text-sm font-bold text-ig-gray">
                      انصراف
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* مودال خرید اشتراک */}
        {showSubModal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 ig-fade-in" onClick={() => setShowSubModal(false)}>
            <div className="bg-surface rounded-3xl mx-6 max-w-xs w-full overflow-hidden ig-modal-in" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-ig-gray-bg flex items-center justify-center mx-auto mb-4">
                  <Crown className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-base font-bold text-foreground mb-2">خرید اشتراک لازم است</h3>
                <p className="text-sm text-ig-gray leading-6 mb-5">
                  برای پاسخ به استوری و شروع گفتگو با این کاربر نیاز به خرید اشتراک دارید
                </p>
                <button
                  onClick={() => router.push("/dashboard/subscription")}
                  className="w-full py-3 rounded-full bg-ig-blue text-white text-sm font-bold active:scale-95 transition-transform"
                >
                  مشاهده پلن های اشتراک
                </button>
                <button
                  onClick={() => setShowSubModal(false)}
                  className="w-full py-2.5 mt-2 text-sm font-bold text-ig-gray"
                >
                  بستن
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </Portal>
    </>
  );
}
