"use client";

// اتاق گفتگو: بازطراحی کامل — سبک مدرن
import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Crown, ArrowRight, Coins, Image as ImageIcon,
  Mic, Check, CheckCheck, Gift, ArrowDownLeft,
  Send, Smile, X, Play, Pause, Video as VideoIcon,
  MoreVertical, Reply, Heart, Paperclip, Copy, Flag, Ban, AlertCircle, Lock, Sparkles, Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import VerifiedBadge from "@/components/dashboard/VerifiedBadge";
import DefaultAvatar from "@/components/dashboard/DefaultAvatar";
import AlertModal from "@/components/AlertModal";
import { formatTime, toPersianDigits, formatLastSeen } from "@/lib/format";
import { useToast } from "@/components/ToastProvider";

type ReplyTo = {
  id: string;
  content: string;
  type: string;
  senderId: string;
} | null;

type Message = {
  id: string;
  senderId: string;
  content: string;
  type: string;
  mediaUrl: string | null;
  duration: number | null;
  isRead: boolean;
  createdAt: string;
  replyTo?: ReplyTo;
  reaction?: string | null;
  status?: "sending" | "failed";
};

type Props = {
  conversationId: string;
  currentUserId: string;
  otherUserId: string;
  otherName: string;
  otherUsername: string;
  otherVerified: boolean;
  otherOnline: boolean;
  otherLastSeen: string;
  otherPhoto: string | null;
  canSend: boolean;
  canReopen?: boolean;
  iBlockedOther?: boolean;
  otherBlockedMe?: boolean;
  messageLockInfo?: { until: string; reason: string } | null;
  isAdminChat?: boolean;
  isAIChat?: boolean;
  aiGradient?: string;
  initialMessages: Message[];
  initialHasMore?: boolean;
};

