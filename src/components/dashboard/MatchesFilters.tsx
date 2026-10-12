"use client";

// نوار فیلتر صفحه جستجو: دکمه های مجزا برای بازه سنی، شهر، قد و عکس دار
import { useState, useEffect, useRef } from "react";
import { Cake, MapPin, Ruler, Image as ImageIcon } from "lucide-react";
import { BottomSheet } from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { cn } from "@/components/ui/cn";
import { toPersianDigits } from "@/lib/format";
import { PROVINCES, PROVINCE_NAMES, provinceOfCity } from "@/lib/iran";

export type Filters = {
  province: string; // "ALL" یعنی همه استان ها
  city: string; // "ALL" یعنی همه شهرهای استان انتخاب شده
  ageMin: string;
  ageMax: string;
  heightMin: string;
  heightMax: string;
  hasPhoto: boolean;
};

export function defaultFilters(city: string, province: string): Filters {
  return {
    province,
    city,
    ageMin: "",
    ageMax: "",
    heightMin: "",
    heightMax: "",
    hasPhoto: false,
  };
}

// بازه های مجاز انتخاب سن و قد
const AGE_OPTIONS = Array.from({ length: 80 - 18 + 1 }, (_, i) => String(i + 18));
const HEIGHT_OPTIONS = Array.from({ length: 230 - 130 + 1 }, (_, i) => String(i + 130));

const selectCls = "w-full h-11 px-3 rounded-lg border border-ig-border bg-ig-gray-bg text-base";

// اطمینان از سازگاری استان با شهر انتخاب شده (برای فیلترهای قدیمی بدون استان)
export function normalizeFilters(f: Filters): Filters {
  let { province } = f;
  const { city } = f;
  if (city !== "ALL" && !PROVINCES[province]?.includes(city)) {
    // استان خالی یا ناسازگار — از روی شهر پیدا می شود
    province = provinceOfCity(city) ?? "ALL";
  }
  if (!province) province = city === "ALL" ? "ALL" : (provinceOfCity(city) ?? "ALL");
  return { ...f, province, city };
}

type SheetKey = "age" | "location" | "height" | null;

