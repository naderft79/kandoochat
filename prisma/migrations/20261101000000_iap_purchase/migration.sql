-- خریدهای درون برنامه ای مارکت ها (بازار/مایکت)
CREATE TABLE "IapPurchase" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "brand" TEXT NOT NULL,
  "market" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "purchaseToken" TEXT NOT NULL,
  "orderId" TEXT,
  "packageName" TEXT,
  "credited" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "IapPurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "IapPurchase_purchaseToken_key" ON "IapPurchase"("purchaseToken");
CREATE INDEX "IapPurchase_userId_idx" ON "IapPurchase"("userId");
