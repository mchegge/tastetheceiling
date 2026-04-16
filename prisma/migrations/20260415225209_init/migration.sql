-- CreateTable
CREATE TABLE "Show" (
    "id" TEXT NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "tourName" TEXT,
    "venueName" TEXT NOT NULL,
    "venueCity" TEXT NOT NULL,
    "venueState" TEXT,
    "venueCountry" TEXT NOT NULL,
    "setlistFmUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Show_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Song" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "albumName" TEXT,
    "albumSlug" TEXT,
    "albumYear" INTEGER,
    "albumTrack" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Song_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Performance" (
    "id" TEXT NOT NULL,
    "showId" TEXT NOT NULL,
    "songId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "isEncore" BOOLEAN NOT NULL DEFAULT false,
    "setNumber" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,

    CONSTRAINT "Performance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Show_eventDate_idx" ON "Show"("eventDate");

-- CreateIndex
CREATE INDEX "Show_tourName_idx" ON "Show"("tourName");

-- CreateIndex
CREATE UNIQUE INDEX "Song_name_key" ON "Song"("name");

-- CreateIndex
CREATE INDEX "Song_albumSlug_idx" ON "Song"("albumSlug");

-- CreateIndex
CREATE INDEX "Performance_showId_idx" ON "Performance"("showId");

-- CreateIndex
CREATE INDEX "Performance_songId_idx" ON "Performance"("songId");

-- CreateIndex
CREATE UNIQUE INDEX "Performance_showId_position_key" ON "Performance"("showId", "position");

-- AddForeignKey
ALTER TABLE "Performance" ADD CONSTRAINT "Performance_showId_fkey" FOREIGN KEY ("showId") REFERENCES "Show"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Performance" ADD CONSTRAINT "Performance_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song"("id") ON DELETE CASCADE ON UPDATE CASCADE;
