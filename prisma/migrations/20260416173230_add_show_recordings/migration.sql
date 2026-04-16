-- CreateTable
CREATE TABLE "ShowRecording" (
    "id" TEXT NOT NULL,
    "showId" TEXT NOT NULL,
    "archiveOrgId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "downloads" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ShowRecording_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ShowRecording_showId_idx" ON "ShowRecording"("showId");

-- CreateIndex
CREATE UNIQUE INDEX "ShowRecording_showId_archiveOrgId_key" ON "ShowRecording"("showId", "archiveOrgId");

-- AddForeignKey
ALTER TABLE "ShowRecording" ADD CONSTRAINT "ShowRecording_showId_fkey" FOREIGN KEY ("showId") REFERENCES "Show"("id") ON DELETE CASCADE ON UPDATE CASCADE;
