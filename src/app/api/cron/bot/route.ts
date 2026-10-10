// API خودکارجو ربات تشویقی — توسط cron یا setInterval فراخوانی می شود
import { NextResponse } from "next/server";
import { runBotCycle } from "@/lib/bot";
import { runLikeBotCycle } from "@/lib/botLike";
import { runViewBotCycle } from "@/lib/botView";
import { runStoryBotCycle } from "@/lib/botStory";
import { runGiftBotCycle } from "@/lib/botGift";
import { runMatchBotCycle } from "@/lib/botMatch";
import { runAutoReplyBotCycle } from "@/lib/botAutoReply";
import { runConversationBotCycle } from "@/lib/botConversation";
import { cleanupOldBotLogs } from "@/lib/botHelpers";

// این endpoint توسط cron job یا سیستم زمان بندی فراخوانی می شود
export async function GET(request: Request) {
  // بررسی توکن ساده برای جلوگیری از دسترسی غیرمجاز
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error("[bot/cron] CRON_SECRET env variable is not set");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  }

  try {
    // اجرای ربات پیام
    const messageResult = await runBotCycle();

    // اجرای ربات‌های جانبی (به صورت موازی)
    const [likeResult, viewResult, storyResult, giftResult, matchResult, autoReplyResult, conversationResult] =
      await Promise.all([
        runLikeBotCycle(),
        runViewBotCycle(),
        runStoryBotCycle(),
        runGiftBotCycle(),
        runMatchBotCycle(),
        runAutoReplyBotCycle(),
        runConversationBotCycle(),
      ]);

    // پاک‌سازی خودکار لاگ‌های قدیمی
    const deletedLogs = await cleanupOldBotLogs();

    return NextResponse.json({
      ok: true,
      message: messageResult,
      like: likeResult,
      view: viewResult,
      story: storyResult,
      gift: giftResult,
      match: matchResult,
      autoReply: autoReplyResult,
      conversation: conversationResult,
      cleanedLogs: deletedLogs,
    });
  } catch (err) {
    console.error("[bot/cron] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

