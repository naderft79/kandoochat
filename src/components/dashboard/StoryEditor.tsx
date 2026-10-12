"use client";

// ویرایشگر استوری حرفه ای — شبیه اینستاگرام
// امکانات: نقاشی، متن، استیکر، دکمه انتقال سکه، فیلتر تصویری، drag/resize/rotate
import { useState, useRef, useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { toPersianDigits } from "@/lib/format";
import {
  X, Type, Sticker, Coins, Trash2, Check, Bold, Italic,
  Pencil, Sparkles, Undo2, Eraser, Plus, Crown, TrendingUp, Eye,
} from "lucide-react";

type ElementType = "text" | "coinButton" | "sticker";

type StoryElement = {
  id: string;
  type: ElementType;
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

type Stroke = {
  points: { x: number; y: number }[];
  color: string;
  width: number;
};

type StickerItem = { emoji: string; label: string };

const TEXT_COLORS = [
  "#ffffff", "#000000", "#ff0000", "#ff6b6b", "#ffd93d",
  "#6bcf7f", "#4d96ff", "#c084fc", "#ff9f43", "#ee5a6f",
  "#00d2d3", "#5f27cd",
];

const BG_COLORS = [
  "transparent", "#000000", "#ffffff20", "#ff000040", "#ffd93d40",
  "#4d96ff40", "#c084fc40", "#00000080", "#ffffff80", "#5f27cd80",
];

const DRAW_COLORS = [
  "#ffffff", "#ff0000", "#ffd93d", "#00d2d3", "#ff6b6b",
  "#6bcf7f", "#4d96ff", "#c084fc", "#000000", "#ff9f43",
];

const STICKERS: StickerItem[] = [
  { emoji: "❤️", label: "قلب" }, { emoji: "🔥", label: "آتش" },
  { emoji: "✨", label: "درخشش" }, { emoji: "😍", label: "عشق" },
  { emoji: "🎉", label: "جشن" }, { emoji: "💯", label: "صد" },
  { emoji: "⭐", label: "ستاره" }, { emoji: "💎", label: "الماس" },
  { emoji: "🌹", label: "گل" }, { emoji: "👏", label: "تشویق" },
  { emoji: "🥳", label: "مهمون" }, { emoji: "💪", label: "قدرت" },
  { emoji: "🤩", label: "هیجان" }, { emoji: "🙏", label: "تشکر" },
  { emoji: "💋", label: "بوسه" }, { emoji: "🏆", label: "جام" },
  { emoji: "🎁", label: "هدیه" }, { emoji: "⚡", label: "رعد" },
];

const FILTERS = [
  { id: "none", name: "اصل", css: "none" },
  { id: "grayscale", name: "سیاه سفید", css: "grayscale(1)" },
  { id: "sepia", name: "قهوه ای", css: "sepia(0.8)" },
  { id: "warm", name: "گرم", css: "saturate(1.4) hue-rotate(-10deg) brightness(1.1)" },
  { id: "cool", name: "سرد", css: "saturate(1.2) hue-rotate(15deg) brightness(1.05)" },
  { id: "vintage", name: "قدیمی", css: "sepia(0.4) contrast(1.2) brightness(0.9)" },
  { id: "vivid", name: "زنده", css: "saturate(2) contrast(1.1)" },
  { id: "fade", name: "محو", css: "contrast(0.8) brightness(1.1) saturate(0.7)" },
  { id: "noir", name: "نوار", css: "grayscale(1) contrast(1.4) brightness(0.9)" },
  { id: "drama", name: "درام", css: "contrast(1.5) saturate(1.3) brightness(0.95)" },
];

let elementIdCounter = 0;

type Tool = "elements" | "text" | "draw" | "stickers" | "filters";

export default function StoryEditor({
  imageUrl,
  onClose,
  onPublish,
}: {
  imageUrl: string;
  onClose: () => void;
  onPublish: (data: { url: string; elements: string; filter: string }) => Promise<void>;
}) {
  const [elements, setElements] = useState<StoryElement[]>([]);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<Tool>("elements");
  const [textValue, setTextValue] = useState("");
  const [drawColor, setDrawColor] = useState("#ffffff");
  const [drawWidth, setDrawWidth] = useState(4);
  const [activeFilter, setActiveFilter] = useState("none");
  const [publishing, setPublishing] = useState(false);
  const mounted = useSyncExternalStore(
    (cb) => { cb(); return () => {}; },
    () => true,
    () => false
  );
  const [goldenActive, setGoldenActive] = useState(false);
  const [showGoldenModal, setShowGoldenModal] = useState(false);
  const [goldenLoading, setGoldenLoading] = useState(false);
  const [goldenError, setGoldenError] = useState("");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const dragRef = useRef<{
    id: string; startX: number; startY: number;
    origX: number; origY: number; mode: "drag" | "resize" | "rotate";
  } | null>(null);
  const drawingRef = useRef<{
    points: { x: number; y: number }[];
    color: string;
    width: number;
  } | null>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    fetch("/api/golden-story")
      .then((r) => r.json())
      .then((data) => {
        if (data.active) {
          setGoldenActive(true);
        }
      })
      .catch(() => {});
  }, []);

  async function activateGolden() {
    setGoldenLoading(true);
    setGoldenError("");
    try {
      const res = await fetch("/api/golden-story", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setGoldenActive(true);
        setShowGoldenModal(false);
      } else {
        setGoldenError(data.error || "خطا");
      }
    } finally {
      setGoldenLoading(false);
    }
  }

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;
    img.onload = () => { imgRef.current = img; };
  }, [imageUrl]);

  // --- مدیریت عناصر ---
  function addText() {
    if (!textValue.trim()) return;
    const id = `el_${++elementIdCounter}`;
    setElements((prev) => [...prev, {
      id, type: "text", text: textValue.trim(),
      x: 50, y: 50, scale: 1, color: "#ffffff", bgColor: "transparent",
      fontSize: 24, bold: false, italic: false, rotation: 0,
    }]);
    setSelectedId(id);
    setTextValue("");
    setActiveTool("elements");
  }

  function addCoinButton() {
    const id = `el_${++elementIdCounter}`;
    setElements((prev) => [...prev, {
      id, type: "coinButton", text: "انتقال سکه",
      x: 50, y: 80, scale: 1, color: "#000000", bgColor: "#ffd700",
      fontSize: 18, bold: true, italic: false, rotation: 0,
    }]);
    setSelectedId(id);
    setActiveTool("elements");
  }

  function addSticker(emoji: string) {
    const id = `el_${++elementIdCounter}`;
    setElements((prev) => [...prev, {
      id, type: "sticker", text: emoji,
      x: 50, y: 50, scale: 1, color: "#ffffff", bgColor: null,
      fontSize: 48, bold: false, italic: false, rotation: 0,
    }]);
    setSelectedId(id);
    setActiveTool("elements");
  }

  function deleteElement(id: string) {
    setElements((prev) => prev.filter((e) => e.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  function updateElement(id: string, updates: Partial<StoryElement>) {
    setElements((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
  }

  // --- drag / resize / rotate ---
  function startDrag(e: React.PointerEvent, el: StoryElement, mode: "drag" | "resize" | "rotate") {
    e.stopPropagation();
    e.preventDefault();
    setSelectedId(el.id);
    dragRef.current = {
      id: el.id, startX: e.clientX, startY: e.clientY,
      origX: el.x, origY: el.y, mode,
    };
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const dx = ((e.clientX - dragRef.current.startX) / rect.width) * 100;
    const dy = ((e.clientY - dragRef.current.startY) / rect.height) * 100;
    const { id, mode, origX, origY } = dragRef.current;

    if (mode === "drag") {
      updateElement(id, {
        x: Math.max(5, Math.min(95, origX + dx)),
        y: Math.max(5, Math.min(95, origY + dy)),
      });
    } else if (mode === "resize") {
      const dist = Math.sqrt(dx * dx + dy * dy);
      const direction = dy < 0 || dx > 0 ? 1 : -1;
      const el = elements.find((e) => e.id === id);
      if (el) {
        const newScale = Math.max(0.3, Math.min(5, el.scale + direction * dist * 0.012));
        updateElement(id, { scale: newScale });
      }
    } else if (mode === "rotate") {
      const el = elements.find((e) => e.id === id);
      if (el) {
        const centerX = (el.x / 100) * rect.width;
        const centerY = (el.y / 100) * rect.height;
        const angle = Math.atan2(e.clientY - rect.top - centerY, e.clientX - rect.left - centerX);
        const deg = (angle * 180) / Math.PI + 90;
        updateElement(id, { rotation: Math.round(deg) });
      }
    }
  }

  function endDrag() { dragRef.current = null; }

  // --- نقاشی ---
  function startDrawing(e: React.PointerEvent) {
    if (activeTool !== "draw" || !containerRef.current) return;
    e.preventDefault();
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    drawingRef.current = { points: [{ x, y }], color: drawColor, width: drawWidth };
  }

  function continueDrawing(e: React.PointerEvent) {
    if (!drawingRef.current || !containerRef.current) return;
    e.preventDefault();
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    drawingRef.current.points.push({ x, y });

    const canvas = drawCanvasRef.current;
    if (canvas) {
      canvas.width = rect.width;
      canvas.height = rect.height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = drawingRef.current.color;
        ctx.lineWidth = drawingRef.current.width;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        const pts = drawingRef.current.points;
        ctx.beginPath();
        ctx.moveTo((pts[0].x / 100) * canvas.width, (pts[0].y / 100) * canvas.height);
        for (let i = 1; i < pts.length; i++) {
          ctx.lineTo((pts[i].x / 100) * canvas.width, (pts[i].y / 100) * canvas.height);
        }
        ctx.stroke();
      }
    }
  }

  function endDrawing() {
    if (drawingRef.current && drawingRef.current.points.length > 1) {
      const completed = { ...drawingRef.current, points: [...drawingRef.current.points] };
      setStrokes((prev) => [...prev, completed]);
    }
    drawingRef.current = null;
    const canvas = drawCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  function undoLast() {
    if (strokes.length > 0) {
      setStrokes((prev) => prev.slice(0, -1));
    } else if (elements.length > 0) {
      setElements((prev) => prev.slice(0, -1));
      setSelectedId(null);
    }
  }

  function clearDrawing() {
    setStrokes([]);
  }

  // --- رندر نقاشی های ذخیره شده ---
  useEffect(() => {
    if (!containerRef.current || activeTool !== "draw") return;
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const rect = containerRef.current.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const stroke of strokes) {
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      const pts = stroke.points;
      ctx.moveTo((pts[0].x / 100) * canvas.width, (pts[0].y / 100) * canvas.height);
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo((pts[i].x / 100) * canvas.width, (pts[i].y / 100) * canvas.height);
      }
      ctx.stroke();
    }
  }, [strokes, activeTool]);

  // --- انتشار ---
  async function handlePublish() {
    if (!imgRef.current || !canvasRef.current) return;
    setPublishing(true);
    const img = imgRef.current;
    const canvas = canvasRef.current;
    const maxW = 1080;
    const maxH = 1920;
    const ratio = img.width / img.height;
    let cw = maxW, ch = maxW / ratio;
    if (ch > maxH) { ch = maxH; cw = maxH * ratio; }
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext("2d");
    if (!ctx) { setPublishing(false); return; }

    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, cw, ch);

    const filterCss = FILTERS.find((f) => f.id === activeFilter)?.css || "none";
    ctx.filter = filterCss === "none" ? "none" : filterCss;

    const imgRatio = img.width / img.height;
    const canvasRatio = cw / ch;
    let dw, dh, dx, dy;
    if (imgRatio > canvasRatio) {
      dh = ch; dw = dh * imgRatio; dx = (cw - dw) / 2; dy = 0;
    } else {
      dw = cw; dh = dw / imgRatio; dx = 0; dy = (ch - dh) / 2;
    }
    ctx.drawImage(img, dx, dy, dw, dh);
    ctx.filter = "none";

    // رسم نقاشی ها
    for (const stroke of strokes) {
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width * (cw / 400);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      const pts = stroke.points;
      ctx.moveTo((pts[0].x / 100) * cw, (pts[0].y / 100) * ch);
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo((pts[i].x / 100) * cw, (pts[i].y / 100) * ch);
      }
      ctx.stroke();
    }

    // رسم عناصر در canvas انجام نمی شود — فقط metadata ذخیره می شود
    // تا در StoryViewer دقیقا با همون استایل و جایگاه نمایش داده شود

    const elementsData = JSON.stringify({ elements, strokes, filter: activeFilter });

    canvas.toBlob(async (blob) => {
      if (!blob) { setPublishing(false); return; }
      try {
        const formData = new FormData();
        formData.append("file", blob, `story-${Date.now()}.jpg`);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (res.ok && data.url) {
          await onPublish({ url: data.url, elements: elementsData, filter: activeFilter });
        }
      } catch { /* خطا */ }
      finally { setPublishing(false); }
    }, "image/jpeg", 0.92);
  }

  const selectedEl = elements.find((e) => e.id === selectedId) || null;
  const currentFilterCss = FILTERS.find((f) => f.id === activeFilter)?.css || "none";

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-black flex flex-col"
      onPointerMove={(e) => { handlePointerMove(e); continueDrawing(e); }}
      onPointerUp={() => { endDrag(); endDrawing(); }}
      onPointerLeave={() => { endDrag(); endDrawing(); }}
    >
      {/* نوار بالا */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0 z-10">
        <button onClick={onClose} className="w-10 h-10 rounded-full bg-surface/10 flex items-center justify-center active:scale-90 transition-transform">
          <X className="w-5 h-5 text-white" />
        </button>
        <div className="flex items-center gap-2">
          <button onClick={undoLast} disabled={elements.length === 0 && strokes.length === 0}
            className="w-10 h-10 rounded-full bg-surface/10 flex items-center justify-center active:scale-90 transition-transform disabled:opacity-30">
            <Undo2 className="w-5 h-5 text-white" />
          </button>
          <span className="text-white text-sm font-bold mr-1">ویرایش استوری</span>
        </div>
        <button onClick={handlePublish} disabled={publishing}
          className="px-4 py-2 rounded-full bg-ig-blue text-white text-sm font-bold active:scale-95 transition-transform disabled:opacity-50 flex items-center gap-1.5">
          {publishing ? (
            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />ارسال...</>
          ) : (
            <><Check className="w-4 h-4" />انتشار</>
          )}
        </button>
      </div>

      {/* بوم استوری */}
      <div className="flex-1 flex items-center justify-center overflow-hidden relative">
        <div
          ref={containerRef}
          className="relative max-h-full max-w-full touch-none"
          style={{ aspectRatio: "9/16", height: "100%" }}
          onPointerDown={(e) => { if (activeTool !== "draw") setSelectedId(null); startDrawing(e); }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt="story" className="w-full h-full object-contain pointer-events-none" draggable={false}
            style={{ filter: currentFilterCss === "none" ? undefined : currentFilterCss }} />

          <canvas ref={drawCanvasRef}
            className={`absolute inset-0 w-full h-full pointer-events-none ${activeTool === "draw" ? "cursor-crosshair" : ""}`} />

          {elements.map((el) => (
            <div key={el.id}
              onPointerDown={(e) => { if (activeTool === "draw") return; startDrag(e, el, "drag"); }}
              onClick={(e) => { e.stopPropagation(); if (activeTool !== "draw") setSelectedId(el.id); }}
              className={`absolute cursor-move select-none touch-none ${selectedId === el.id && activeTool !== "draw" ? "ring-2 ring-ig-border" : ""} ${activeTool === "draw" ? "pointer-events-none" : ""}`}
              style={{ left: `${el.x}%`, top: `${el.y}%`, transform: `translate(-50%, -50%) rotate(${el.rotation}deg) scale(${el.scale})`, transformOrigin: "center center" }}>
              {el.type === "sticker" ? (
                <span style={{ fontSize: `${el.fontSize}px`, lineHeight: 1 }}>{el.text}</span>
              ) : el.type === "coinButton" ? (
                <span style={{ fontSize: `${el.fontSize}px`, color: el.color, backgroundColor: el.bgColor || "#ffd700", fontWeight: el.bold ? "bold" : "normal", fontStyle: el.italic ? "italic" : "normal", padding: "0.4em 0.8em", borderRadius: "9999px", whiteSpace: "nowrap", display: "inline-block" }}>{el.text}</span>
              ) : (
                <span style={{ fontSize: `${el.fontSize}px`, color: el.color, backgroundColor: el.bgColor && el.bgColor !== "transparent" ? el.bgColor : "transparent", fontWeight: el.bold ? "bold" : "normal", fontStyle: el.italic ? "italic" : "normal", padding: el.bgColor && el.bgColor !== "transparent" ? "0.2em 0.4em" : "0", borderRadius: "0.3em", whiteSpace: "nowrap", display: "inline-block", textShadow: el.bgColor === "transparent" ? "0 1px 3px rgba(0,0,0,0.6)" : "none" }}>{el.text}</span>
              )}
              {selectedId === el.id && activeTool !== "draw" && (
                <>
                  <div onPointerDown={(e) => startDrag(e, el, "resize")}
                    className="absolute -bottom-8 -right-8 w-8 h-8 rounded-full bg-ig-blue border-2 border-white flex items-center justify-center touch-none z-20"
                    style={{ transform: `scale(${1 / el.scale})` }}>
                    <Plus className="w-4 h-4 text-white" />
                  </div>
                  <div onPointerDown={(e) => startDrag(e, el, "rotate")}
                    className="absolute -top-8 -left-8 w-8 h-8 rounded-full bg-ig-blue border-2 border-white flex items-center justify-center touch-none z-20"
                    style={{ transform: `scale(${1 / el.scale})` }}>
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <div onClick={(e) => { e.stopPropagation(); deleteElement(el.id); }}
                    className="absolute -top-8 -right-8 w-8 h-8 rounded-full bg-ig-red border-2 border-white flex items-center justify-center z-20"
                    style={{ transform: `scale(${1 / el.scale})` }}>
                    <Trash2 className="w-4 h-4 text-white" />
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* پنل ویرایش عنصر */}
      {selectedEl && activeTool === "elements" && (
        <div className="shrink-0 bg-surface/10 backdrop-blur-md px-4 py-3 max-h-[35vh] overflow-y-auto">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-white text-xs font-bold">{selectedEl.type === "text" ? "متن" : selectedEl.type === "coinButton" ? "دکمه سکه" : "استیکر"}</span>
            <button onClick={() => deleteElement(selectedEl.id)} className="mr-auto text-ig-red text-xs flex items-center gap-1">
              <Trash2 className="w-3.5 h-3.5" />حذف
            </button>
          </div>
          {selectedEl.type !== "sticker" && (
            <input type="text" value={selectedEl.text} onChange={(e) => updateElement(selectedEl.id, { text: e.target.value })}
              className="w-full bg-surface/10 text-white text-sm rounded-lg px-3 py-2 mb-2 outline-none border border-white/20 focus:border-ig-border" placeholder="متن..." />
          )}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-white/70 text-xs w-12">سایز</span>
            <input type="range" min="0.3" max="5" step="0.1" value={selectedEl.scale} onChange={(e) => updateElement(selectedEl.id, { scale: parseFloat(e.target.value) })} className="flex-1 accent-blue-500" />
            <span className="text-white/70 text-xs w-10 text-left">{selectedEl.scale.toFixed(1)}x</span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-white/70 text-xs w-12">چرخش</span>
            <input type="range" min="-180" max="180" step="5" value={selectedEl.rotation} onChange={(e) => updateElement(selectedEl.id, { rotation: parseInt(e.target.value) })} className="flex-1 accent-blue-500" />
            <span className="text-white/70 text-xs w-10 text-left">{selectedEl.rotation}°</span>
          </div>
          {selectedEl.type !== "sticker" && (
            <>
              <div className="mb-2">
                <span className="text-white/70 text-xs">رنگ متن</span>
                <div className="flex gap-1.5 mt-1 flex-wrap">
                  {TEXT_COLORS.map((c) => (
                    <button key={c} onClick={() => updateElement(selectedEl.id, { color: c })} className={`w-7 h-7 rounded-full border-2 ${selectedEl.color === c ? "border-ig-border" : "border-white/30"}`} style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
              <div className="mb-2">
                <span className="text-white/70 text-xs">پس زمینه</span>
                <div className="flex gap-1.5 mt-1 flex-wrap">
                  {BG_COLORS.map((c) => (
                    <button key={c} onClick={() => updateElement(selectedEl.id, { bgColor: c })} className={`w-7 h-7 rounded-full border-2 ${selectedEl.bgColor === c ? "border-ig-border" : "border-white/30"} ${c === "transparent" ? "bg-transparent" : ""}`}
                      style={{ backgroundColor: c === "transparent" ? undefined : c, backgroundImage: c === "transparent" ? "linear-gradient(45deg, #444 25%, transparent 25%, transparent 75%, #444 75%), linear-gradient(45deg, #444 25%, transparent 25%, transparent 75%, #444 75%)" : undefined, backgroundSize: c === "transparent" ? "8px 8px" : undefined, backgroundPosition: c === "transparent" ? "0 0, 4px 4px" : undefined }} />
                  ))}
                </div>
              </div>
              <div className="flex gap-2 mb-2">
                <button onClick={() => updateElement(selectedEl.id, { bold: !selectedEl.bold })} className={`w-9 h-9 rounded-lg flex items-center justify-center ${selectedEl.bold ? "bg-ig-blue" : "bg-surface/10"}`}>
                  <Bold className="w-4 h-4 text-white" />
                </button>
                <button onClick={() => updateElement(selectedEl.id, { italic: !selectedEl.italic })} className={`w-9 h-9 rounded-lg flex items-center justify-center ${selectedEl.italic ? "bg-ig-blue" : "bg-surface/10"}`}>
                  <Italic className="w-4 h-4 text-white" />
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* پنل متن */}
      {activeTool === "text" && (
        <div className="shrink-0 bg-surface/10 backdrop-blur-md px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <input type="text" value={textValue} onChange={(e) => setTextValue(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addText(); }} autoFocus placeholder="متن خود را بنویسید..." className="flex-1 bg-surface/10 text-white text-sm rounded-lg px-3 py-2 outline-none border border-white/20 focus:border-ig-border" />
            <button onClick={addText} className="w-9 h-9 rounded-full bg-ig-blue flex items-center justify-center active:scale-90 transition-transform">
              <Check className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      )}

      {/* پنل نقاشی */}
      {activeTool === "draw" && (
        <div className="shrink-0 bg-surface/10 backdrop-blur-md px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-white/70 text-xs">رنگ</span>
            <div className="flex gap-1.5 flex-wrap">
              {DRAW_COLORS.map((c) => (
                <button key={c} onClick={() => setDrawColor(c)} className={`w-7 h-7 rounded-full border-2 ${drawColor === c ? "border-ig-border" : "border-white/30"}`} style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-white/70 text-xs w-12">ضخامت</span>
            <input type="range" min="1" max="20" step="1" value={drawWidth} onChange={(e) => setDrawWidth(parseInt(e.target.value))} className="flex-1 accent-blue-500" />
            <span className="text-white/70 text-xs w-6 text-left">{drawWidth}</span>
          </div>
          <div className="flex gap-2">
            <button onClick={clearDrawing} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface/10 text-white text-xs active:scale-95 transition-transform">
              <Eraser className="w-3.5 h-3.5" />پاک کردن نقاشی
            </button>
          </div>
        </div>
      )}

      {/* پنل استیکر */}
      {activeTool === "stickers" && (
        <div className="shrink-0 bg-surface/10 backdrop-blur-md px-4 py-3 max-h-[30vh] overflow-y-auto">
          <div className="grid grid-cols-6 gap-2 mb-3">
            {STICKERS.map((s) => (
              <button key={s.emoji} onClick={() => addSticker(s.emoji)} className="aspect-square rounded-xl bg-surface/10 flex items-center justify-center text-2xl active:scale-90 transition-transform">{s.emoji}</button>
            ))}
          </div>
          <button onClick={addCoinButton} className="w-full py-2.5 rounded-xl bg-ig-blue text-white text-sm font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform">
            <Coins className="w-4 h-4" />افزودن دکمه انتقال سکه
          </button>
        </div>
      )}

      {/* پنل فیلتر */}
      {activeTool === "filters" && (
        <div className="shrink-0 bg-surface/10 backdrop-blur-md px-4 py-3">
          <div className="flex gap-3 overflow-x-auto no-scrollbar">
            {FILTERS.map((f) => (
              <button key={f.id} onClick={() => setActiveFilter(f.id)} className="flex flex-col items-center gap-1.5 shrink-0 active:scale-95 transition-transform">
                <div className={`w-16 h-16 rounded-xl overflow-hidden border-2 ${activeFilter === f.id ? "border-ig-border" : "border-white/20"}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageUrl} alt={f.name} className="w-full h-full object-cover" style={{ filter: f.css === "none" ? undefined : f.css }} />
                </div>
                <span className={`text-xs ${activeFilter === f.id ? "text-ig-blue font-bold" : "text-white/70"}`}>{f.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* نوار ابزار پایین */}
      {activeTool === "elements" && !selectedEl && (
        <div className="shrink-0 flex items-center justify-center gap-4 py-4 bg-black/40 backdrop-blur-md">
          <button onClick={() => setActiveTool("text")} className="flex flex-col items-center gap-1 active:scale-95 transition-transform">
            <div className="w-12 h-12 rounded-full bg-surface/10 flex items-center justify-center"><Type className="w-5 h-5 text-white" /></div>
            <span className="text-white/70 text-xs">متن</span>
          </button>
          <button onClick={() => setActiveTool("draw")} className="flex flex-col items-center gap-1 active:scale-95 transition-transform">
            <div className="w-12 h-12 rounded-full bg-surface/10 flex items-center justify-center"><Pencil className="w-5 h-5 text-white" /></div>
            <span className="text-white/70 text-xs">نقاشی</span>
          </button>
          <button onClick={() => setActiveTool("stickers")} className="flex flex-col items-center gap-1 active:scale-95 transition-transform">
            <div className="w-12 h-12 rounded-full bg-surface/10 flex items-center justify-center"><Sticker className="w-5 h-5 text-white" /></div>
            <span className="text-white/70 text-xs">استیکر</span>
          </button>
          <button onClick={() => setActiveTool("filters")} className="flex flex-col items-center gap-1 active:scale-95 transition-transform">
            <div className="w-12 h-12 rounded-full bg-surface/10 flex items-center justify-center"><Sparkles className="w-5 h-5 text-white" /></div>
            <span className="text-white/70 text-xs">فیلتر</span>
          </button>
          <button onClick={addCoinButton} className="flex flex-col items-center gap-1 active:scale-95 transition-transform">
            <div className="w-12 h-12 rounded-full bg-ig-gold flex items-center justify-center"><Coins className="w-5 h-5 text-foreground" /></div>
            <span className="text-white/70 text-xs">سکه</span>
          </button>
          <button onClick={() => setShowGoldenModal(true)} className="flex flex-col items-center gap-1 active:scale-95 transition-transform">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${goldenActive ? "bg-ig-gray-bg shadow-lg shadow-amber-400/30" : "bg-surface/10"}`}>
              <Crown className={`w-5 h-5 ${goldenActive ? "text-white" : "text-ig-gold"}`} fill={goldenActive ? "currentColor" : "none"} />
            </div>
            <span className={`text-xs ${goldenActive ? "text-ig-gold font-bold" : "text-white/70"}`}>{goldenActive ? "طلایی" : "طلایی"}</span>
          </button>
        </div>
      )}

      {/* دکمه بازگشت */}
      {activeTool !== "elements" && !selectedEl && (
        <div className="shrink-0 flex items-center justify-center py-3 bg-black/40 backdrop-blur-md">
          <button onClick={() => setActiveTool("elements")} className="px-4 py-2 rounded-full bg-surface/10 text-white text-sm font-bold active:scale-95 transition-transform">بازگشت</button>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />

      {/* مودال استوری طلایی */}
      {showGoldenModal && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setShowGoldenModal(false)}
        >
          <div
            className="bg-surface rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {goldenActive ? (
              <>
                <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-ig-gray-bg shadow-lg shadow-amber-200">
                  <Crown className="w-9 h-9 text-white" fill="currentColor" />
                </div>
                <h2 className="text-lg font-bold text-foreground mb-2">استوری طلایی فعال است</h2>
                <p className="text-sm text-ig-gray mb-4">
                  استوری شما پس از انتشار به صورت طلایی نمایش داده می‌شود.
                </p>
                <button
                  onClick={() => setShowGoldenModal(false)}
                  className="w-full py-3 rounded-xl bg-ig-blue text-white text-sm font-bold active:scale-95 transition-transform"
                >
                  ادامه
                </button>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-ig-gray-bg shadow-lg shadow-amber-200">
                  <Crown className="w-9 h-9 text-white" fill="currentColor" />
                </div>

                <h2 className="text-lg font-bold text-foreground mb-2">استوری طلایی</h2>

                <p className="text-sm text-ig-gray mb-4 leading-6">
                  با خرید استوری طلایی، استوری شما برای مدت ۲۴ ساعت ویژه می‌شود:
                </p>

                <div className="space-y-3 mb-6 text-right">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-ig-gray-bg flex items-center justify-center shrink-0 mt-0.5">
                      <TrendingUp className="w-4 h-4 text-ig-gold" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">نمایش اولویت دار</p>
                      <p className="text-xs text-ig-gray">استوری شما در صدر لیست استوری کاربران نمایش داده می‌شود</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-ig-gray-bg flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles className="w-4 h-4 text-ig-gold" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">رینگ طلایی خاص</p>
                      <p className="text-xs text-ig-gray">استوری شما با یک رینگ طلایی فوق خاص و درخشان برای همه کاربران نمایش داده می‌شود</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-ig-gray-bg flex items-center justify-center shrink-0 mt-0.5">
                      <Eye className="w-4 h-4 text-ig-gold" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">بازدید بیشتر</p>
                      <p className="text-xs text-ig-gray">استوری طلایی بازدید بیشتری دریافت می‌کند و بیشتر دیده می‌شود</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-ig-gray-bg flex items-center justify-center">
                    <Coins className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-lg font-black text-ig-gold">{toPersianDigits(100)}</span>
                  <span className="text-sm text-ig-gray">سکه</span>
                </div>

                {goldenError && (
                  <p className="text-xs text-ig-red mb-3">{goldenError}</p>
                )}

                <button
                  onClick={activateGolden}
                  disabled={goldenLoading}
                  className="w-full py-3 rounded-xl bg-ig-blue text-white text-sm font-bold transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {goldenLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      در حال خرید...
                    </>
                  ) : (
                    <>
                      <Crown className="w-4 h-4" fill="currentColor" />
                      خرید و فعال سازی
                    </>
                  )}
                </button>

                <button
                  onClick={() => setShowGoldenModal(false)}
                  className="w-full py-2 mt-2 text-sm text-neutral-400 font-medium"
                >
                  انصراف
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
