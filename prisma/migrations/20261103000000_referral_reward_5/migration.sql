-- جایزه دعوت دوستان ۵ سکه برای هر طرف — هم در تنظیمات ذخیره شده و هم در دعوت های در انتظار
UPDATE "Setting" SET "value" = '5' WHERE "key" = 'REFERRAL_REWARD_COINS';
UPDATE "Referral" SET "rewardCoins" = 5 WHERE "status" = 'PENDING';
