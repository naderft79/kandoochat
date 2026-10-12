-- آخرین IP کاربر برای پنل ادمین (افزایشی؛ داده موجود تغییر نمی کند)
ALTER TABLE "User" ADD COLUMN "lastIp" TEXT,
ADD COLUMN "lastIpAt" TIMESTAMP(3);

-- شمارش پیام ها و تصاویر ارسالی هر کاربر (آمار پنل ادمین)
CREATE INDEX "Message_senderId_type_idx" ON "Message"("senderId", "type");
