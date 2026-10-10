"use client";

// ضبط پیام صوتی برای احراز هویت — ضبط با میکروفون یا انتخاب فایل صوتی
import { useEffect, useMemo, useRef, useState } from "react";
import { Mic, Square, Trash2, FileAudio } from "lucide-react";
import { toPersianDigits } from "@/lib/format";
import { useToast } from "@/components/ToastProvider";

// پیش نمایش فایل با آزادسازی خودکار URL
function useObjectUrl(file: File | null) {
  const url = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => {
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [url]);
  return url;
}

export default function VoiceRecorder({
  value,
  onChange,
}: {
  value: File | null;
  onChange: (f: File | null) => void;
}) {
  const { toast } = useToast();
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const audioUrl = useObjectUrl(value);

  // توقف ضبط هنگام خروج از صفحه
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recorderRef.current && recorderRef.current.state !== "inactive")
        recorderRef.current.stop();
    };
  }, []);

  async function startRecording() {
    if (!navigator.mediaDevices?.getUserMedia) {
      // کانتکست ناامن (http روی IP) — میکروفون فقط روی https/localhost کار می کند
      toast("میکروفون فقط روی اتصال امن (https) در دسترس است", "error");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        if (blob.size >= 1000) {
          onChange(new File([blob], "voice.webm", { type: "audio/webm" }));
        }
      };
      recorder.start();
      recorderRef.current = recorder;
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
      setRecording(true);
    } catch {
      // دسترسی میکروفون رد شد — کاربر می تواند فایل انتخاب کند
    }
  }

  function stopRecording() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recorderRef.current && recording) {
      recorderRef.current.stop();
      setRecording(false);
    }
  }

  const pad = (n: number) => toPersianDigits(String(n).padStart(2, "0"));

  // حالت ضبط
  if (recording) {
    return (
      <div className="border border-ig-red/40 bg-ig-red/5 rounded-xl px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-ig-red animate-pulse" />
          <span className="text-sm font-bold text-ig-red">در حال ضبط...</span>
          <span className="text-sm font-black text-foreground tabular-nums">
            {pad(Math.floor(seconds / 60))}:{pad(seconds % 60)}
          </span>
        </div>
        <button
          type="button"
          onClick={stopRecording}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-ig-red text-white text-xs font-bold active:scale-95 transition-all"
        >
          <Square className="w-3.5 h-3.5" fill="currentColor" />
          پایان ضبط
        </button>
      </div>
    );
  }

  // حالت داشتن فایل — پخش و حذف
  if (value && audioUrl) {
    return (
      <div className="border border-ig-border rounded-xl px-4 py-3 space-y-2.5">
        <audio controls src={audioUrl} className="w-full h-9" />
        <div className="flex items-center justify-between">
          <span className="text-xs text-ig-gray truncate max-w-[60%]" dir="ltr">
            {value.name}
          </span>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="flex items-center gap-1 text-xs font-bold text-ig-red hover:opacity-70 transition-opacity"
          >
            <Trash2 className="w-3.5 h-3.5" />
            حذف و ضبط مجدد
          </button>
        </div>
      </div>
    );
  }

  // حالت اولیه — ضبط یا انتخاب فایل
  return (
    <div className="grid grid-cols-2 gap-2">
      <button
        type="button"
        onClick={startRecording}
        className="border border-dashed border-ig-border rounded-xl py-5 flex flex-col items-center gap-1.5 hover:bg-ig-gray-bg transition-colors"
      >
        <Mic className="w-6 h-6 text-ig-gray" strokeWidth={2} />
        <span className="text-xs text-ig-gray">ضبط صدا</span>
      </button>
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="border border-dashed border-ig-border rounded-xl py-5 flex flex-col items-center gap-1.5 hover:bg-ig-gray-bg transition-colors"
      >
        <FileAudio className="w-6 h-6 text-ig-gray" strokeWidth={2} />
        <span className="text-xs text-ig-gray">انتخاب فایل صوتی</span>
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="audio/webm,audio/mp3,audio/wav,audio/ogg,audio/mpeg,audio/mp4"
        onChange={(e) => onChange(e.target.files?.[0] || null)}
        className="hidden"
      />
    </div>
  );
}
