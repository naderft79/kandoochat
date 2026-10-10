// API مدیریت ربات‌های جانبی — دریافت تنظیمات، اجرای دستی
import { NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth";
import { getAllSettings, setSetting, invalidateSettingsCache } from "@/lib/settings";
import { runLikeBotCycle } from "@/lib/botLike";
import { runViewBotCycle } from "@/lib/botView";
import { runStoryBotCycle } from "@/lib/botStory";
import { runGiftBotCycle } from "@/lib/botGift";
import { runMatchBotCycle } from "@/lib/botMatch";
import { runAutoReplyBotCycle } from "@/lib/botAutoReply";
import { runConversationBotCycle } from "@/lib/botConversation";

// GET — دریافت تنظیمات ربات‌های جانبی
export async function GET() {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    throw e;
  }

  const s = await getAllSettings();

  return NextResponse.json({
    like: {
      enabled: s.botLikeEnabled,
      perRun: s.botLikePerRun,
      intervalMinutes: s.botLikeIntervalMinutes,
      superLikeChance: s.botLikeSuperLikeChance,
      cooldownHours: s.botLikeCooldownHours,
    },
    view: {
      enabled: s.botViewEnabled,
      perRun: s.botViewPerRun,
      intervalMinutes: s.botViewIntervalMinutes,
      cooldownHours: s.botViewCooldownHours,
    },
    story: {
      enabled: s.botStoryViewEnabled,
      perRun: s.botStoryViewPerRun,
      intervalMinutes: s.botStoryViewIntervalMinutes,
    },
    gift: {
      enabled: s.botGiftEnabled,
      perRun: s.botGiftPerRun,
      intervalMinutes: s.botGiftIntervalMinutes,
      cooldownHours: s.botGiftCooldownHours,
      maxCoins: s.botGiftMaxCoins,
    },
    match: {
      enabled: s.botMatchEnabled,
      perRun: s.botMatchPerRun,
      intervalMinutes: s.botMatchIntervalMinutes,
    },
    autoReply: {
      enabled: s.botAutoReplyEnabled,
      delaySeconds: s.botAutoReplyDelaySeconds,
      maxPerUser: s.botAutoReplyMaxPerUser,
    },
  });
}

// PUT — به‌روزرسانی تنظیمات ربات‌های جانبی
export async function PUT(request: Request) {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    throw e;
  }

  const body = await request.json();
  const updates: Record<string, string> = {};

  // نگاشت فیلدها به کلیدهای تنظیمات
  const fieldMap: Record<string, string> = {
    "like.enabled": "BOT_LIKE_ENABLED",
    "like.perRun": "BOT_LIKE_PER_RUN",
    "like.intervalMinutes": "BOT_LIKE_INTERVAL_MINUTES",
    "like.superLikeChance": "BOT_LIKE_SUPER_LIKE_CHANCE",
    "like.cooldownHours": "BOT_LIKE_COOLDOWN_HOURS",
    "view.enabled": "BOT_VIEW_ENABLED",
    "view.perRun": "BOT_VIEW_PER_RUN",
    "view.intervalMinutes": "BOT_VIEW_INTERVAL_MINUTES",
    "view.cooldownHours": "BOT_VIEW_COOLDOWN_HOURS",
    "story.enabled": "BOT_STORY_VIEW_ENABLED",
    "story.perRun": "BOT_STORY_VIEW_PER_RUN",
    "story.intervalMinutes": "BOT_STORY_VIEW_INTERVAL_MINUTES",
    "gift.enabled": "BOT_GIFT_ENABLED",
    "gift.perRun": "BOT_GIFT_PER_RUN",
    "gift.intervalMinutes": "BOT_GIFT_INTERVAL_MINUTES",
    "gift.cooldownHours": "BOT_GIFT_COOLDOWN_HOURS",
    "gift.maxCoins": "BOT_GIFT_MAX_COINS",
    "match.enabled": "BOT_MATCH_ENABLED",
    "match.perRun": "BOT_MATCH_PER_RUN",
    "match.intervalMinutes": "BOT_MATCH_INTERVAL_MINUTES",
    "autoReply.enabled": "BOT_AUTO_REPLY_ENABLED",
    "autoReply.delaySeconds": "BOT_AUTO_REPLY_DELAY_SECONDS",
    "autoReply.maxPerUser": "BOT_AUTO_REPLY_MAX_PER_USER",
  };

  for (const [key, settingKey] of Object.entries(fieldMap)) {
    if (body[key] !== undefined) {
      const val = body[key];
      updates[settingKey] = typeof val === "boolean" ? (val ? "true" : "false") : String(val);
    }
  }

  for (const [key, value] of Object.entries(updates)) {
    await setSetting(key as Parameters<typeof setSetting>[0], value);
  }
  invalidateSettingsCache();

  return NextResponse.json({ ok: true });
}

// POST — اجرای دستی یک ربات جانبی
export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    throw e;
  }

  const body = await request.json();
  const { botType } = body;

  let result;
  switch (botType) {
    case "like":
      result = await runLikeBotCycle();
      break;
    case "view":
      result = await runViewBotCycle();
      break;
    case "story":
      result = await runStoryBotCycle();
      break;
    case "gift":
      result = await runGiftBotCycle();
      break;
    case "match":
      result = await runMatchBotCycle();
      break;
    case "autoReply":
      result = await runAutoReplyBotCycle();
      break;
    case "conversation":
      result = await runConversationBotCycle();
      break;
    default:
      return NextResponse.json({ error: "نوع ربات نامعتبر" }, { status: 400 });
  }

  return NextResponse.json({ ok: true, ...result });
}
