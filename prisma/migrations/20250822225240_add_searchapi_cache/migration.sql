-- CreateTable
CREATE TABLE "SearchAPICache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "videoId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "transcript" TEXT,
    "summary" TEXT,
    "duration" TEXT,
    "publishedAt" DATETIME,
    "channelTitle" TEXT,
    "channelId" TEXT,
    "searchQuery" TEXT,
    "apiResponseTimeMs" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "expiresAt" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);

-- CreateIndex
CREATE UNIQUE INDEX "SearchAPICache_videoId_key" ON "SearchAPICache"("videoId");

-- CreateIndex
CREATE INDEX "SearchAPICache_videoId_idx" ON "SearchAPICache"("videoId");

-- CreateIndex
CREATE INDEX "SearchAPICache_expiresAt_idx" ON "SearchAPICache"("expiresAt");

-- CreateIndex
CREATE INDEX "SearchAPICache_isActive_idx" ON "SearchAPICache"("isActive");
