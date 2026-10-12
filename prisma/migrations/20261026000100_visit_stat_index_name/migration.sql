-- هم نام کردن ایندکس یکتای خلاصه بازدید با نامی که Prisma (محدودیت ۶۳ کاراکتر) تولید می کند
ALTER INDEX "VisitDailyStat_day_pageKey_channel_source_platform_isEntry_isLoggedIn_key" RENAME TO "VisitDailyStat_day_pageKey_channel_source_platform_isEntry__key";