export default function MatchesFilters({
  defaultCity,
  defaultProvince,
  value,
  onChange,
}: {
  defaultCity: string;
  defaultProvince: string;
  value: Filters;
  onChange: (f: Filters) => void;
}) {
  const [sheet, setSheet] = useState<SheetKey>(null);
  const [draft, setDraft] = useState<Filters>(value);

  // پیش نویس فقط هنگام باز شدن شیت از مقدار فعلی ساخته می شود (تغییر value در حین ویرایش آن را بازنشانی نکند)
  const valueRef = useRef(value);
  useEffect(() => {
    valueRef.current = value;
  });
  useEffect(() => {
    if (sheet) setDraft(normalizeFilters(valueRef.current));
  }, [sheet]);

  const set = <K extends keyof Filters>(k: K, v: Filters[K]) => setDraft((d) => ({ ...d, [k]: v }));

  // زیرنویس هر دکمه: مقدار انتخاب شده یا «انتخاب نشده»
  const ageActive = !!(value.ageMin || value.ageMax);
  const ageSub = ageActive
    ? `از ${value.ageMin ? toPersianDigits(value.ageMin) : "…"} تا ${value.ageMax ? toPersianDigits(value.ageMax) : "…"}`
    : "انتخاب نشده";
  const locationActive = value.city !== defaultCity || value.province !== defaultProvince;
  // حالت پیش فرض یعنی استان و شهر خود کاربر — همان نمایش داده می شود
  const locationSub = !locationActive
    ? defaultProvince && defaultProvince !== "ALL"
      ? `${defaultProvince} - ${defaultCity}`
      : defaultCity
    : value.city !== "ALL"
      ? value.province !== "ALL"
        ? `${value.province} - ${value.city}`
        : value.city
      : value.province !== "ALL"
        ? `${value.province} - همه شهرها`
        : "همه شهرها";
  const heightActive = !!(value.heightMin || value.heightMax);
  const heightSub = heightActive
    ? `از ${value.heightMin ? toPersianDigits(value.heightMin) : "…"} تا ${value.heightMax ? toPersianDigits(value.heightMax) : "…"}`
    : "انتخاب نشده";

  const pill = (active: boolean) =>
    cn(
      "w-full min-h-9 py-1 px-2.5 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 active:scale-[0.98]",
      active ? "bg-foreground text-white" : "bg-ig-btn2 text-foreground hover:bg-ig-btn2-hover"
    );

  const draftCities = draft.province === "ALL" ? [] : (PROVINCES[draft.province] ?? []);

  const applyBar = (onReset: () => void) => (
    <div className="sticky bottom-0 bg-surface border-t border-ig-divider px-5 py-3 flex gap-2">
      <Button variant="secondary" onClick={onReset}>
        بازنشانی
      </Button>
      <Button
        fullWidth
        onClick={() => {
          onChange(normalizeFilters(draft));
          setSheet(null);
        }}
      >
        اعمال فیلتر
      </Button>
    </div>
  );

  const rangeSelects = (minKey: "ageMin" | "heightMin", maxKey: "ageMax" | "heightMax", options: string[], unit: string) => (
    <div className="grid grid-cols-2 gap-2">
      <div className="space-y-1.5">
        <label htmlFor={`flt-${minKey}`} className="block text-sm font-semibold">
          از ({unit})
        </label>
        <select id={`flt-${minKey}`} value={draft[minKey]} onChange={(e) => set(minKey, e.target.value)} className={selectCls}>
          <option value="">انتخاب کنید</option>
          {options.map((o) => (
            <option key={o} value={o}>
              {toPersianDigits(o)}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <label htmlFor={`flt-${maxKey}`} className="block text-sm font-semibold">
          تا ({unit})
        </label>
        <select id={`flt-${maxKey}`} value={draft[maxKey]} onChange={(e) => set(maxKey, e.target.value)} className={selectCls}>
          <option value="">انتخاب کنید</option>
          {options.map((o) => (
            <option key={o} value={o}>
              {toPersianDigits(o)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );

  return (
    <>
      <div className="px-3 md:px-0 py-2">
        {/* گرید ریسپانسیو — در موبایل دو ستونه و در دسکتاپ چهار ستونه */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            <button onClick={() => setSheet("age")} className={pill(ageActive)}>
              <Cake className="w-3.5 h-3.5 shrink-0" aria-hidden />
              <span className="flex flex-col items-start leading-tight min-w-0">
                <span className="whitespace-nowrap">بازه سنی</span>
                <span className="text-[10px] font-medium opacity-70 truncate max-w-full">{ageSub}</span>
              </span>
            </button>
            <button onClick={() => setSheet("location")} className={pill(locationActive)}>
              <MapPin className="w-3.5 h-3.5 shrink-0" aria-hidden />
              <span className="flex flex-col items-start leading-tight min-w-0">
                <span className="whitespace-nowrap">شهر موردنظر</span>
                <span className="text-[10px] font-medium opacity-70 truncate max-w-full">{locationSub}</span>
              </span>
            </button>
            <button onClick={() => setSheet("height")} className={pill(heightActive)}>
              <Ruler className="w-3.5 h-3.5 shrink-0" aria-hidden />
              <span className="flex flex-col items-start leading-tight min-w-0">
                <span className="whitespace-nowrap">قد موردنظر</span>
                <span className="text-[10px] font-medium opacity-70 truncate max-w-full">{heightSub}</span>
              </span>
            </button>
            <button
              onClick={() => onChange({ ...value, hasPhoto: !value.hasPhoto })}
              aria-pressed={value.hasPhoto}
              className={pill(value.hasPhoto)}
            >
              <ImageIcon className="w-3.5 h-3.5 shrink-0" aria-hidden />
              <span className="flex flex-col items-start leading-tight min-w-0">
                <span className="whitespace-nowrap">عکس دار</span>
                <span className="text-[10px] font-medium opacity-70 truncate max-w-full">{value.hasPhoto ? "فعال" : "انتخاب نشده"}</span>
              </span>
            </button>
        </div>
      </div>

      {/* بازه سنی */}
      <BottomSheet open={sheet === "age"} onClose={() => setSheet(null)} title="بازه سنی">
        <div className="px-5 py-4">{rangeSelects("ageMin", "ageMax", AGE_OPTIONS, "سال")}</div>
        {applyBar(() => setDraft((d) => ({ ...d, ageMin: "", ageMax: "" })))}
      </BottomSheet>

      {/* استان و شهر */}
      <BottomSheet open={sheet === "location"} onClose={() => setSheet(null)} title="شهر موردنظر">
        <div className="px-5 py-4">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <label htmlFor="flt-province" className="block text-sm font-semibold">
                استان
              </label>
              <select
                id="flt-province"
                value={draft.province}
                onChange={(e) => {
                  set("province", e.target.value);
                  // با تغییر استان، شهر به همه شهرهای استان برمی گردد
                  set("city", "ALL");
                }}
                className={selectCls}
              >
                <option value="ALL">همه استان ها</option>
                {PROVINCE_NAMES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="flt-city" className="block text-sm font-semibold">
                شهر
              </label>
              <select
                id="flt-city"
                value={draft.city}
                disabled={draft.province === "ALL"}
                onChange={(e) => set("city", e.target.value)}
                className={cn(selectCls, "disabled:opacity-50")}
              >
                <option value="ALL">همه شهرها</option>
                {draftCities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        {applyBar(() => setDraft((d) => ({ ...d, province: defaultProvince, city: defaultCity })))}
      </BottomSheet>

      {/* قد موردنظر */}
      <BottomSheet open={sheet === "height"} onClose={() => setSheet(null)} title="قد موردنظر">
        <div className="px-5 py-4">{rangeSelects("heightMin", "heightMax", HEIGHT_OPTIONS, "سانتی متر")}</div>
        {applyBar(() => setDraft((d) => ({ ...d, heightMin: "", heightMax: "" })))}
      </BottomSheet>
    </>
  );
}
