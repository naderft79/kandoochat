-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "mutedByA" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mutedByB" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pinnedByA" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pinnedByB" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "termsAcceptedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "UserSettings" ADD COLUMN     "savedFilters" JSONB;

-- CreateTable
CREATE TABLE "FeedHide" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "hiddenId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeedHide_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FeedHide_userId_idx" ON "FeedHide"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "FeedHide_userId_hiddenId_key" ON "FeedHide"("userId", "hiddenId");

-- AddForeignKey
ALTER TABLE "FeedHide" ADD CONSTRAINT "FeedHide_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedHide" ADD CONSTRAINT "FeedHide_hiddenId_fkey" FOREIGN KEY ("hiddenId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
