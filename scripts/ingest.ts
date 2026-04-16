/**
 * Setlist.fm ingestion script for Wilco
 *
 * Usage (inside Docker):
 *   docker compose exec app npx tsx scripts/ingest.ts
 *
 * Crawls all Wilco setlists from setlist.fm and upserts them into the database.
 * Safe to re-run — uses upsert throughout.
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const WILCO_MBID = "9e53f84d-ef44-4c16-9677-5fd4d78cbd7d";
const API_KEY = process.env.SETLISTFM_API_KEY!;
const BASE_URL = "https://api.setlist.fm/rest/1.0";
const RATE_LIMIT_MS = 1100; // stay under 1 req/sec limit

// ── Types ────────────────────────────────────────────────────────────────────

interface SetlistFmVenue {
  name: string;
  city: {
    name: string;
    state?: string;
    country: { code: string; name: string };
    coords?: { lat: number; long: number };
  };
}

interface SetlistFmSong {
  name: string;
  tape?: boolean;
  info?: string;
}

interface SetlistFmSet {
  name?: string;
  encore?: number;
  song: SetlistFmSong[];
}

interface SetlistFmSetlist {
  id: string;
  eventDate: string; // "DD-MM-YYYY"
  tour?: { name: string };
  venue: SetlistFmVenue;
  sets: { set: SetlistFmSet[] };
  url: string;
}

interface SetlistFmResponse {
  setlist: SetlistFmSetlist[];
  total: number;
  page: number;
  itemsPerPage: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseDate(eventDate: string): Date {
  // setlist.fm format: "DD-MM-YYYY"
  const [day, month, year] = eventDate.split("-").map(Number);
  return new Date(year, month - 1, day);
}

async function fetchPage(page: number): Promise<SetlistFmResponse> {
  const url = `${BASE_URL}/artist/${WILCO_MBID}/setlists?p=${page}`;
  const res = await fetch(url, {
    headers: {
      "x-api-key": API_KEY,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }

  return res.json() as Promise<SetlistFmResponse>;
}

// ── Core ingestion ────────────────────────────────────────────────────────────

async function ingestSetlist(setlist: SetlistFmSetlist): Promise<void> {
  const { id, eventDate, tour, venue, sets, url } = setlist;

  // Skip setlists with no songs
  const allSets = sets?.set ?? [];
  const allSongs = allSets.flatMap((s) => s.song ?? []);
  if (allSongs.length === 0) return;

  // Upsert the show
  await prisma.show.upsert({
    where: { id },
    update: {},
    create: {
      id,
      eventDate: parseDate(eventDate),
      tourName: tour?.name ?? null,
      venueName: venue.name,
      venueCity: venue.city.name,
      venueState: venue.city.state ?? null,
      venueCountry: venue.city.country.name,
      setlistFmUrl: url,
    },
  });

  // Delete existing performances so we can re-insert cleanly
  await prisma.performance.deleteMany({ where: { showId: id } });

  let position = 0;

  for (const set of allSets) {
    const isEncore = (set.encore ?? 0) > 0;
    const setNumber = isEncore ? 2 : 1;

    for (const song of set.song ?? []) {
      // Skip tape/playback entries
      if (song.tape) continue;

      // Upsert the song (canonical name only — album mapping handled by seed)
      const songRecord = await prisma.song.upsert({
        where: { name: song.name },
        update: {},
        create: { name: song.name },
      });

      await prisma.performance.create({
        data: {
          showId: id,
          songId: songRecord.id,
          position,
          isEncore,
          setNumber,
          notes: song.info ?? null,
        },
      });

      position++;
    }
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (!API_KEY) {
    console.error("SETLISTFM_API_KEY environment variable is not set");
    process.exit(1);
  }

  console.log("Starting Wilco setlist ingestion...\n");

  // Fetch first page to get total count
  const firstPage = await fetchPage(1);
  const totalPages = Math.ceil(firstPage.total / firstPage.itemsPerPage);

  console.log(
    `Found ${firstPage.total} setlists across ${totalPages} pages\n`
  );

  let processed = 0;
  let skipped = 0;

  // Process first page
  for (const setlist of firstPage.setlist) {
    try {
      await ingestSetlist(setlist);
      processed++;
    } catch (err) {
      console.warn(`  Skipped ${setlist.id}: ${(err as Error).message}`);
      skipped++;
    }
  }

  console.log(`Page 1/${totalPages} — ${processed} shows ingested`);

  // Fetch remaining pages
  for (let page = 2; page <= totalPages; page++) {
    await sleep(RATE_LIMIT_MS);

    try {
      const data = await fetchPage(page);
      for (const setlist of data.setlist) {
        try {
          await ingestSetlist(setlist);
          processed++;
        } catch (err) {
          console.warn(`  Skipped ${setlist.id}: ${(err as Error).message}`);
          skipped++;
        }
      }
      console.log(`Page ${page}/${totalPages} — ${processed} shows ingested`);
    } catch (err) {
      console.error(`Failed to fetch page ${page}: ${(err as Error).message}`);
      // Continue to next page rather than aborting
    }
  }

  console.log(`\nDone. ${processed} shows ingested, ${skipped} skipped.`);
}

main()
  .catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
