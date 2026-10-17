-- تنظیمات اختصاصی هر اپ/برند (مدیریت اپ ها در پنل ادمین)
CREATE TABLE "BrandSetting" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "brand" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "value" TEXT NOT NULL
);
CREATE UNIQUE INDEX "BrandSetting_brand_key_key" ON "BrandSetting"("brand", "key");
CREATE INDEX "BrandSetting_brand_idx" ON "BrandSetting"("brand");
