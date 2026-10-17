// API مدیریت تنظیمات هر اپ/برند — خواندن ردیف ها و ذخیره override
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin, AuthError } from "@/lib/auth";
import {
  getBrandSettingRows,
  setBrandSetting,
  normalizeAppBrand,
  BRAND_APP_SETTINGS,
  DEFAULT_APP_BRAND,
} from "@/lib/brandSettings";
import { isValidBrandId } from "@/lib/brands";
import { DEFAULT_SETTINGS, type SettingKey } from "@/lib/settings";

const VALID_KEYS = new Set(BRAND_APP_SETTINGS.map((d) => d.key));

function validateBrand(v: string | null | undefined): string | null {
  if (!v) return null;
  if (v === DEFAULT_APP_BRAND || isValidBrandId(v)) return v;
  return null;
}

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const brand = validateBrand(new URL(request.url).searchParams.get("brand")) ?? DEFAULT_APP_BRAND;
    const rows = await getBrandSettingRows(brand);
    return NextResponse.json({ brand, rows });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[admin/app-settings] GET error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

const putSchema = z.object({
  brand: z.string().min(1).max(50),
  key: z.string().min(1).max(100),
  // null یعنی حذف override و بازگشت به تنظیم سراسری
  value: z.string().max(2000).nullable(),
});

export async function PUT(request: Request) {
  try {
    await requireAdmin();
    const parsed = putSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "پارامتر نامعتبر" }, { status: 400 });
    }
    const { key, value } = parsed.data;
    const brand = validateBrand(parsed.data.brand);
    if (!brand) return NextResponse.json({ error: "برند نامعتبر" }, { status: 400 });
    if (!VALID_KEYS.has(key as SettingKey)) {
      return NextResponse.json({ error: "تنظیم نامعتبر" }, { status: 400 });
    }

    // اعتبارسنجی مقدار بر اساس نوع
    if (value !== null) {
      const def = BRAND_APP_SETTINGS.find((d) => d.key === key)!;
      if (def.type === "bool" && value !== "true" && value !== "false") {
        return NextResponse.json({ error: "مقدار باید true یا false باشد" }, { status: 400 });
      }
      if (def.type === "number") {
        const n = parseInt(value, 10);
        if (!/^-?\d+$/.test(value) || Number.isNaN(n) || n < 0 || n > 1_000_000_000) {
          return NextResponse.json({ error: "مقدار عددی نامعتبر" }, { status: 400 });
        }
      }
    }

    await setBrandSetting(brand, key as SettingKey, value);
    console.log(`[admin/app-settings] ${brand} ${key} = ${value ?? "(default)"}`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[admin/app-settings] PUT error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
