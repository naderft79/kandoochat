// API مدیریت ربات تشویقی — دریافت آمار، اجرای دستی، مدیریت قالب ها
import { NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth";
import { runBotCycle, getBotStats } from "@/lib/bot";
import { BOT_TEMPLATES, TEMPLATES_BY_CATEGORY, CATEGORY_LABELS, BotTemplateCategory } from "@/lib/botTemplates";
import { getAllSettings, setSetting, invalidateSettingsCache } from "@/lib/settings";

// GET — دریافت آمار ربات و قالب ها و تنظیمات
export async function GET() {
  try {
    await requireAdmin();
    const [stats, settings] = await Promise.all([
      getBotStats(),
      getAllSettings(),
    ]);

    const templatesByCategory = Object.keys(TEMPLATES_BY_CATEGORY).reduce((acc, key) => {
      const cat = key as BotTemplateCategory;
      acc[cat] = {
        label: CATEGORY_LABELS[cat],
        count: TEMPLATES_BY_CATEGORY[cat].length,
        templates: TEMPLATES_BY_CATEGORY[cat].map((t) => ({ id: t.id, text: t.text, senderGender: t.senderGender, targetGender: t.targetGender })),
      };
      return acc;
    }, {} as Record<string, { label: string; count: number; templates: { id: string; text: string; senderGender: string; targetGender: string }[] }>);

    return NextResponse.json({
      stats,
      settings: {
        botEnabled: settings.botEnabled,
        botIntervalMinutes: settings.botIntervalMinutes,
        botMessagesPerRun: settings.botMessagesPerRun,
        botActiveHoursStart: settings.botActiveHoursStart,
        botActiveHoursEnd: settings.botActiveHoursEnd,
        botCooldownHours: settings.botCooldownHours,
        botTargetNewUsers: settings.botTargetNewUsers,
        botTargetOldUsers: settings.botTargetOldUsers,
        botTargetInactive: settings.botTargetInactive,
        botTargetNoPhoto: settings.botTargetNoPhoto,
        botTargetNoBio: settings.botTargetNoBio,
        botTargetNoSubscription: settings.botTargetNoSubscription,
        botTargetWithSubscription: settings.botTargetWithSubscription,
        botTargetGender: settings.botTargetGender,
        botTargetMinAge: settings.botTargetMinAge,
        botTargetMaxAge: settings.botTargetMaxAge,
        botTargetCity: settings.botTargetCity,
        botTargetMinConversations: settings.botTargetMinConversations,
        botTargetMaxConversations: settings.botTargetMaxConversations,
        botSenderGender: settings.botSenderGender,
        botSenderMinAge: settings.botSenderMinAge,
        botSenderMaxAge: settings.botSenderMaxAge,
        botTemplateCategory: settings.botTemplateCategory,
        // بهبود ربات پیام
        botMaxPerHour: settings.botMaxPerHour,
        botActiveWeekdays: settings.botActiveWeekdays,
        botFollowupEnabled: settings.botFollowupEnabled,
        botFollowupHours: settings.botFollowupHours,
        botFollowupMax: settings.botFollowupMax,
        botSkipAnswered: settings.botSkipAnswered,
        botDryRun: settings.botDryRun,
        botUseDynamicTemplates: settings.botUseDynamicTemplates,
        // هدف‌گیری پیشرفته
        botTargetOnlineOnly: settings.botTargetOnlineOnly,
        botTargetRecentlyOnlineHours: settings.botTargetRecentlyOnlineHours,
        botTargetMinPhotos: settings.botTargetMinPhotos,
        botTargetMaxPhotos: settings.botTargetMaxPhotos,
        botTargetVerifiedOnly: settings.botTargetVerifiedOnly,
        botTargetMinHeight: settings.botTargetMinHeight,
        botTargetMaxHeight: settings.botTargetMaxHeight,
        botTargetIncomeMin: settings.botTargetIncomeMin,
        botTargetHasJob: settings.botTargetHasJob,
        botTargetReferralOnly: settings.botTargetReferralOnly,
        botUseWhitelist: settings.botUseWhitelist,
        // ارسال‌کننده فیک پیشرفته
        botSenderMatchCity: settings.botSenderMatchCity,
        botSenderVerifiedOnly: settings.botSenderVerifiedOnly,
        botSenderHasPhoto: settings.botSenderHasPhoto,
        botSenderPersonality: settings.botSenderPersonality,
        // محدودیت ساعتی جانبی
        botLikeMaxPerHour: settings.botLikeMaxPerHour,
        botViewMaxPerHour: settings.botViewMaxPerHour,
        botStoryViewMaxPerHour: settings.botStoryViewMaxPerHour,
        botGiftMaxPerHour: settings.botGiftMaxPerHour,
        botMatchMaxPerHour: settings.botMatchMaxPerHour,
        botAutoReplyMaxPerHour: settings.botAutoReplyMaxPerHour,
        // cooldown جهانی و تاخیر
        botGlobalCooldownMinutes: settings.botGlobalCooldownMinutes,
        botDelayMinMs: settings.botDelayMinMs,
        botDelayMaxMs: settings.botDelayMaxMs,
        botLogRetentionDays: settings.botLogRetentionDays,
        // شخصیت‌سازی و typing
        botPersonality: settings.botPersonality,
        botTypingDelaySeconds: settings.botTypingDelaySeconds,
        botAutoRead: settings.botAutoRead,
        botTemplateVariety: settings.botTemplateVariety,
      },
      templates: templatesByCategory,
      totalTemplates: BOT_TEMPLATES.length,
    });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    console.error("[admin/bot] GET error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

// POST — اجرای دستی یک دور ربات
export async function POST() {
  try {
    await requireAdmin();
    const result = await runBotCycle();
    console.log(`[admin/bot] Manual run: ${result.sent} sent, ${result.skipped} skipped`);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    console.error("[admin/bot] POST error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

// PUT — به روز رسانی تنظیمات ربات
export async function PUT(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();

    const FIELD_MAP: Record<string, string> = {
      botEnabled: "BOT_ENABLED",
      botIntervalMinutes: "BOT_INTERVAL_MINUTES",
      botMessagesPerRun: "BOT_MESSAGES_PER_RUN",
      botActiveHoursStart: "BOT_ACTIVE_HOURS_START",
      botActiveHoursEnd: "BOT_ACTIVE_HOURS_END",
      botCooldownHours: "BOT_COOLDOWN_HOURS",
      botTargetNewUsers: "BOT_TARGET_NEW_USERS",
      botTargetOldUsers: "BOT_TARGET_OLD_USERS",
      botTargetInactive: "BOT_TARGET_INACTIVE",
      botTargetNoPhoto: "BOT_TARGET_NO_PHOTO",
      botTargetNoBio: "BOT_TARGET_NO_BIO",
      botTargetNoSubscription: "BOT_TARGET_NO_SUBSCRIPTION",
      botTargetWithSubscription: "BOT_TARGET_WITH_SUBSCRIPTION",
      botTargetGender: "BOT_TARGET_GENDER",
      botTargetMinAge: "BOT_TARGET_MIN_AGE",
      botTargetMaxAge: "BOT_TARGET_MAX_AGE",
      botTargetCity: "BOT_TARGET_CITY",
      botTargetMinConversations: "BOT_TARGET_MIN_CONVERSATIONS",
      botTargetMaxConversations: "BOT_TARGET_MAX_CONVERSATIONS",
      botSenderGender: "BOT_SENDER_GENDER",
      botSenderMinAge: "BOT_SENDER_MIN_AGE",
      botSenderMaxAge: "BOT_SENDER_MAX_AGE",
      botTemplateCategory: "BOT_TEMPLATE_CATEGORY",
      // بهبود ربات پیام
      botMaxPerHour: "BOT_MAX_PER_HOUR",
      botActiveWeekdays: "BOT_ACTIVE_WEEKDAYS",
      botFollowupEnabled: "BOT_FOLLOWUP_ENABLED",
      botFollowupHours: "BOT_FOLLOWUP_HOURS",
      botFollowupMax: "BOT_FOLLOWUP_MAX",
      botSkipAnswered: "BOT_SKIP_ANSWERED",
      botDryRun: "BOT_DRY_RUN",
      botUseDynamicTemplates: "BOT_USE_DYNAMIC_TEMPLATES",
      // هدف‌گیری پیشرفته
      botTargetOnlineOnly: "BOT_TARGET_ONLINE_ONLY",
      botTargetRecentlyOnlineHours: "BOT_TARGET_RECENTLY_ONLINE_HOURS",
      botTargetMinPhotos: "BOT_TARGET_MIN_PHOTOS",
      botTargetMaxPhotos: "BOT_TARGET_MAX_PHOTOS",
      botTargetVerifiedOnly: "BOT_TARGET_VERIFIED_ONLY",
      botTargetMinHeight: "BOT_TARGET_MIN_HEIGHT",
      botTargetMaxHeight: "BOT_TARGET_MAX_HEIGHT",
      botTargetIncomeMin: "BOT_TARGET_INCOME_MIN",
      botTargetHasJob: "BOT_TARGET_HAS_JOB",
      botTargetReferralOnly: "BOT_TARGET_REFERRAL_ONLY",
      botUseWhitelist: "BOT_USE_WHITELIST",
      // ارسال‌کننده فیک پیشرفته
      botSenderMatchCity: "BOT_SENDER_MATCH_CITY",
      botSenderVerifiedOnly: "BOT_SENDER_VERIFIED_ONLY",
      botSenderHasPhoto: "BOT_SENDER_HAS_PHOTO",
      botSenderPersonality: "BOT_SENDER_PERSONALITY",
      // محدودیت ساعتی جانبی
      botLikeMaxPerHour: "BOT_LIKE_MAX_PER_HOUR",
      botViewMaxPerHour: "BOT_VIEW_MAX_PER_HOUR",
      botStoryViewMaxPerHour: "BOT_STORY_VIEW_MAX_PER_HOUR",
      botGiftMaxPerHour: "BOT_GIFT_MAX_PER_HOUR",
      botMatchMaxPerHour: "BOT_MATCH_MAX_PER_HOUR",
      botAutoReplyMaxPerHour: "BOT_AUTO_REPLY_MAX_PER_HOUR",
      // cooldown جهانی و تاخیر
      botGlobalCooldownMinutes: "BOT_GLOBAL_COOLDOWN_MINUTES",
      botDelayMinMs: "BOT_DELAY_MIN_MS",
      botDelayMaxMs: "BOT_DELAY_MAX_MS",
      botLogRetentionDays: "BOT_LOG_RETENTION_DAYS",
      // شخصیت‌سازی و typing
      botPersonality: "BOT_PERSONALITY",
      botTypingDelaySeconds: "BOT_TYPING_DELAY_SECONDS",
      botAutoRead: "BOT_AUTO_READ",
      botTemplateVariety: "BOT_TEMPLATE_VARIETY",
    };

    const updates: Promise<void>[] = [];
    for (const [field, value] of Object.entries(body)) {
      const settingKey = FIELD_MAP[field];
      if (!settingKey) continue;
      const strValue = typeof value === "boolean" ? String(value) : String(value);
      updates.push(setSetting(settingKey as Parameters<typeof setSetting>[0], strValue));
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "هیچ فیلد معتبری ارسال نشده است" }, { status: 400 });
    }

    await Promise.all(updates);
    invalidateSettingsCache();
    console.log(`[admin/bot] Updated ${updates.length} bot settings`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    console.error("[admin/bot] PUT error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
