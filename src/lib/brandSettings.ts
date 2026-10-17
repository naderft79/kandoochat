// تنظیمات جداگانه هر اپ/برند — مقدار هر تنظیم ابتدا از BrandSetting همان برند
// خوانده می شود و اگر تعریف نشده باشد مقدار سراسری Setting اعمال می شود
import { prisma } from "@/lib/prisma";
import { getAllSettings, DEFAULT_SETTINGS, type SettingKey } from "@/lib/settings";

// شناسه اپ اصلی در جدول BrandSetting — برند پیش فرض (سایت + اپ کندو)
export const DEFAULT_APP_BRAND = "kandoo";

export type BrandSettingType = "bool" | "number" | "text";
export type BrandSettingDef = {
  key: SettingKey; // کلید تنظیم سراسری
  field: string; // نام فیلد camelCase در خروجی getAllSettings
  label: string;
  type: BrandSettingType;
  group: string;
};

// تنظیمات قابل مدیریت جداگانه برای هر اپ — گروه بندی برای نمایش در پنل
export const BRAND_APP_SETTINGS: BrandSettingDef[] = [
  // ─── سکه و مالی ───
  { key: "BUY_COINS_ENABLED", field: "buyCoinsEnabled", label: "خرید سکه", type: "bool", group: "سکه و مالی" },
  { key: "WITHDRAW_COINS_ENABLED", field: "withdrawCoinsEnabled", label: "برداشت سکه", type: "bool", group: "سکه و مالی" },
  { key: "COIN_VALUE", field: "coinValue", label: "قیمت هر سکه (تومان)", type: "number", group: "سکه و مالی" },
  { key: "MIN_WITHDRAW_COINS", field: "minWithdrawCoins", label: "حداقل سکه برای برداشت", type: "number", group: "سکه و مالی" },
  { key: "WITHDRAW_COMMISSION_PERCENT", field: "withdrawCommissionPercent", label: "کارمزد برداشت (٪)", type: "number", group: "سکه و مالی" },
  { key: "MAX_COINS_PER_PURCHASE", field: "maxCoinsPerPurchase", label: "سقف سکه در هر خرید", type: "number", group: "سکه و مالی" },
  { key: "MIN_COINS_FOR_GIFT", field: "minCoinsForGift", label: "حداقل سکه برای هدیه", type: "number", group: "سکه و مالی" },
  { key: "GIFT_TRANSFER_FEE_PERCENT", field: "giftTransferFeePercent", label: "کارمزد انتقال سکه (٪)", type: "number", group: "سکه و مالی" },
  // ─── اشتراک ───
  { key: "BUY_SUBSCRIPTION_ENABLED", field: "buySubscriptionEnabled", label: "خرید اشتراک", type: "bool", group: "اشتراک" },
  { key: "SUBSCRIPTION_PRICE", field: "subscriptionPrice", label: "قیمت اشتراک (تومان)", type: "number", group: "اشتراک" },
  // ─── پاداش و دعوت ───
  { key: "REFERRAL_REWARD_COINS", field: "referralRewardCoins", label: "سکه جایزه دعوت دوستان", type: "number", group: "پاداش و دعوت" },
  { key: "REFERRAL_MILESTONE_COUNT", field: "referralMilestoneCount", label: "تعداد دعوت برای جایزه نقطه عطف", type: "number", group: "پاداش و دعوت" },
  { key: "REFERRAL_MILESTONE_COINS", field: "referralMilestoneCoins", label: "سکه جایزه نقطه عطف", type: "number", group: "پاداش و دعوت" },
  { key: "REFERRAL_DAILY_LIMIT", field: "referralDailyLimit", label: "سقف دعوت روزانه", type: "number", group: "پاداش و دعوت" },
  { key: "REFERRAL_MAX_REWARDED", field: "referralMaxRewarded", label: "سقف دعوت های پاداش دار", type: "number", group: "پاداش و دعوت" },
  { key: "STREAK_REWARD_COINS", field: "streakRewardCoins", label: "سکه جایزه استریک روزانه", type: "number", group: "پاداش و دعوت" },
  // ─── بوست ───
  { key: "BOOST_COST_COINS", field: "boostCostCoins", label: "هزینه بوست (سکه)", type: "number", group: "بوست" },
  { key: "BOOST_DURATION_MINUTES", field: "boostDurationMinutes", label: "مدت بوست (دقیقه)", type: "number", group: "بوست" },
  // ─── لایک و چت ───
  { key: "DAILY_LIKE_LIMIT", field: "dailyLikeLimit", label: "سقف لایک روزانه", type: "number", group: "لایک و چت" },
  { key: "VIP_DAILY_LIKE_LIMIT", field: "vipDailyLikeLimit", label: "سقف لایک روزانه VIP", type: "number", group: "لایک و چت" },
  { key: "SUPER_LIKE_DAILY_LIMIT", field: "superLikeDailyLimit", label: "سقف سوپرلایک روزانه", type: "number", group: "لایک و چت" },
  { key: "SUPER_LIKE_COST_COINS", field: "superLikeCostCoins", label: "هزینه سوپرلایک (سکه)", type: "number", group: "لایک و چت" },
  { key: "LIKE_EXTRA_COST_COINS", field: "likeExtraCostCoins", label: "هزینه لایک اضافه (سکه)", type: "number", group: "لایک و چت" },
  { key: "FREE_DAILY_MESSAGE_LIMIT", field: "freeDailyMessageLimit", label: "سقف پیام رایگان روزانه", type: "number", group: "لایک و چت" },
  { key: "CHAT_START_COST_COINS", field: "chatStartCostCoins", label: "هزینه شروع چت (سکه)", type: "number", group: "لایک و چت" },
  { key: "FREE_MESSAGE_COST_COINS", field: "freeMessageCostCoins", label: "هزینه پیام اضافه (سکه)", type: "number", group: "لایک و چت" },
  { key: "REWIND_COST_COINS", field: "rewindCostCoins", label: "هزینه برگشت (سکه)", type: "number", group: "لایک و چت" },
  { key: "VIP_REWIND_DAILY", field: "vipRewindDaily", label: "تعداد برگشت رایگان VIP", type: "number", group: "لایک و چت" },
  // ─── رسانه در چت ───
  { key: "CHAT_ALLOW_PHOTO", field: "chatAllowPhoto", label: "ارسال عکس در چت", type: "bool", group: "رسانه در چت" },
  { key: "CHAT_ALLOW_VOICE", field: "chatAllowVoice", label: "ارسال ویس در چت", type: "bool", group: "رسانه در چت" },
  { key: "CHAT_ALLOW_VIDEO", field: "chatAllowVideo", label: "ارسال ویدیو در چت", type: "bool", group: "رسانه در چت" },
  { key: "CHAT_MAX_FILE_SIZE_MB", field: "chatMaxFileSizeMb", label: "حداکثر حجم فایل چت (MB)", type: "number", group: "رسانه در چت" },
  { key: "CHAT_MAX_VOICE_SECONDS", field: "chatMaxVoiceSeconds", label: "حداکثر طول ویس (ثانیه)", type: "number", group: "رسانه در چت" },
  // ─── حالت تعمیر ───
  { key: "MAINTENANCE_MODE", field: "maintenanceMode", label: "حالت تعمیرات این اپ", type: "bool", group: "حالت تعمیر" },
  { key: "MAINTENANCE_MESSAGE", field: "maintenanceMessage", label: "پیام حالت تعمیرات", type: "text", group: "حالت تعمیر" },
];

