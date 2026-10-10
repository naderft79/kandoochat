-- CreateTable
CREATE TABLE "FeaturedListing" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "costCoins" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),

    CONSTRAINT "FeaturedListing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FeaturedListing_userId_idx" ON "FeaturedListing"("userId");

-- CreateIndex
CREATE INDEX "FeaturedListing_status_approvedAt_idx" ON "FeaturedListing"("status", "approvedAt");

-- AddForeignKey
ALTER TABLE "FeaturedListing" ADD CONSTRAINT "FeaturedListing_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