function newTempId() {
  // شناسه موقت پیام — خارج از کامپوننت (توابع ناخالص در render مجاز نیستند)
  return `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export default function ChatRoom({
  conversationId,
  currentUserId,
  otherUserId,
  otherName,
  otherUsername,
  otherVerified,
  otherOnline,
  otherLastSeen,
  otherPhoto,
  canSend: canSendInitial,
  canReopen = false,
  iBlockedOther = false,
  otherBlockedMe = false,
  messageLockInfo = null,
  isAdminChat = false,
  isAIChat = false,
  aiGradient = "",
  initialMessages,
  initialHasMore = false,
}: Props) {
  const { toast } = useToast();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [text, setText] = useState("");
  const [needSub, setNeedSub] = useState(!canSendInitial);
  const [, setSending] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showStickers, setShowStickers] = useState(false);
  const [transferCoins, setTransferCoins] = useState("");
  const [transferMsg, setTransferMsg] = useState("");
  const [transferMode, setTransferMode] = useState<"GIFT" | "REQUEST">("GIFT");
  const [transferring, setTransferring] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [replyTo, setReplyTo] = useState<ReplyTo>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showInputMenu, setShowInputMenu] = useState(false);
  const [reactionFor, setReactionFor] = useState<string | null>(null);
  const [contextMessage, setContextMessage] = useState<Message | null>(null);
  const [otherTyping, setOtherTyping] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportMessageId, setReportMessageId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reporting, setReporting] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [reportDetails, setReportDetails] = useState("");
  const [isBlocked, setIsBlocked] = useState(iBlockedOther);
  const [isBlockedByOther, setIsBlockedByOther] = useState(otherBlockedMe);
  const [unblocking, setUnblocking] = useState(false);
  const [deletingConv, setDeletingConv] = useState(false);
  const [convDeleted, setConvDeleted] = useState(false);
  const [showDeleteConv, setShowDeleteConv] = useState(false);
  const [lockCountdown, setLockCountdown] = useState<string>("");
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [showJump, setShowJump] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  // آیا کاربر نزدیک انتهای لیست است — برای اسکرول هوشمند
  const nearBottomRef = useRef(true);
  // برای resync پیام ها بعد از قطع اتصال SSE
  const sseConnectedOnceRef = useRef(false);
  // ارتفاع اسکرول قبل از افزودن پیام های قدیمی — برای حفظ موقعیت دید
  const pendingRestoreRef = useRef<number | null>(null);
  // محتوای پیام های در انتظار برای تلاش مجدد
  const pendingSendsRef = useRef(new Map<string, { content: string; replyToId?: string }>());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastDateRef = useRef<string | null>(
    initialMessages.length
      ? initialMessages[initialMessages.length - 1].createdAt
      : null
  );

  // افزودن پیام با جلوگیری از تکرار — چون هم پاسخ POST و هم رویداد SSE ممکن است همان پیام را برگردانند
  const addMessage = useCallback((msg: Message) => {
    setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
    lastDateRef.current = msg.createdAt;
  }, []);

  // ارسال وضعیت تایپ به سرور
  const sendTypingStatus = useCallback((typing: boolean) => {
    if (typing === isTypingRef.current) return;
    isTypingRef.current = typing;
    fetch("/api/messages/typing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId, isTyping: typing }),
    }).catch(() => {});
  }, [conversationId]);

  // شمارنده معکوس قفل پیام
  useEffect(() => {
    if (!messageLockInfo) return;
    const target = new Date(messageLockInfo.until).getTime();
    function tick() {
      const diff = target - Date.now();
      if (diff <= 0) {
        setLockCountdown("قفل باز شد");
        return;
      }
      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      setLockCountdown(
        `${toPersianDigits(d)} روز - ${toPersianDigits(h)} ساعت - ${toPersianDigits(m)} دقیقه - ${toPersianDigits(s)} ثانیه`
      );
    }
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [messageLockInfo]);

  // پاکسازی وضعیت تایپ هنگام unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (isTypingRef.current) {
        fetch("/api/messages/typing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId, isTyping: false }),
        }).catch(() => {});
      }
    };
  }, [conversationId]);

  // مدیریت تایپ کاربر
  function handleTextChange(value: string) {
    setText(value);
    if (!value.trim()) {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      sendTypingStatus(false);
      return;
    }
    if (!isTypingRef.current) {
      sendTypingStatus(true);
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingStatus(false);
    }, 3000);
  }

  // اسکرول هوشمند: حفظ موقعیت هنگام لود پیام قدیمی، اسکرول به پایین فقط اگر نزدیک پایین هستیم یا پیام خودمان است
  const lastMsgIdRef = useRef<string | null>(initialMessages.length ? initialMessages[initialMessages.length - 1].id : null);
  const didInitScrollRef = useRef(false);
  useLayoutEffect(() => {
    const el = listRef.current;
    // تشخیص پیام جدیدِ انتهای لیست قبل از شاخه بازگردانی اسکرول — تا هنگام ترکیب شدن با لود تاریخچه گم نشود
    const last = messages[messages.length - 1];
    const isNewLast = !!last && last.id !== lastMsgIdRef.current;
    if (isNewLast) lastMsgIdRef.current = last!.id;
    if (pendingRestoreRef.current != null && el) {
      el.scrollTop = el.scrollHeight - pendingRestoreRef.current;
      pendingRestoreRef.current = null;
      // اگر همزمان با لود تاریخچه پیام جدیدی از طرف مقابل رسید، دکمه پرش نشان بده
      if (isNewLast && last!.senderId !== currentUserId) setShowJump(true);
      return;
    }
    // هنگام ورود به اتاق روی آخرین پیام قرار می گیریم
    if (!didInitScrollRef.current) {
      didInitScrollRef.current = true;
      bottomRef.current?.scrollIntoView({ behavior: "auto" });
      return;
    }
    if (isNewLast) {
      // فاصله واقعی از پایین در همین لحظه محاسبه می شود — قابل اعتمادتر از رویدادهای اسکرول قبلی
      const dist = el ? el.scrollHeight - el.scrollTop - el.clientHeight : 0;
      const nearBottom = dist < 80;
      if (nearBottom || last!.senderId === currentUserId) {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      } else {
        setShowJump(true);
      }
    }
  }, [messages, currentUserId]);

  // ردیابی نزدیکی به پایین لیست + لود پیام های قدیمی تر هنگام رسیدن به بالا
  function handleScroll() {
    const el = listRef.current;
    if (!el) return;
    const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
    nearBottomRef.current = dist < 80;
    if (nearBottomRef.current) setShowJump(false);
    if (el.scrollTop < 80 && hasMore && !loadingOlder) void loadOlder();
  }

  // لود صفحه قبل پیام ها
  async function loadOlder() {
    const first = messages[0];
    if (!first || loadingOlder) return;
    setLoadingOlder(true);
    const el = listRef.current;
    if (el) pendingRestoreRef.current = el.scrollHeight - el.scrollTop;
    try {
      const res = await fetch(`/api/messages?conversationId=${conversationId}&before=${encodeURIComponent(first.createdAt)}`);
      const data = await res.json();
      if (res.ok && Array.isArray(data.messages)) {
        setHasMore(!!data.hasMore);
        if (data.messages.length === 0) pendingRestoreRef.current = null;
        setMessages((prev) => {
          const ids = new Set(prev.map((m) => m.id));
          const older = (data.messages as Message[]).filter((m) => !ids.has(m.id));
          return older.length ? [...older, ...prev] : prev;
        });
      } else {
        pendingRestoreRef.current = null;
      }
    } catch {
      pendingRestoreRef.current = null;
    } finally {
      setLoadingOlder(false);
    }
  }

  // اتصال real-time به SSE + علامت‌گذاری خوانده شدن پیام های طرف مقابل
  useEffect(() => {
    const es = new EventSource(`/api/messages/stream?conversationId=${conversationId}`);

    // بعد از قطع و وصل مجدد، پیام های جا مانده را دوباره می گیریم
    es.onopen = () => {
      if (!sseConnectedOnceRef.current) {
        sseConnectedOnceRef.current = true;
        return;
      }
      const after = lastDateRef.current;
      fetch(`/api/messages?conversationId=${conversationId}${after ? `&after=${encodeURIComponent(after)}` : ""}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (d?.messages) (d.messages as Message[]).forEach((m) => addMessage(m));
        })
        .catch(() => {});
    };

    const markRead = async () => {
      try {
        await fetch(`/api/messages?conversationId=${conversationId}&includeReadStatus=true`);
      } catch {
        // خطای شبکه
      }
    };

    es.addEventListener("message", (event) => {
      try {
        const msg = JSON.parse(event.data) as Message & { clientTag?: string };
        setMessages((prev) => {
          // اگر این پاسخ ارسال خودمان است، پیام موقت را با نسخه واقعی تعویض می کنیم
          if (msg.clientTag && prev.some((m) => m.id === msg.clientTag)) {
            lastDateRef.current = msg.createdAt;
            const { clientTag: _tag, ...real } = msg;
            return prev.map((m) => (m.id === msg.clientTag ? { ...real } : m));
          }
          if (prev.some((m) => m.id === msg.id)) return prev;
          lastDateRef.current = msg.createdAt;
          return [...prev, msg];
        });
        // پیام طرف مقابل را خوانده شده علامت بزن
        if (msg.senderId !== currentUserId) markRead();
      } catch {
        // داده نامعتبر
      }
    });

    es.addEventListener("read", (event) => {
      try {
        const data = JSON.parse(event.data) as { messageIds: string[]; byUserId: string };
        if (data.byUserId === currentUserId) return;
        setMessages((prev) =>
          prev.map((m) =>
            data.messageIds.includes(m.id) ? { ...m, isRead: true } : m
          )
        );
      } catch {
        // داده نامعتبر
      }
    });

    es.addEventListener("typing", (event) => {
      try {
        const data = JSON.parse(event.data) as { userId: string; isTyping: boolean };
        if (data.userId !== currentUserId) setOtherTyping(data.isTyping);
      } catch {
        // داده نامعتبر
      }
    });

    return () => es.close();
  }, [conversationId, currentUserId]);

  // تایمر ضبط صوتی
  useEffect(() => {
    if (recording) {
      recordTimerRef.current = setInterval(() => {
        setRecordTime((t) => t + 1);
      }, 1000);
    } else {
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    }
    return () => {
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    };
  }, [recording]);

  async function send(e: { preventDefault(): void }) {
    e.preventDefault();
    const content = text.trim();
    if (!content) return;
    const reply = replyTo;
    setText("");
    setReplyTo(null);
    sendTypingStatus(false);
    if (inputRef.current) inputRef.current.style.height = "auto";
    void postMessage(content, reply?.id, reply ? { id: reply.id, content: reply.content, type: reply.type, senderId: reply.senderId } : undefined);
  }

  // ارسال پیام متنی به صورت optimistic — پیام موقت نمایش داده می شود و در صورت خطا قابل تلاش مجدد است
  async function postMessage(content: string, replyToId: string | undefined, replySnapshot?: ReplyTo, existingTempId?: string) {
    const tempId = existingTempId ?? newTempId();
    pendingSendsRef.current.set(tempId, { content, replyToId });
    if (existingTempId) {
      setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...m, status: "sending" as const } : m)));
    } else {
      addMessage({
        id: tempId, senderId: currentUserId, content, type: "TEXT", mediaUrl: null,
        duration: null, isRead: false, createdAt: new Date().toISOString(),
        replyTo: replySnapshot ?? null, status: "sending",
      });
    }
    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, content, type: "TEXT", clientTag: tempId, ...(replyToId ? { replyToId } : {}) }),
      });
      const data = await res.json();
      if (res.status === 402) {
        setNeedSub(true);
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        pendingSendsRef.current.delete(tempId);
        return;
      }
      if (res.ok && data.message) {
        // ممکن است SSE پیام واقعی را زودتر رسانده باشد؛ بعد از تعویض پیام موقت، id های تکراری حذف می شوند
        setMessages((prev) =>
          prev
            .map((m) => (m.id === tempId ? ({ ...data.message } as Message) : m))
            .filter((m, i, arr) => arr.findIndex((x) => x.id === m.id) === i)
        );
        lastDateRef.current = data.message.createdAt;
        pendingSendsRef.current.delete(tempId);
      } else {
        setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...m, status: "failed" as const } : m)));
      }
    } catch {
      setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...m, status: "failed" as const } : m)));
    } finally {
      setSending(false);
    }
  }

  // تلاش مجدد برای پیام ناموفق یا حذف آن
  function retryMessage(tempId: string) {
    const pending = pendingSendsRef.current.get(tempId);
    if (!pending) return;
    void postMessage(pending.content, pending.replyToId, undefined, tempId);
  }

  function discardMessage(tempId: string) {
    pendingSendsRef.current.delete(tempId);
    setMessages((prev) => prev.filter((m) => m.id !== tempId));
  }

  async function sendSticker(emoji: string) {
    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, content: emoji, type: "STICKER" }),
      });
      const data = await res.json();
      if (res.ok && data.message) {
        addMessage(data.message);
        setShowStickers(false);
      }
    } finally {
      setSending(false);
    }
  }

  // آپلود عکس در چت
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || uploading) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok && data.url) {
        const msgRes = await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId, content: "عکس", type: "IMAGE", mediaUrl: data.url }),
        });
        const msgData = await msgRes.json();
        if (msgRes.ok && msgData.message) {
          addMessage(msgData.message);
        }
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  // آپلود ویدیو در چت
  async function handleVideoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || uploading) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok && data.url) {
        const msgRes = await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId, content: "ویدیو", type: "VIDEO", mediaUrl: data.url }),
        });
        const msgData = await msgRes.json();
        if (msgRes.ok && msgData.message) {
          addMessage(msgData.message);
        }
      }
    } finally {
      setUploading(false);
      if (videoInputRef.current) videoInputRef.current.value = "";
    }
  }

  // ضبط پیام صوتی
  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach((t) => t.stop());
        if (blob.size < 1000) return;
        const formData = new FormData();
        formData.append("file", blob, "voice.webm");
        setUploading(true);
        try {
          const res = await fetch("/api/voice", { method: "POST", body: formData });
          const data = await res.json();
          if (res.ok && data.url) {
            const duration = recordTime;
            const msgRes = await fetch("/api/messages", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ conversationId, content: "پیام صوتی", type: "VOICE", mediaUrl: data.url, duration }),
            });
            const msgData = await msgRes.json();
            if (msgRes.ok && msgData.message) {
              addMessage(msgData.message);
            }
          }
        } finally { setUploading(false); }
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
    } catch { /* دسترسی میکروفون رد شد */ }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && recording) { mediaRecorderRef.current.stop(); setRecording(false); }
  }

  // انتقال سکه
  async function handleTransfer() {
    const coins = parseInt(transferCoins, 10);
    if (!coins || coins < 1 || transferring) return;
    setTransferring(true);
    try {
      const endpoint = transferMode === "GIFT" ? "/api/transfer" : "/api/transfer/request";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, receiverId: otherUserId, coins, message: transferMsg || undefined }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowTransfer(false); setTransferCoins(""); setTransferMsg("");
      } else { toast(data.error || "خطا", "error"); }
    } finally { setTransferring(false); }
  }

  // حذف یکطرفه گفتگو — فقط برای کاربر فعلی پنهان می شود، طرف مقابل همچنان آن را می بیند
  async function handleDeleteConversation() {
    if (deletingConv) return;
    setDeletingConv(true);
    try {
      const res = await fetch(`/api/conversations?conversationId=${conversationId}`, { method: "DELETE" });
      if (res.ok) {
        toast("گفتگو حذف شد", "success");
        setConvDeleted(true);
      } else {
        const data = await res.json();
        toast(data.error ?? "خطایی رخ داد", "error");
      }
    } catch {
      toast("خطا در ارتباط با سرور", "error");
    } finally {
      setDeletingConv(false);
      setShowDeleteConv(false);
    }
  }

  // تایید/رد درخواست سکه
  async function handleRequestAction(transferId: string, action: "APPROVE" | "REJECT") {
    await fetch("/api/transfer/request", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transferId, action }),
    });
  }

  // کپی متن با fallback برای موبایل
  function copyToClipboard(text: string) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
    } else {
      fallbackCopy(text);
    }
  }

  function fallbackCopy(text: string) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    textarea.style.pointerEvents = "none";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    try {
      document.execCommand("copy");
    } catch {}
    document.body.removeChild(textarea);
  }

  async function setReaction(messageId: string, emoji: string | null) {
    setReactionFor(null);
    try {
      await fetch("/api/messages/reaction", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, emoji }),
      });
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, reaction: emoji } : m))
      );
    } catch { /* */ }
  }

  // رندر پیام سیستمی
  function renderSystemMessage(m: Message) {
    let parsed: { coins?: number; fee?: number; bonus?: number; message?: string; type?: string; transferId?: string; senderName?: string; receiverName?: string } = {};
    try { parsed = JSON.parse(m.content); } catch { return null; }
    const mine = m.senderId === currentUserId;
    if (parsed.type === "GIFT") {
      const giftText = mine
        ? `شما ${toPersianDigits(parsed.coins || 0)} سکه به ${parsed.receiverName || otherName} هدیه دادید`
        : `${parsed.senderName || otherName} ${toPersianDigits(parsed.coins || 0)} سکه به شما هدیه داد`;
      return (
        <div className="flex justify-center my-2">
          <div className="bg-ig-gray-bg border border-ig-border rounded-2xl px-4 py-3 max-w-[80%] text-center">
            <Gift className="w-5 h-5 text-ig-gold mx-auto mb-1" />
            <p className="text-xs text-foreground font-bold">{giftText}</p>
            {parsed.bonus ? <p className="text-xs text-ig-gold mt-0.5">شامل {toPersianDigits(parsed.bonus)} سکه پاداش</p> : null}
            {parsed.message && <p className="text-xs text-ig-gray mt-1">{parsed.message}</p>}
            {parsed.fee ? <p className="text-xs text-ig-gray mt-1">کارمزد: {toPersianDigits(parsed.fee)} سکه</p> : null}
          </div>
        </div>
      );
    }
    if (parsed.type === "REQUEST") {
      return (
        <div className="flex justify-center my-2">
          <div className="bg-ig-gray-bg border border-ig-border rounded-2xl px-4 py-3 max-w-[80%] text-center">
            <ArrowDownLeft className="w-5 h-5 text-ig-blue mx-auto mb-1" />
            <p className="text-xs text-foreground font-bold">{mine ? "شما" : otherName} {toPersianDigits(parsed.coins || 0)} سکه درخواست کرد</p>
            {parsed.message && <p className="text-xs text-ig-gray mt-1">{parsed.message}</p>}
            {!mine && (
              <div className="flex gap-2 mt-2 justify-center">
                <button onClick={() => handleRequestAction(parsed.transferId || "", "APPROVE")} className="px-3 py-1 rounded-lg bg-ig-blue text-white text-xs font-bold hover:bg-ig-blue-hover transition-colors">تایید</button>
                <button onClick={() => handleRequestAction(parsed.transferId || "", "REJECT")} className="px-3 py-1 rounded-lg bg-ig-red text-white text-xs font-bold hover:bg-ig-red/90 transition-colors">رد</button>
              </div>
            )}
          </div>
        </div>
      );
    }
    if (parsed.type === "REQUEST_APPROVED") {
      return (
        <div className="flex justify-center my-2">
          <div className="bg-ig-gray-bg border border-ig-border rounded-2xl px-4 py-2 max-w-[80%] text-center">
            <Check className="w-4 h-4 text-ig-gray mx-auto mb-1" />
            <p className="text-xs text-foreground font-bold">درخواست {toPersianDigits(parsed.coins || 0)} سکه تایید شد</p>
          </div>
        </div>
      );
    }
    if (parsed.type === "REQUEST_REJECTED") {
      return (
        <div className="flex justify-center my-2">
          <div className="bg-ig-gray-bg border border-ig-border rounded-2xl px-4 py-2 max-w-[80%] text-center">
            <p className="text-xs text-foreground font-bold">درخواست {toPersianDigits(parsed.coins || 0)} سکه رد شد</p>
          </div>
        </div>
      );
    }
    return null;
  }

  const STICKERS = ["❤️", "😍", "🔥", "✨", "👏", "🥳", "😎", "🤔", "😂", "🌹", "💕", "💋"];
  const REACTIONS = ["❤️", "😂", "😍", "🔥", "👏", "😮"];

  return (
    <div className={`flex flex-col h-[calc(100dvh-3.5rem)] lg:h-[100dvh] lg:mx-auto relative bg-white overflow-hidden ${(contextMessage || reactionFor || showTransfer || showMenu) ? "select-none" : ""}`}>
      {/* هدر مدرن */}
      <div className="flex items-center gap-3 px-3 py-2.5 border-b border-ig-border bg-white shrink-0 z-30 pt-[max(0.625rem,env(safe-area-inset-top))]">
        <Link href="/dashboard/chat" aria-label="بازگشت به لیست گفتگوها" className="p-1.5 shrink-0 active:scale-90 transition-transform lg:hidden">
          <ArrowRight className="w-5 h-5 text-foreground" strokeWidth={2} />
        </Link>
        <Link href={isAIChat ? "/dashboard/chat" : `/profile/${otherUsername}`} className="shrink-0 active:scale-90 transition-transform">
          <div className="w-10 h-10 rounded-full shrink-0 relative overflow-hidden flex items-center justify-center">
            {otherPhoto ? (
              <div className="relative w-full h-full">
                <Image src={otherPhoto} alt={otherName} fill className="object-cover" sizes="40px" />
              </div>
            ) : isAIChat ? (
              <div className={`w-full h-full bg-ig-gray-bg ${aiGradient} flex items-center justify-center`}>
                <Sparkles className="w-5 h-5 text-white" strokeWidth={2} />
              </div>
            ) : (
              <DefaultAvatar size={40} />
            )}
            {otherOnline && (
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-ig-online rounded-full border-2 border-white ig-pulse" />
            )}
          </div>
        </Link>
        <Link href={isAIChat ? "/dashboard/chat" : `/profile/${otherUsername}`} className="flex-1 min-w-0 active:scale-95 transition-transform">
          <p className="text-sm font-bold flex items-center gap-1">
            {otherName}
            {isAIChat ? (
              <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-bold ${aiGradient.includes("rose") ? "bg-ig-gray-bg text-ig-gray" : "bg-ig-gray-bg text-ig-blue"}`}>
                <Sparkles className="w-2.5 h-2.5" />
                هوش مصنوعی
              </span>
            ) : otherVerified ? (
              <VerifiedBadge className="w-4 h-4" />
            ) : null}
          </p>
          <p className="text-xs text-ig-gray">
            {otherTyping ? <span className="text-ig-blue">در حال تایپ...</span> : otherOnline ? "فعال الآن" : `آخرین بازدید ${formatLastSeen(new Date(otherLastSeen))}`}
          </p>
        </Link>
        {messages.length > 0 && !isAIChat && (
          <button
            onClick={() => setShowTransfer(true)}
            className="px-3 py-1.5 rounded-lg bg-ig-btn2 hover:bg-ig-btn2-hover text-foreground text-sm font-bold flex items-center gap-1.5 active:scale-95 transition-transform shrink-0"
          >
            <Coins className="w-3.5 h-3.5" />
            انتقال سکه
          </button>
        )}
        <button onClick={() => setShowMenu(!showMenu)} aria-label="گزینه های گفتگو" className="p-1.5 shrink-0 active:scale-90 transition-transform">
          <MoreVertical className="w-5 h-5 text-foreground" strokeWidth={2} />
        </button>
      </div>

      {/* منوی بالا */}
      {showMenu && (
        <>
          <div className="absolute inset-0 z-20" onClick={() => setShowMenu(false)} />
          <div className="absolute top-14 left-3 z-30 bg-white rounded-xl shadow-lg border border-ig-border py-1 ig-modal-in">
            {!isAIChat && (
              <button
                onClick={() => { setShowTransfer(true); setShowMenu(false); }}
                className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-ig-gray-bg w-full text-right transition-colors"
              >
                <Coins className="w-4 h-4 text-ig-gold" />
                هدیه سکه
              </button>
            )}
            {!isAIChat && (
              <Link
                href={`/profile/${otherUsername}`}
                onClick={() => setShowMenu(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-ig-gray-bg w-full text-right transition-colors"
              >
                <Heart className="w-4 h-4 text-ig-red" />
                مشاهده پروفایل
              </Link>
            )}
            {!isAIChat && (
              <button
                onClick={() => { setShowReportModal(true); setShowMenu(false); }}
                className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-ig-gray-bg w-full text-right transition-colors"
              >
                <Flag className="w-4 h-4 text-ig-red" />
                گزارش کاربر
              </button>
            )}
            {!isAIChat && (
              <button
                onClick={() => { setShowBlockModal(true); setShowMenu(false); }}
                className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-ig-gray-bg w-full text-right transition-colors"
              >
                <Ban className="w-4 h-4 text-ig-red" />
                بلاک کردن
              </button>
            )}
            {isAIChat && (
              <div className="px-4 py-3 text-xs text-ig-gray text-center">
                هانی همراه هوش مصنوعی شماست
              </div>
            )}
            {!isAdminChat && (
              <button
                onClick={() => { setShowDeleteConv(true); setShowMenu(false); }}
                className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-ig-gray-bg w-full text-right transition-colors border-t border-ig-border"
              >
                <Trash2 className="w-4 h-4 text-ig-red" />
                <span className="text-ig-red">حذف گفتگو</span>
              </button>
            )}
          </div>
        </>
      )}

      {/* نوار ریپلای */}
      {replyTo && (
        <div className="flex items-center gap-2 px-4 py-2 bg-ig-gray-bg border-b border-ig-border ig-slide-up shrink-0">
          <Reply className="w-4 h-4 text-ig-gray shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-ig-blue">پاسخ به {replyTo.senderId === currentUserId ? "خودت" : otherName}</p>
            <p className="text-xs text-ig-gray truncate">
              {replyTo.type === "IMAGE" ? "عکس" : replyTo.type === "VOICE" ? "پیام صوتی" : replyTo.type === "STICKER" ? "استیکر" : replyTo.type === "VIDEO" ? "ویدیو" : replyTo.content}
            </p>
          </div>
          <button onClick={() => setReplyTo(null)} className="p-1 shrink-0">
            <X className="w-4 h-4 text-ig-gray" />
          </button>
        </div>
      )}

      {/* پیام ها */}
      <div ref={listRef} onScroll={handleScroll} data-testid="message-list" className="flex-1 overflow-y-auto overflow-x-hidden thin-scroll px-3 py-4 space-y-1 min-h-0">
        {loadingOlder && (
          <p className="text-center text-xs text-ig-gray py-2" role="status">در حال بارگذاری پیام های قدیمی تر...</p>
        )}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center ig-fade-in">
            <Link href={`/profile/${otherUsername}`} className="active:scale-95 transition-transform">
              <div className="w-24 h-24 rounded-full mb-4 ig-shadow-lg overflow-hidden flex items-center justify-center">
                {otherPhoto ? (
                  <div className="relative w-full h-full">
                    <Image src={otherPhoto} alt={otherName} fill className="object-cover" sizes="96px" />
                  </div>
                ) : (
                  <DefaultAvatar size={96} />
                )}
              </div>
            </Link>
            <p className="text-lg font-bold text-foreground">{otherName}</p>
            {otherVerified && (
              <p className="text-xs text-ig-blue flex items-center gap-1 mt-1">
                <VerifiedBadge className="w-3.5 h-3.5" />
                تایید شده
              </p>
            )}
            <p className="text-sm text-ig-gray mt-3">اولین پیام را بفرستید</p>
            <p className="text-xs text-ig-gray/70 mt-1.5">و یا برای جذب سریعتر سکه هدیه دهید</p>
            <button
              onClick={() => setShowTransfer(true)}
              className="mt-4 px-6 py-2.5 rounded-full bg-ig-blue text-white text-sm font-bold flex items-center gap-2 ig-shadow-sm active:scale-95 transition-transform"
            >
              <Coins className="w-4 h-4" />
              انتقال سکه
            </button>
          </div>
        )}

        {messages.map((m) => {
          if (m.type === "SYSTEM") {
            return <div key={m.id}>{renderSystemMessage(m)}</div>;
          }
          const mine = m.senderId === currentUserId;
          const isSticker = m.type === "STICKER";
          return (
            <div
              key={m.id}
              className={`flex ${mine ? "justify-start" : "justify-end"} group ig-fade-in relative`}
            >
              <div
                className={`max-w-[78%] ${isSticker ? "text-4xl" : ""} relative`}

                onContextMenu={(e) => {
                  if (isSticker) return;
                  e.preventDefault();
                  setContextMessage(m);
                }}
                onTouchStart={(e) => {
                  if (isSticker) return;
                  const el = e.currentTarget;
                  const timer = setTimeout(() => {
                    setContextMessage(m);
                    if (navigator.vibrate) navigator.vibrate(50);
                  }, 500);
                  const touchEnd = () => {
                    clearTimeout(timer);
                    el?.removeEventListener("touchend", touchEnd);
                    el?.removeEventListener("touchmove", touchEnd);
                  };
                  el?.addEventListener("touchend", touchEnd);
                  el?.addEventListener("touchmove", touchEnd);
                }}
              >
                {/* ریپلای نمایش */}
                {m.replyTo && (
                  <div className={`mb-1 px-3 py-1.5 rounded-lg border-r-2 ${
                    mine ? "bg-ig-gray-bg border-ig-border" : "bg-gray-100 border-ig-gray"
                  }`}>
                    <p className="text-xs font-bold text-ig-blue">
                      {m.replyTo.senderId === currentUserId ? "شما" : otherName}
                    </p>
                    <p className="text-xs text-ig-gray truncate max-w-[200px]">
                      {m.replyTo.type === "IMAGE" ? "عکس" :
                       m.replyTo.type === "VOICE" ? "پیام صوتی" :
                       m.replyTo.type === "STICKER" ? "استیکر" :
                       m.replyTo.type === "VIDEO" ? "ویدیو" : m.replyTo.content}
                    </p>
                  </div>
                )}

                {/* بابل پیام */}
                {isSticker ? (
                  <div className="cursor-pointer">
                    <span>{m.content}</span>
                  </div>
                ) : (
                  <div
                    className={`relative px-3.5 py-2.5 rounded-3xl text-sm leading-6 ig-shadow-sm transition-all ${
                      mine
                        ? `bg-ig-blue text-white rounded-bl-lg ${m.status === "sending" ? "opacity-70" : ""}`
                        : "bg-white text-foreground border border-ig-border rounded-br-lg"
                    }`}
                  >
                    {m.type === "IMAGE" && m.mediaUrl ? (
                      <div className="relative w-full max-w-[240px] h-48 rounded-2xl overflow-hidden mb-1">
                        <Image src={m.mediaUrl} alt="عکس" fill className="object-cover" sizes="240px" />
                      </div>
                    ) : m.type === "VIDEO" && m.mediaUrl ? (
                      <video
                        src={m.mediaUrl}
                        controls
                        className="rounded-2xl max-w-full max-h-72 object-cover mb-1"
                      />
                    ) : m.type === "VOICE" && m.mediaUrl ? (
                      <VoicePlayer url={m.mediaUrl} duration={m.duration} mine={mine} />
                    ) : (
                      <p className="whitespace-pre-wrap break-words">{m.content}</p>
                    )}

                    {/* واکنش */}
                    {m.reaction && (
                      <span className={`absolute -bottom-2 ${mine ? "-right-1" : "-left-1"} text-base bg-white rounded-full px-1 ig-shadow-sm`}>
                        {m.reaction}
                      </span>
                    )}

                    {/* زمان و تیک یا وضعیت ارسال */}
                    <div className={`flex items-center gap-1 mt-1 ${mine ? "justify-start" : "justify-end"}`}>
                      <span className={`text-xs ${mine ? "text-white/80" : "text-ig-gray"}`}>
                        {formatTime(m.createdAt)}
                      </span>
                      {mine && m.status === "failed" && <AlertCircle className="w-3.5 h-3.5 text-white" aria-label="ارسال ناموفق" />}
                      {mine && m.status === "sending" && <span className="w-3 h-3 rounded-full border border-white/60 border-t-white animate-spin" aria-label="در حال ارسال" />}
                      {mine && !m.status && (m.isRead
                        ? <CheckCheck className="w-3.5 h-3.5 text-white/80" />
                        : <Check className="w-3.5 h-3.5 text-white/80" />
                      )}
                    </div>
                  </div>
                )}

                {/* ردیف تلاش مجدد برای پیام ناموفق */}
                {m.status === "failed" && (
                  <div className="flex items-center gap-2 mt-1 mr-1">
                    <button onClick={() => retryMessage(m.id)} className="text-xs font-bold text-ig-red hover:underline">تلاش مجدد</button>
                    <button onClick={() => discardMessage(m.id)} className="text-xs text-ig-gray hover:underline">حذف</button>
                  </div>
                )}

                {/* اکشن بار شناور در hover دسکتاپ */}
                {!isSticker && (
                  <div className={`absolute ${mine ? "-left-1" : "-right-1"} top-1/2 -translate-y-1/2 ${mine ? "-translate-x-full" : "translate-x-full"} opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none group-hover:pointer-events-auto`}>
                    <div className="flex items-center gap-0.5 bg-white rounded-full px-1 py-1 ig-shadow border border-ig-border">
                      <button
                        onClick={() => setReplyTo({ id: m.id, content: m.content, type: m.type, senderId: m.senderId })}
                        className="w-7 h-7 rounded-full hover:bg-ig-gray-bg flex items-center justify-center transition-colors active:scale-90"
                      >
                        <Reply className="w-3.5 h-3.5 text-ig-gray" />
                      </button>
                      <button
                        onClick={() => { if (m.content) copyToClipboard(m.content); }}
                        className="w-7 h-7 rounded-full hover:bg-ig-gray-bg flex items-center justify-center transition-colors active:scale-90"
                      >
                        <Copy className="w-3.5 h-3.5 text-ig-gray" />
                      </button>
                      {!mine && (
                        <button
                          onClick={() => setReactionFor(reactionFor === m.id ? null : m.id)}
                          className="w-7 h-7 rounded-full hover:bg-ig-gray-bg flex items-center justify-center transition-colors active:scale-90"
                        >
                          <Smile className="w-3.5 h-3.5 text-ig-gray" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {otherTyping && (
          <div className="flex justify-end ig-fade-in">
            <div className="bg-white border border-ig-border rounded-3xl rounded-br-lg px-4 py-3 ig-shadow-sm">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-ig-gray rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 bg-ig-gray rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 bg-ig-gray rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* دکمه پرش به پیام جدید وقتی کاربر بالاتر را می خواند */}
      {showJump && (
        <button
          onClick={() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); setShowJump(false); }}
          className="absolute bottom-24 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-full bg-foreground text-white text-xs font-bold ig-shadow-lg ig-fade-in active:scale-95 transition-transform"
        >
          پیام جدید ↓
        </button>
      )}

      {/* مودال انتقال سکه */}
      {showTransfer && (
        <div className="absolute inset-0 bg-black/40 z-50 flex items-end lg:items-center justify-center" onClick={() => setShowTransfer(false)}>
          <div className="bg-white w-full lg:w-96 rounded-t-2xl lg:rounded-2xl ig-slide-up lg:ig-modal-in overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-100">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Coins className="w-4 h-4 text-neutral-700" />
                {transferMode === "GIFT" ? "هدیه سکه" : "درخواست سکه"}
              </h3>
              <button onClick={() => setShowTransfer(false)} className="w-8 h-8 rounded-lg hover:bg-neutral-100 flex items-center justify-center transition-colors">
                <X className="w-4 h-4 text-neutral-500" />
              </button>
            </div>
            <div className="px-5 py-4">
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setTransferMode("GIFT")}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${transferMode === "GIFT" ? "bg-ig-blue text-white" : "bg-neutral-100 text-neutral-600"}`}
              >
                <Gift className="w-3.5 h-3.5 inline ml-1" />
                هدیه دادن
              </button>
              <button
                onClick={() => setTransferMode("REQUEST")}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${transferMode === "REQUEST" ? "bg-ig-blue text-white" : "bg-neutral-100 text-neutral-600"}`}
              >
                <ArrowDownLeft className="w-3.5 h-3.5 inline ml-1" />
                درخواست سکه
              </button>
            </div>
            <div className="space-y-2.5">
              <div className="relative">
                <input
                  type="number"
                  value={transferCoins}
                  onChange={(e) => setTransferCoins(e.target.value)}
                  placeholder="تعداد سکه"
                  className="w-full px-3 py-2.5 rounded-lg border border-neutral-200 focus:border-neutral-500 focus:ring-2 focus:ring-neutral-100 outline-none text-sm"
                />
                <Coins className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
              <input
                value={transferMsg}
                onChange={(e) => setTransferMsg(e.target.value)}
                placeholder="پیام (اختیاری)"
                maxLength={200}
                className="w-full px-3 py-2.5 rounded-lg border border-neutral-200 focus:border-neutral-500 focus:ring-2 focus:ring-neutral-100 outline-none text-sm"
              />
              </div>
            </div>
            <div className="px-5 py-3.5 border-t border-neutral-100">
              <button
                onClick={handleTransfer}
                disabled={!transferCoins || transferring}
                className="w-full py-2.5 rounded-lg bg-ig-blue text-white text-sm font-bold disabled:opacity-40 hover:bg-ig-blue transition-colors"
              >
                {transferring ? "در حال ارسال..." : transferMode === "GIFT" ? "هدیه بده" : "درخواست کن"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* پنل استیکر */}
      {showStickers && (
        <div className="border-t border-ig-border bg-white px-3 py-3 ig-slide-up pb-[max(0.75rem,env(safe-area-inset-bottom))] shrink-0">
          <div className="grid grid-cols-6 gap-2">
            {STICKERS.map((s) => (
              <button
                key={s}
                onClick={() => sendSticker(s)}
                className="text-2xl hover:scale-125 transition-transform active:scale-90 p-2"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ورودی پیام یا قفل اشتراک یا بلاک یا قفل پیام ادمین یا چت مدیریتی */}
      {isAdminChat ? (
        <div className="px-4 py-6 border-t border-ig-border bg-white text-center shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="w-14 h-14 rounded-full bg-ig-gray-bg mx-auto flex items-center justify-center mb-3">
            <Lock className="w-7 h-7 text-ig-gold" />
          </div>
          <p className="text-sm font-bold text-foreground mb-1">پیام مدیریتی و غیرقابل پاسخ</p>
          <p className="text-xs text-ig-gray mb-4 leading-5">
            این گفتگو توسط مدیر سایت ارسال شده است. شما نمی توانید به این گفتگو پاسخ دهید.
            در صورت نیاز به راهنمایی با پشتیبانی در ارتباط باشید.
          </p>
          <button
            onClick={() => router.push("/dashboard/support")}
            className="px-6 py-2.5 rounded-lg bg-ig-blue text-white text-sm font-bold hover:bg-ig-blue transition-colors"
          >
            تماس با پشتیبانی
          </button>
        </div>
      ) : messageLockInfo ? (
        <div className="px-4 py-6 border-t border-ig-border bg-white text-center shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="w-14 h-14 rounded-full bg-neutral-100 mx-auto flex items-center justify-center mb-3">
            <Lock className="w-7 h-7 text-ig-red" />
          </div>
          <p className="text-sm font-bold text-foreground mb-1">ارسال پیام شما توسط مدیر محدود شده است</p>
          <p className="text-xs text-ig-gray mb-3 leading-5">علت محدودیت شما: {messageLockInfo.reason}</p>
          <div className="inline-flex flex-col items-center gap-1 px-4 py-2.5 rounded-xl bg-neutral-100 border border-neutral-200">
            <p className="text-xs font-bold text-neutral-500">زمان باقی مانده تا بازگشایی</p>
            <p className="text-sm font-black text-neutral-800 tabular-nums tracking-tight" dir="rtl">
              {lockCountdown || "..."}
            </p>
          </div>
          <div className="h-4" />
          <button
            onClick={() => router.push("/dashboard/support")}
            className="px-6 py-2.5 rounded-lg bg-ig-blue text-white text-sm font-bold hover:bg-ig-blue transition-colors"
          >
            ارسال پیام به پشتیبانی
          </button>
        </div>
      ) : isBlocked ? (
        <div className="px-4 py-6 border-t border-ig-border bg-white text-center shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="w-14 h-14 rounded-full bg-neutral-100 mx-auto flex items-center justify-center mb-3">
            <Ban className="w-7 h-7 text-neutral-800" />
          </div>
          <p className="text-sm font-bold text-foreground mb-1">شما {otherName} را بلاک کردید</p>
          <p className="text-xs text-ig-gray mb-4 leading-5">این کاربر دیگر نمی تواند با شما در ارتباط باشد</p>
          <div className="flex gap-2 max-w-xs mx-auto">
            <button
              onClick={async () => {
                setUnblocking(true);
                try {
                  const res = await fetch(`/api/block?blockedId=${otherUserId}`, { method: "DELETE" });
                  if (res.ok) {
                    setIsBlocked(false);
                    toast("بلاک رفع شد", "success");
                  } else {
                    const data = await res.json();
                    toast(data.error ?? "خطایی رخ داد", "error");
                  }
                } catch {
                  toast("خطا در ارتباط با سرور", "error");
                } finally {
                  setUnblocking(false);
                }
              }}
              disabled={unblocking}
              className="flex-1 py-2.5 rounded-lg bg-neutral-100 text-foreground text-sm font-bold disabled:opacity-40 hover:bg-neutral-200 transition-colors"
            >
              {unblocking ? "در حال رفع..." : "رفع بلاک"}
            </button>
            <button
              onClick={() => setShowDeleteConv(true)}
              disabled={deletingConv}
              className="flex-1 py-2.5 rounded-lg bg-ig-blue text-white text-sm font-bold disabled:opacity-40 hover:bg-ig-blue transition-colors"
            >
              {deletingConv ? "در حال حذف..." : "حذف گفتگو"}
            </button>
          </div>
        </div>
      ) : isBlockedByOther ? (
        <div className="px-4 py-6 border-t border-ig-border bg-white text-center shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="w-14 h-14 rounded-full bg-neutral-100 mx-auto flex items-center justify-center mb-3">
            <Ban className="w-7 h-7 text-neutral-800" />
          </div>
          <p className="text-sm font-bold text-foreground mb-1">این کاربر شما را بلاک کرده است</p>
          <p className="text-xs text-ig-gray mb-4 leading-5">امکان گفتگو با این کاربر وجود ندارد</p>
          <div className="flex gap-2 max-w-xs mx-auto">
            <button
              onClick={() => setShowDeleteConv(true)}
              disabled={deletingConv}
              className="flex-1 py-2.5 rounded-lg bg-neutral-100 text-foreground text-sm font-bold disabled:opacity-40 hover:bg-neutral-200 transition-colors"
            >
              {deletingConv ? "در حال حذف..." : "حذف گفتگو"}
            </button>
            <button
              onClick={() => { setShowReportModal(true); }}
              className="flex-1 py-2.5 rounded-lg bg-ig-blue text-white text-sm font-bold hover:bg-ig-blue transition-colors"
            >
              گزارش کاربر
            </button>
          </div>
        </div>
      ) : convDeleted ? (
        <div className="px-4 py-6 border-t border-ig-border bg-white text-center shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="w-14 h-14 rounded-full bg-neutral-100 mx-auto flex items-center justify-center mb-3">
            <X className="w-7 h-7 text-neutral-800" />
          </div>
          <p className="text-sm font-bold text-foreground mb-1">این گفتگو حذف شد</p>
          <p className="text-xs text-ig-gray mb-4 leading-5">گفتگو از لیست شما پنهان شد. در صورت پیام جدید از طرف مقابل، دوباره نمایش داده می شود.</p>
          <button
            onClick={() => router.push("/dashboard/chat")}
            className="px-6 py-2.5 rounded-lg bg-ig-blue text-white text-sm font-bold hover:bg-ig-blue transition-colors"
          >
            بازگشت به لیست چت
          </button>
        </div>
      ) : needSub ? (
        <div className="px-4 py-6 border-t border-ig-border bg-white text-center shrink-0 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <div className="w-14 h-14 rounded-full bg-ig-gray-bg mx-auto flex items-center justify-center mb-3">
            <Crown className="w-7 h-7 text-foreground" strokeWidth={1.8} />
          </div>
          <p className="text-sm font-bold text-foreground mb-1">گفتگو بسته شده است</p>
          <p className="text-xs text-ig-gray mb-4 leading-5">
            {canReopen
              ? "اشتراک شروع کننده این گفتگو تمام شده است. با اشتراک فعال شما می توانید گفتگو را دوباره آغاز کنید."
              : "برای ادامه گفتگو، شروع کننده باید اشتراک فعال داشته باشد. با خرید اشتراک می توانید گفتگو را دوباره آغاز کنید."}
          </p>
          {canReopen ? (
            <button
              type="button"
              onClick={() => setNeedSub(false)}
              className="inline-block px-6 h-10 rounded-lg bg-ig-blue text-white text-sm font-bold hover:bg-ig-blue-hover transition-colors"
            >
              شروع مجدد گفتگو
            </button>
          ) : (
            <Link
              href="/dashboard/subscription"
              className="inline-flex items-center justify-center px-6 h-10 rounded-lg bg-ig-blue text-white text-sm font-bold hover:bg-ig-blue-hover transition-colors"
            >
              خرید اشتراک
            </Link>
          )}
        </div>
      ) : (
        <>
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageUpload} className="hidden" />
          <input ref={videoInputRef} type="file" accept="video/mp4,video/webm" onChange={handleVideoUpload} className="hidden" />

          {recording ? (
            <div className="flex items-center gap-3 px-4 py-3 border-t border-ig-border bg-white pb-[max(0.75rem,env(safe-area-inset-bottom))] shrink-0">
              <span className="w-3 h-3 bg-ig-red rounded-full ig-pulse shrink-0" />
              <span className="text-sm font-bold text-ig-red">
                در حال ضبط... {toPersianDigits(Math.floor(recordTime / 60))}:{toPersianDigits(recordTime % 60).padStart(2, "۰")}
              </span>
              <div className="flex-1" />
              <button
                onClick={stopRecording}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-ig-red text-white text-sm font-bold active:scale-90 transition-transform shrink-0"
              >
                <span className="w-3 h-3 bg-white rounded-sm" />
                ارسال
              </button>
              <button
                onClick={() => { if (mediaRecorderRef.current) { mediaRecorderRef.current.stop(); setRecording(false); } }}
                className="p-2 rounded-full hover:bg-ig-gray-bg transition-colors shrink-0"
              >
                <X className="w-5 h-5 text-ig-gray" />
              </button>
            </div>
          ) : (
            <form
              onSubmit={send}
              className="flex items-center gap-1.5 px-2 sm:px-3 py-2 border-t border-ig-border bg-white pb-[max(0.5rem,env(safe-area-inset-bottom))] shrink-0"
            >
              {/* راست: ایموجی (بیرون باکس) */}
              <button type="button" onClick={() => setShowStickers(!showStickers)} className="p-1.5 shrink-0 active:scale-90 transition-transform">
                <Smile className={`w-5 h-5 ${showStickers ? "text-ig-blue" : "text-foreground"}`} strokeWidth={1.5} />
              </button>

              {/* وسط: input با دکمه attach و ویس/ارسال داخلش */}
              <div className="flex-1 flex items-center gap-1.5 min-w-0 bg-ig-gray-bg rounded-3xl px-3 py-1.5 border border-transparent focus-within:border-ig-blue transition-colors">
                <textarea
                  ref={inputRef}
                  value={text}
                  rows={1}
                  onChange={(e) => {
                    handleTextChange(e.target.value);
                    const el = e.currentTarget;
                    el.style.height = "auto";
                    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send(e);
                    }
                  }}
                  placeholder="پیام بنویس..."
                  maxLength={2000}
                  className="flex-1 min-w-0 bg-transparent outline-none text-sm py-1 resize-none max-h-32 leading-6"
                />
                {/* وقتی متن خالی: گالری عکس + ویس */}
                {!text.trim() ? (
                  <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="p-1.5 shrink-0 active:scale-90 transition-transform disabled:opacity-40">
                    <ImageIcon className="w-5 h-5 text-foreground" strokeWidth={1.5} />
                  </button>
                ) : (
                  <span className="p-1.5 shrink-0 w-5 h-5" />
                )}
                {/* ویس (خالی) یا ارسال (تایپ شده) */}
                {text.trim() ? (
                  <button
                    type="submit"
                    className="p-1.5 shrink-0 rounded-full bg-ig-blue text-white active:scale-90 transition-transform"
                  >
                    <Send className="w-4 h-4" strokeWidth={2} />
                  </button>
                ) : (
                  <button type="button" onClick={startRecording} disabled={uploading} className="p-1.5 shrink-0 rounded-full bg-ig-blue text-white active:scale-90 transition-transform disabled:opacity-40">
                    <Mic className="w-4 h-4" strokeWidth={2} />
                  </button>
                )}
              </div>
            </form>
          )}
        </>
      )}

      {/* مودال long-press پیام */}
      {contextMessage && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 ig-fade-in"
          onClick={() => setContextMessage(null)}
        >
          <div
            className="bg-white rounded-2xl ig-shadow-lg overflow-hidden w-72 ig-modal-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* پیش نمایش پیام */}
            <div className="px-4 py-3 bg-ig-gray-bg border-b border-ig-border">
              <p className="text-xs text-ig-gray truncate">
                {contextMessage.type === "IMAGE" ? "📷 عکس" :
                 contextMessage.type === "VOICE" ? "🎤 پیام صوتی" :
                 contextMessage.type === "VIDEO" ? "🎬 ویدیو" :
                 contextMessage.type === "STICKER" ? "استیکر" : contextMessage.content}
              </p>
            </div>

            {/* گزینه ها */}
            <div className="py-1">
              <button
                onClick={() => {
                  setReplyTo({ id: contextMessage.id, content: contextMessage.content, type: contextMessage.type, senderId: contextMessage.senderId });
                  setContextMessage(null);
                }}
                className="flex items-center gap-3 px-4 py-3 hover:bg-ig-gray-bg w-full text-right transition-colors"
              >
                <span className="w-8 h-8 rounded-full bg-ig-gray-bg flex items-center justify-center shrink-0">
                  <Reply className="w-4 h-4 text-ig-blue" />
                </span>
                <span className="text-sm font-medium text-foreground">پاسخ به پیام</span>
              </button>

              {contextMessage.type !== "IMAGE" && contextMessage.type !== "VIDEO" && contextMessage.type !== "VOICE" && contextMessage.type !== "STICKER" && contextMessage.type !== "SYSTEM" && (
                <button
                  onClick={() => {
                    if (contextMessage.content) {
                      copyToClipboard(contextMessage.content);
                    }
                    setContextMessage(null);
                  }}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-ig-gray-bg w-full text-right transition-colors"
                >
                  <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                    <Copy className="w-4 h-4 text-foreground" />
                  </span>
                  <span className="text-sm font-medium text-foreground">کپی متن</span>
                </button>
              )}

              {contextMessage.senderId !== currentUserId && (
                <button
                  onClick={() => {
                    setReactionFor(contextMessage.id);
                    setContextMessage(null);
                  }}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-ig-gray-bg w-full text-right transition-colors"
                >
                  <span className="w-8 h-8 rounded-full bg-ig-gray-bg flex items-center justify-center shrink-0">
                    <Smile className="w-4 h-4 text-ig-gold" />
                  </span>
                  <span className="text-sm font-medium text-foreground">واکنش نشان بده</span>
                </button>
              )}

              {contextMessage.senderId !== currentUserId && contextMessage.reaction && (
                <button
                  onClick={() => {
                    setReaction(contextMessage.id, null);
                    setContextMessage(null);
                  }}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-ig-gray-bg w-full text-right transition-colors"
                >
                  <span className="w-8 h-8 rounded-full bg-ig-gray-bg flex items-center justify-center shrink-0">
                    <X className="w-4 h-4 text-ig-red" />
                  </span>
                  <span className="text-sm font-medium text-foreground">حذف واکنش</span>
                </button>
              )}

              {contextMessage.senderId !== currentUserId && (
                <button
                  onClick={() => {
                    setReportMessageId(contextMessage.id);
                    setShowReportModal(true);
                    setContextMessage(null);
                  }}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-ig-gray-bg w-full text-right transition-colors"
                >
                  <span className="w-8 h-8 rounded-full bg-ig-gray-bg flex items-center justify-center shrink-0">
                    <Flag className="w-4 h-4 text-ig-red" />
                  </span>
                  <span className="text-sm font-medium text-ig-red">گزارش پیام</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* پنل واکنش ها */}
      {reactionFor && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 ig-fade-in"
          onClick={() => setReactionFor(null)}
        >
          <div
            className="bg-white rounded-2xl ig-shadow-lg p-4 ig-modal-in"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-xs text-ig-gray text-center mb-3 font-medium">یک واکنش انتخاب کن</p>
            <div className="flex items-center gap-2">
              {REACTIONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setReaction(reactionFor, r)}
                  className="text-2xl hover:scale-125 transition-transform active:scale-90 p-2"
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* مودال گزارش کاربر */}
      {showReportModal && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 ig-fade-in"
          onClick={() => setShowReportModal(false)}
        >
          <div
            className="bg-white rounded-2xl ig-shadow-lg w-80 max-w-[90%] ig-modal-in overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-100">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Flag className="w-4 h-4 text-ig-red" />
                گزارش کاربر
              </h3>
              <button onClick={() => setShowReportModal(false)} className="w-8 h-8 rounded-lg hover:bg-neutral-100 flex items-center justify-center transition-colors">
                <X className="w-4 h-4 text-neutral-500" />
              </button>
            </div>
            <div className="px-5 py-4 space-y-2">
              <p className="text-xs text-neutral-500 mb-2">علت گزارش را انتخاب کنید (اجباری)</p>
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
                  className={`w-full px-4 py-2.5 rounded-lg text-sm font-bold text-right transition-colors ${
                    reportReason === r.value
                      ? "bg-ig-blue text-white border border-neutral-800"
                      : "bg-neutral-50 text-foreground border border-transparent hover:bg-neutral-100"
                  }`}
                >
                  {r.label}
                </button>
              ))}
              <textarea
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                placeholder="توضیحات بیشتر (اختیاری)"
                maxLength={500}
                className="w-full mt-2 px-3 py-2 rounded-lg border border-neutral-200 bg-neutral-50 text-sm text-foreground outline-none focus:border-neutral-800 transition-colors resize-none"
                rows={2}
              />
              {/* هشدار بلاک شدن بعد از گزارش */}
              <div className="flex items-start gap-2 mt-3 p-3 rounded-lg bg-ig-gray-bg border border-ig-border">
                <AlertCircle className="w-4 h-4 text-ig-gold shrink-0 mt-0.5" />
                <p className="text-xs text-foreground leading-5">
                  با ارسال گزارش، این کاربر توسط شما بلاک خواهد شد و دیگر نمی توانید با او در ارتباط باشید.
                </p>
              </div>
            </div>
            <div className="px-5 py-3.5 border-t border-neutral-100">
              <button
                onClick={async () => {
                  if (!reportReason) return;
                  setReporting(true);
                  try {
                    const reportRes = await fetch("/api/report", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        reportedId: otherUserId,
                        reason: reportReason,
                        details: reportDetails.trim() || undefined,
                        messageId: reportMessageId ?? undefined,
                      }),
                    });
                    if (reportRes.ok) {
                      // بلاک کردن خودکار بعد از گزارش
                      await fetch("/api/block", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ blockedId: otherUserId }),
                      });
                      toast("گزارش ارسال شد و کاربر بلاک شد", "success");
                      setShowReportModal(false);
                      setReportReason("");
                      setReportDetails("");
                      setReportMessageId(null);
                      setIsBlocked(true);
                    } else {
                      const data = await reportRes.json();
                      toast(data.error ?? "خطایی رخ داد", "error");
                    }
                  } catch {
                    toast("خطا در ارتباط با سرور", "error");
                  } finally {
                    setReporting(false);
                  }
                }}
                disabled={!reportReason || reporting}
                className="w-full py-2.5 rounded-lg bg-ig-blue text-white text-sm font-bold disabled:opacity-40 hover:bg-ig-blue transition-colors"
              >
                {reporting ? "در حال ارسال..." : "ارسال گزارش و بلاک"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* مودال تایید بلاک */}
      {showBlockModal && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 ig-fade-in"
          onClick={() => setShowBlockModal(false)}
        >
          <div
            className="bg-white rounded-2xl ig-shadow-lg w-80 max-w-[90%] ig-modal-in overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-100">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Ban className="w-4 h-4 text-ig-red" />
                بلاک کردن کاربر
              </h3>
              <button onClick={() => setShowBlockModal(false)} className="w-8 h-8 rounded-lg hover:bg-neutral-100 flex items-center justify-center transition-colors">
                <X className="w-4 h-4 text-neutral-500" />
              </button>
            </div>
            <div className="px-5 py-4">
              <div className="flex items-start gap-2 mb-4 p-3 rounded-lg bg-ig-gray-bg border border-ig-border">
                <AlertCircle className="w-4 h-4 text-ig-red shrink-0 mt-0.5" />
                <p className="text-xs text-ig-red leading-5">
                  آیا از بلاک کردن {otherName} مطمئن هستید؟ پس از بلاک، این کاربر نمی تواند با شما در ارتباط باشد.
                </p>
              </div>
            </div>
            <div className="px-5 py-3.5 border-t border-neutral-100 flex gap-2">
              <button
                onClick={() => setShowBlockModal(false)}
                className="flex-1 py-2.5 rounded-lg bg-neutral-100 text-foreground text-sm font-bold hover:bg-neutral-200 transition-colors"
              >
                انصراف
              </button>
              <button
                onClick={async () => {
                  setBlocking(true);
                  try {
                    const res = await fetch("/api/block", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ blockedId: otherUserId }),
                    });
                    if (res.ok) {
                      setShowBlockModal(false);
                      setIsBlocked(true);
                    } else {
                      const data = await res.json();
                      toast(data.error ?? "خطایی رخ داد", "error");
                    }
                  } catch {
                    toast("خطا در ارتباط با سرور", "error");
                  } finally {
                    setBlocking(false);
                  }
                }}
                disabled={blocking}
                className="flex-1 py-2.5 rounded-lg bg-ig-blue text-white text-sm font-bold disabled:opacity-40 hover:bg-ig-blue transition-colors"
              >
                {blocking ? "در حال بلاک..." : "بلاک کن"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* مودال تایید حذف یکطرفه گفتگو */}
      <AlertModal
        open={showDeleteConv}
        variant="error"
        title="حذف گفتگو"
        message={`گفتگو با ${otherName} و تمام پیام های آن برای همیشه از لیست شما حذف می شود. این کار فقط روی حساب شما تاثیر دارد و طرف مقابل همچنان گفتگو را می بیند.`}
        onClose={() => { if (!deletingConv) setShowDeleteConv(false); }}
        onConfirm={handleDeleteConversation}
        confirmLabel={deletingConv ? "در حال حذف..." : "حذف کن"}
      />
    </div>
  );
}

// کامپوننت پخش صوتی
function VoicePlayer({ url, duration, mine }: { url: string; duration: number | null; mine: boolean }) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  function toggle() {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setPlaying(!playing);
  }

  const secs = duration || 0;
  const formatted = `${Math.floor(secs / 60)}:${(secs % 60).toString().padStart(2, "0")}`;

  return (
    <div className={`flex items-center gap-2 min-w-[160px] ${mine ? "text-white" : "text-foreground"}`}>
      <button
        onClick={toggle}
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
          mine ? "bg-white/20" : "bg-ig-gray-bg"
        }`}
      >
        {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
      </button>
      <div className="flex-1">
        <div className={`h-1.5 rounded-full overflow-hidden ${mine ? "bg-white/20" : "bg-ig-border"}`}>
          <div className={`h-full rounded-full ${mine ? "bg-white" : "bg-ig-gray-bg"}`} style={{ width: playing ? "100%" : "30%", transition: "width 0.3s" }} />
        </div>
        <span className={`text-xs mt-0.5 block ${mine ? "text-white/80" : "text-ig-gray"}`}>
          {toPersianDigits(formatted)}
        </span>
      </div>
      <audio
        ref={audioRef}
        src={url}
        onEnded={() => setPlaying(false)}
        className="hidden"
      />
    </div>
  );
}