const FIELD_BY_KEY = new Map<string, BrandSettingDef>(BRAND_APP_SETTINGS.map((d) => [d.key, d]));

// کش ۳۰ ثانیه ای override های هر برند
const overridesCache = new Map<string, { map: Map<string, string>; expiry: number }>();
const CACHE_TTL = 30_000;

export function normalizeAppBrand(brandId: string | null | undefined): string {
  return brandId && brandId !== DEFAULT_APP_BRAND ? brandId : DEFAULT_APP_BRAND;
}

async function getOverrides(brandId: string): Promise<Map<string, string>> {
  const cached = overridesCache.get(brandId);
  if (cached && Date.now() < cached.expiry) return cached.map;
  const rows = await prisma.brandSetting.findMany({ where: { brand: brandId } });
  const map = new Map(rows.map((r) => [r.key, r.value]));
  overridesCache.set(brandId, { map, expiry: Date.now() + CACHE_TTL });
  return map;
}

export function invalidateBrandSettingsCache(brandId?: string) {
  if (brandId) overridesCache.delete(brandId);
  else overridesCache.clear();
}

// تنظیمات موثر یک اپ — سراسری + override همان برند
// شکل خروجی دقیقا مثل getAllSettings است و می تواند جایگزین آن شود
export async function getBrandSettings(brandId: string | null | undefined) {
  const base = await getAllSettings();
  const brand = normalizeAppBrand(brandId);
  const overrides = await getOverrides(brand);
  if (overrides.size === 0) return base;

  const result = { ...(base as Record<string, unknown>) };
  for (const [key, value] of overrides) {
    const def = FIELD_BY_KEY.get(key);
    if (!def) continue;
    if (def.type === "bool") result[def.field] = value === "true";
    else if (def.type === "number") {
      const n = parseInt(value, 10);
      if (!Number.isNaN(n)) result[def.field] = n;
    } else result[def.field] = value;
  }
  return result as typeof base;
}

// ردیف های کامل برای پنل ادمین: تعریف + مقدار سراسری + override + مقدار موثر
export async function getBrandSettingRows(brandId: string) {
  const brand = normalizeAppBrand(brandId);
  const [base, overrides] = await Promise.all([getAllSettings(), getOverrides(brand)]);
  return BRAND_APP_SETTINGS.map((def) => {
    const globalCamel = (base as Record<string, unknown>)[def.field];
    const override = overrides.get(def.key) ?? null;
    // مقدار موثر = override یا مقدار سراسری
    const value =
      override !== null
        ? def.type === "bool"
          ? override === "true"
          : def.type === "number"
            ? parseInt(override, 10)
            : override
        : globalCamel;
    return {
      key: def.key,
      field: def.field,
      label: def.label,
      type: def.type,
      group: def.group,
      global: globalCamel,
      override,
      value,
      customized: override !== null,
    };
  });
}

// ذخیره override — value=null یعنی حذف override و بازگشت به مقدار سراسری
export async function setBrandSetting(brandId: string, key: SettingKey, value: string | null) {
  if (!FIELD_BY_KEY.has(key)) throw new Error(`unknown brand setting: ${key}`);
  const brand = normalizeAppBrand(brandId);
  if (value === null) {
    await prisma.brandSetting.deleteMany({ where: { brand, key } });
  } else {
    await prisma.brandSetting.upsert({
      where: { brand_key: { brand, key } },
      update: { value },
      create: { brand, key, value },
    });
  }
  invalidateBrandSettingsCache(brand);
}
