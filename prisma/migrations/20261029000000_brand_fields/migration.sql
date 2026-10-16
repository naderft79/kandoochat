-- برند اپ برای کاربر، اشتراک پوش و توکن FCM
ALTER TABLE "User" ADD COLUMN "brand" TEXT;
ALTER TABLE "PushSubscription" ADD COLUMN "brand" TEXT;
ALTER TABLE "FcmToken" ADD COLUMN "brand" TEXT;
CREATE INDEX "User_brand_idx" ON "User"("brand");
