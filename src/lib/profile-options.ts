// گزینه های مشترک انتخاب قد، وزن و درآمد — هم در ثبت نام و هم در ویرایش پروفایل
import { toPersianDigits } from "@/lib/format";
import type { SelectOption } from "@/components/ui/SelectMenu";

export const HEIGHT_OPTIONS: SelectOption[] = Array.from({ length: 111 }, (_, i) => {
  const v = 120 + i;
  return { value: String(v), label: `${toPersianDigits(v)} سانتی متر` };
});

export const WEIGHT_OPTIONS: SelectOption[] = Array.from({ length: 216 }, (_, i) => {
  const v = 35 + i;
  return { value: String(v), label: `${toPersianDigits(v)} کیلوگرم` };
});

export const INCOME_OPTIONS: SelectOption[] = [
  { value: "0", label: "بدون درآمد" },
  { value: "20000000", label: "۱۰ تا ۳۰ میلیون تومان" },
  { value: "40000000", label: "۳۰ تا ۵۰ میلیون تومان" },
  { value: "75000000", label: "۵۰ تا ۱۰۰ میلیون تومان" },
  { value: "200000000", label: "۱۰۰ تا ۳۰۰ میلیون تومان" },
  { value: "400000000", label: "بیش از ۳۰۰ میلیون تومان" },
];
