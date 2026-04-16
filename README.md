# Taste the Ceiling — Wilco Live Stats

Deep stats on every Wilco show, every song, every era. Powered by setlist.fm data covering 1,900+ concerts from 1994 to the present.

## Features

- **Songs** — play counts, first/last played dates, gap tracker (shows since last performance), year-by-year bar charts, full performance history
- **Shows** — browse all shows by year or tour, full setlists with album badges, per-show album breakdown
- **Eras** — stacked bar chart of songs played per year broken down by album era, with toggle between raw count and percentage views
- **Homepage** — hero stats (total shows, unique songs, total performances, years active), most-played songs, longest current gaps, recent shows

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL 16 |
| ORM | Prisma 7 |
| Charts | Recharts |
| Styling | Tailwind CSS v4 |
| Runtime | Node.js 20 |
| Infrastructure | Docker Compose |

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- A [setlist.fm API key](https://www.setlist.fm/settings/api) (free account required)

## Setup

**1. Clone the repo**

```bash
git clone https://github.com/mchegge/tastetheceiling.git
cd tastetheceiling
```

**2. Configure environment**

```bash
cp .env.example .env.local
```

Open `.env.local` and set your setlist.fm API key:

```
SETLISTFM_API_KEY=your_key_here
```

`DATABASE_URL` is handled automatically by Docker Compose — leave it alone.

**3. Start the containers**

```bash
docker compose up -d
```

This starts the Next.js app on port 3000 and a PostgreSQL database. The app will wait for the database to be healthy before starting.

**4. Run the database migration**

```bash
docker compose exec app npx prisma migrate deploy
```

**5. Ingest Wilco setlist data**

This crawls all ~1,900 shows from setlist.fm. It respects the API's 1 req/sec rate limit, so it takes roughly 35 minutes to complete.

```bash
docker compose exec app npx tsx scripts/ingest.ts
```

**6. Tag songs with album metadata**

Maps song names to their source album (play counts, era charts, and album art all depend on this).

```bash
docker compose exec app npx tsx scripts/seed-albums.ts
```

**7. Open the app**

Visit [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Description | Where to get it |
|---|---|---|
| `SETLISTFM_API_KEY` | setlist.fm REST API key | [setlist.fm/settings/api](https://www.setlist.fm/settings/api) |
| `DATABASE_URL` | PostgreSQL connection string | Set automatically by Docker Compose |

## Keeping Data Fresh

A monthly refresh runs automatically on the 1st of each month at 3am. It fetches the 3 most recent pages from setlist.fm (~60 shows) and upserts any new data. No action needed — it runs as long as the app container is up.

To trigger a refresh manually:

```bash
# Recent shows only (~3 seconds)
docker compose exec app node -e "require('./lib/refresh').refreshRecentShows()"

# Full re-crawl of all shows (~35 minutes)
docker compose exec app npx tsx scripts/ingest.ts
docker compose exec app npx tsx scripts/seed-albums.ts
```

## Project Structure

```
app/
  page.tsx              # Homepage with hero stats
  songs/                # Songs index + song detail pages
  shows/                # Shows browser + show detail pages
  eras/                 # Eras chart and breakdown table
lib/
  queries.ts            # All database queries
  prisma.ts             # Prisma client singleton
  album-colors.ts       # Album color mappings and cover art URLs
  refresh.ts            # Recent-shows refresh logic (used by cron)
scripts/
  ingest.ts             # Full setlist.fm crawl
  seed-albums.ts        # Maps song names to albums
prisma/
  schema.prisma         # Show, Song, Performance models
instrumentation.ts      # Schedules monthly refresh on server start
```

## Data Source

Show and setlist data from [setlist.fm](https://www.setlist.fm). Album art from the [MusicBrainz Cover Art Archive](https://coverartarchive.org).
