"use client";

// اجزای کوچک وضعیت آنلاین — با SSE سراسری لحظه ای به روز می شوند
import { useLivePresence } from "@/lib/presenceClient";
import { formatLastSeen } from "@/lib/format";

// نقطه سبز آنلاین روی آواتار
export function PresenceDot({
  userId,
  initialOnline,
}: {
  userId: string;
  initialOnline: boolean;
}) {
  const { isOnline } = useLivePresence(userId, initialOnline, null);
  if (!isOnline) return null;
  return (
    <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-ig-online rounded-full border-2 border-white ig-pulse" />
  );
}

// متن «آخرین بازدید» — فقط وقتی کاربر آفلاین است نمایش داده می شود
export function PresenceLastSeen({
  userId,
  initialOnline,
  initialLastSeen,
}: {
  userId: string;
  initialOnline: boolean;
  initialLastSeen: string | null;
}) {
  const { isOnline, lastSeen } = useLivePresence(userId, initialOnline, initialLastSeen);
  if (isOnline || !lastSeen) return null;
  return (
    <span className="text-xs text-ig-gray">
      {formatLastSeen(new Date(lastSeen))}
    </span>
  );
}
