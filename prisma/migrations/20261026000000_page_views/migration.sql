-- بازدید صفحات و خلاصه روزانه آن (افزایشی)
CREATE TABLE "PageView" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "path" TEXT NOT NULL,
    "pageKey" TEXT NOT NULL,
    "isEntry" BOOLEAN NOT NULL DEFAULT false,
    "channel" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "isLoggedIn" BOOLEAN NOT NULL DEFAULT false,
    "visitorHash" TEXT NOT NULL,

    CONSTRAINT "PageView_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PageView_createdAt_idx" ON "PageView"("createdAt");
CREATE INDEX "PageView_pageKey_createdAt_idx" ON "PageView"("pageKey", "createdAt");
CREATE INDEX "PageView_channel_createdAt_idx" ON "PageView"("channel", "createdAt");

CREATE TABLE "VisitDailyStat" (
    "id" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "pageKey" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "isEntry" BOOLEAN NOT NULL,
    "isLoggedIn" BOOLEAN NOT NULL,
    "views" INTEGER NOT NULL,
    "visitors" INTEGER NOT NULL,

    CONSTRAINT "VisitDailyStat_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "VisitDailyStat_day_pageKey_channel_source_platform_isEntry_isLoggedIn_key" ON "VisitDailyStat"("day", "pageKey", "channel", "source", "platform", "isEntry", "isLoggedIn");
CREATE INDEX "VisitDailyStat_day_idx" ON "VisitDailyStat"("day");
