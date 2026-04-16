/**
 * Archive.org recording seed script for Wilco
 *
 * Fetches all Wilco live recordings from the Internet Archive,
 * matches them to shows by date, and upserts ShowRecording records.
 *
 * Usage (inside Docker):
 *   docker compose exec app npx tsx scripts/seed-archive.ts
 *
 * Safe to re-run — uses upsert throughout.
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const ARCHIVE_SEARCH_URL = "https://archive.org/advancedsearch.php";

interface ArchiveDoc {
  identifier: string;
  title: string;
  date: string; // ISO string e.g. "1994-11-17T00:00:00Z"
  downloads?: number;
}

interface ArchiveResponse {
  response: {
    numFound: number;
    docs: ArchiveDoc[];
  };
}

async function fetchAllRecordings(): Promise<ArchiveDoc[]> {
  const PAGE_SIZE = 200;
  const allDocs: ArchiveDoc[] = [];
  let start = 0;

  console.log("Fetching Wilco recordings from Archive.org...");

  while (true) {
    const params = new URLSearchParams({
      q: 'creator:"Wilco" mediatype:audio',
      "fl[]": "identifier,date,title,downloads",
      sort: "date asc",
      rows: String(PAGE_SIZE),
      start: String(start),
      output: "json",
    });

    const res = await fetch(`${ARCHIVE_SEARCH_URL}?${params}`);
    if (!res.ok) throw new Error(`Archive.org API error: ${res.status}`);

    const data = (await res.json()) as ArchiveResponse;
    const docs = data.response.docs;
    allDocs.push(...docs);

    console.log(`  Fetched ${allDocs.length} / ${data.response.numFound}`);

    if (allDocs.length >= data.response.numFound) break;
    start += PAGE_SIZE;
  }

  return allDocs;
}

function extractDate(isoString: string): string {
  // "1994-11-17T00:00:00Z" → "1994-11-17"
  return isoString.split("T")[0];
}

async function main() {
  const recordings = await fetchAllRecordings();
  console.log(`\nFound ${recordings.length} recordings on Archive.org\n`);

  // Group recordings by date
  const byDate = new Map<string, ArchiveDoc[]>();
  for (const rec of recordings) {
    if (!rec.date) continue;
    const date = extractDate(rec.date);
    if (!byDate.has(date)) byDate.set(date, []);
    byDate.get(date)!.push(rec);
  }

  // Sort each date's recordings by downloads descending so best ones come first
  for (const docs of byDate.values()) {
    docs.sort((a, b) => (b.downloads ?? 0) - (a.downloads ?? 0));
  }

  let matched = 0;
  let unmatched = 0;
  let upserted = 0;

  for (const [date, docs] of byDate) {
    // Find show with matching event date
    const show = await prisma.show.findFirst({
      where: {
        eventDate: {
          gte: new Date(`${date}T00:00:00Z`),
          lt:  new Date(`${date}T23:59:59Z`),
        },
      },
      select: { id: true },
    });

    if (!show) {
      unmatched++;
      console.log(`  No show found for date ${date} (${docs.length} recording(s))`);
      continue;
    }

    matched++;

    for (const rec of docs) {
      await prisma.showRecording.upsert({
        where: { showId_archiveOrgId: { showId: show.id, archiveOrgId: rec.identifier } },
        update: { title: rec.title, downloads: rec.downloads ?? 0 },
        create: {
          showId:       show.id,
          archiveOrgId: rec.identifier,
          title:        rec.title,
          downloads:    rec.downloads ?? 0,
        },
      });
      upserted++;
    }
  }

  console.log(`\nDone.`);
  console.log(`  Shows matched:   ${matched}`);
  console.log(`  Dates unmatched: ${unmatched}`);
  console.log(`  Recordings saved: ${upserted}`);
}

main()
  .catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
