// قالب های دلیل رد احراز هویت — مشترک بین پنل ادمین و API
// دلیل رد الزامی است؛ ادمین یکی از این قالب ها را انتخاب می کند و می تواند توضیح تکمیلی بنویسد

export const REJECT_REASONS = [
  { id: "BLURRY_SELFIE", label: "سلفی تار یا تاریک است" },
  { id: "FACE_HIDDEN", label: "چهره کامل دیده نمی شود" },
  { id: "MULTIPLE_PEOPLE", label: "بیش از یک نفر در تصویر است" },
  { id: "CARD_UNREADABLE", label: "کارت ملی ناخوانا است" },
  { id: "NATIONAL_CODE_MISMATCH", label: "کد ملی با مشخصات مطابقت ندارد" },
  { id: "VOICE_UNCLEAR", label: "ویس نامفهوم یا کوتاه است" },
  { id: "DUPLICATE_OR_EXTERNAL", label: "عکس تکراری یا از منبع دیگر است" },
  { id: "OTHER", label: "سایر موارد (توضیح تکمیلی)" },
] as const;

export type RejectReasonId = (typeof REJECT_REASONS)[number]["id"];

export const MAX_REJECT_NOTE_LENGTH = 300;

// تبدیل شناسه قالب و توضیح اختیاری به متن ذخیره شده برای درخواست
export function buildRejectNote(reasonId: string, note?: string): string | null {
  const reason = REJECT_REASONS.find((r) => r.id === reasonId);
  if (!reason) return null;
  const extra = (note ?? "").trim().slice(0, MAX_REJECT_NOTE_LENGTH);
  if (reason.id === "OTHER" && !extra) return null;
  return extra ? `${reason.label} — ${extra}` : reason.label;
}
