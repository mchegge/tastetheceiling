import { prisma } from "./prisma";

// ── Types ─────────────────────────────────────────────────────────────────────

export type SongRow = {
  id: string;
  name: string;
  albumName: string | null;
  albumSlug: string | null;
  albumYear: number | null;
  playCount: number;
  firstPlayed: Date | null;
  lastPlayed: Date | null;
  gap: number | null; // shows since last played (null = never played in a show we have)
};

export type SongSort =
  | "plays"
  | "lastPlayed"
  | "gap"
  | "name"
  | "album"
  | "firstPlayed";

// ── Songs ─────────────────────────────────────────────────────────────────────

export async function getSongs(sort: SongSort = "plays"): Promise<SongRow[]> {
  // Raw query: calculates gap (shows since last performance) in one shot
  const rows = await prisma.$queryRaw<SongRow[]>`
    WITH show_ranks AS (
      SELECT id, ROW_NUMBER() OVER (ORDER BY "eventDate" ASC) AS rank
      FROM "Show"
    ),
    total_shows AS (
      SELECT COUNT(*)::int AS total FROM "Show"
    ),
    song_stats AS (
      SELECT
        s.id,
        s.name,
        s."albumName",
        s."albumSlug",
        s."albumYear",
        COUNT(p.id)::int                          AS "playCount",
        MIN(sh."eventDate")                        AS "firstPlayed",
        MAX(sh."eventDate")                        AS "lastPlayed"
      FROM "Song" s
      LEFT JOIN "Performance" p ON p."songId" = s.id
      LEFT JOIN "Show"        sh ON sh.id = p."showId"
      GROUP BY s.id, s.name, s."albumName", s."albumSlug", s."albumYear"
    ),
    last_show_rank AS (
      SELECT DISTINCT ON (p."songId")
        p."songId",
        sr.rank AS last_rank
      FROM "Performance" p
      JOIN "Show" sh ON sh.id = p."showId"
      JOIN show_ranks sr ON sr.id = sh.id
      ORDER BY p."songId", sh."eventDate" DESC
    )
    SELECT
      ss.*,
      (ts.total - lsr.last_rank)::int AS gap
    FROM song_stats ss
    CROSS JOIN total_shows ts
    LEFT JOIN last_show_rank lsr ON lsr."songId" = ss.id
    WHERE ss."playCount" > 0
    ORDER BY
      CASE WHEN ${sort} = 'plays'      THEN ss."playCount"       END DESC NULLS LAST,
      CASE WHEN ${sort} = 'gap'        THEN (ts.total - lsr.last_rank) END DESC NULLS LAST,
      CASE WHEN ${sort} = 'lastPlayed' THEN ss."lastPlayed"      END DESC NULLS LAST,
      CASE WHEN ${sort} = 'firstPlayed'THEN ss."firstPlayed"     END ASC  NULLS LAST,
      CASE WHEN ${sort} = 'name'       THEN ss.name              END ASC  NULLS LAST,
      CASE WHEN ${sort} = 'album'      THEN ss."albumYear"        END ASC  NULLS LAST,
      ss."playCount" DESC
  `;

  return rows;
}

// ── Individual song ───────────────────────────────────────────────────────────

export type SongDetail = {
  id: string;
  name: string;
  albumName: string | null;
  albumSlug: string | null;
  albumYear: number | null;
  performances: Array<{
    showId: string;
    eventDate: Date;
    venueName: string;
    venueCity: string;
    venueState: string | null;
    venueCountry: string;
    tourName: string | null;
    setlistFmUrl: string | null;
    notes: string | null;
    isEncore: boolean;
  }>;
};

export async function getSongBySlug(
  slug: string
): Promise<SongDetail | null> {
  // slug is derived from name — we store by name
  const song = await prisma.song.findFirst({
    where: {
      name: {
        equals: decodeURIComponent(slug),
        mode: "insensitive",
      },
    },
    include: {
      performances: {
        include: { show: true },
        orderBy: { show: { eventDate: "desc" } },
      },
    },
  });

  if (!song) return null;

  return {
    id: song.id,
    name: song.name,
    albumName: song.albumName,
    albumSlug: song.albumSlug,
    albumYear: song.albumYear,
    performances: song.performances.map((p) => ({
      showId: p.showId,
      eventDate: p.show.eventDate,
      venueName: p.show.venueName,
      venueCity: p.show.venueCity,
      venueState: p.show.venueState,
      venueCountry: p.show.venueCountry,
      tourName: p.show.tourName,
      setlistFmUrl: p.show.setlistFmUrl,
      notes: p.notes,
      isEncore: p.isEncore,
    })),
  };
}

// ── Shows list ────────────────────────────────────────────────────────────────

export type ShowRow = {
  id: string;
  eventDate: Date;
  venueName: string;
  venueCity: string;
  venueState: string | null;
  venueCountry: string;
  tourName: string | null;
  setlistFmUrl: string | null;
  songCount: number;
  hasRecording: boolean;
};

export async function getShowFilters() {
  const [years, tours] = await Promise.all([
    prisma.$queryRaw<Array<{ year: number }>>`
      SELECT DISTINCT EXTRACT(YEAR FROM "eventDate")::int AS year
      FROM "Show"
      ORDER BY year DESC
    `,
    prisma.show.findMany({
      where: { tourName: { not: null } },
      select: { tourName: true },
      distinct: ["tourName"],
      orderBy: { eventDate: "desc" },
    }),
  ]);
  return {
    years: years.map((r) => r.year),
    tours: tours.map((t) => t.tourName!).filter(Boolean),
  };
}

export async function getShows(filters: {
  year?: number;
  tour?: string;
  page?: number;
  hasRecording?: boolean;
}): Promise<{ shows: ShowRow[]; total: number }> {
  const PAGE_SIZE = 50;
  const page = filters.page ?? 1;
  const skip = (page - 1) * PAGE_SIZE;

  const where = {
    ...(filters.year
      ? {
          eventDate: {
            gte: new Date(`${filters.year}-01-01`),
            lt: new Date(`${filters.year + 1}-01-01`),
          },
        }
      : {}),
    ...(filters.tour ? { tourName: filters.tour } : {}),
    ...(filters.hasRecording ? { recordings: { some: {} } } : {}),
  };

  const [rawShows, total] = await Promise.all([
    prisma.show.findMany({
      where,
      orderBy: { eventDate: "desc" },
      skip,
      take: PAGE_SIZE,
      include: {
        _count: { select: { performances: true, recordings: true } },
      },
    }),
    prisma.show.count({ where }),
  ]);

  return {
    shows: rawShows.map((s) => ({
      id: s.id,
      eventDate: s.eventDate,
      venueName: s.venueName,
      venueCity: s.venueCity,
      venueState: s.venueState,
      venueCountry: s.venueCountry,
      tourName: s.tourName,
      setlistFmUrl: s.setlistFmUrl,
      songCount: s._count.performances,
      hasRecording: s._count.recordings > 0,
    })),
    total,
  };
}

// ── Show detail ───────────────────────────────────────────────────────────────

export type ShowDetail = {
  id: string;
  eventDate: Date;
  venueName: string;
  venueCity: string;
  venueState: string | null;
  venueCountry: string;
  tourName: string | null;
  setlistFmUrl: string | null;
  setlist: Array<{
    position: number;
    isEncore: boolean;
    setNumber: number;
    notes: string | null;
    song: {
      name: string;
      albumName: string | null;
      albumSlug: string | null;
      albumYear: number | null;
    };
  }>;
  prevShow: { id: string; eventDate: Date } | null;
  nextShow: { id: string; eventDate: Date } | null;
};

export async function getShowById(id: string): Promise<ShowDetail | null> {
  const show = await prisma.show.findUnique({
    where: { id },
    include: {
      performances: {
        orderBy: { position: "asc" },
        include: {
          song: {
            select: {
              name: true,
              albumName: true,
              albumSlug: true,
              albumYear: true,
            },
          },
        },
      },
    },
  });

  if (!show) return null;

  const [prevShow, nextShow] = await Promise.all([
    prisma.show.findFirst({
      where: { eventDate: { lt: show.eventDate } },
      orderBy: { eventDate: "desc" },
      select: { id: true, eventDate: true },
    }),
    prisma.show.findFirst({
      where: { eventDate: { gt: show.eventDate } },
      orderBy: { eventDate: "asc" },
      select: { id: true, eventDate: true },
    }),
  ]);

  return {
    id: show.id,
    eventDate: show.eventDate,
    venueName: show.venueName,
    venueCity: show.venueCity,
    venueState: show.venueState,
    venueCountry: show.venueCountry,
    tourName: show.tourName,
    setlistFmUrl: show.setlistFmUrl,
    setlist: show.performances.map((p) => ({
      position: p.position,
      isEncore: p.isEncore,
      setNumber: p.setNumber,
      notes: p.notes,
      song: p.song,
    })),
    prevShow,
    nextShow,
  };
}

// ── Eras data ─────────────────────────────────────────────────────────────────

export type EraYearRow = {
  year: number;
  albumSlug: string;
  albumName: string;
  albumYear: number;
  count: number;
};

export type EraChartPoint = {
  year: number;
  [albumSlug: string]: number; // count per album slug, plus "other"
};

export async function getErasData(): Promise<{
  chartData: EraChartPoint[];
  albums: Array<{ slug: string; name: string; year: number }>;
}> {
  const rows = await prisma.$queryRaw<EraYearRow[]>`
    SELECT
      EXTRACT(YEAR FROM sh."eventDate")::int AS year,
      COALESCE(s."albumSlug", '__other')     AS "albumSlug",
      COALESCE(s."albumName", 'Covers / Other') AS "albumName",
      COALESCE(s."albumYear", 0)             AS "albumYear",
      COUNT(*)::int                          AS count
    FROM "Performance" p
    JOIN "Show"   sh ON sh.id = p."showId"
    JOIN "Song"   s  ON s.id  = p."songId"
    GROUP BY year, s."albumSlug", s."albumName", s."albumYear"
    ORDER BY year ASC, s."albumYear" ASC NULLS LAST
  `;

  // Collect ordered album list (by release year, other last)
  const albumMap = new Map<string, { slug: string; name: string; year: number }>();
  for (const row of rows) {
    if (!albumMap.has(row.albumSlug)) {
      albumMap.set(row.albumSlug, {
        slug: row.albumSlug,
        name: row.albumName,
        year: row.albumYear,
      });
    }
  }
  const albums = Array.from(albumMap.values()).sort((a, b) => {
    if (a.slug === "__other") return 1;
    if (b.slug === "__other") return -1;
    return a.year - b.year;
  });

  // Build chart points keyed by year
  const byYear = new Map<number, EraChartPoint>();
  for (const row of rows) {
    if (!byYear.has(row.year)) {
      byYear.set(row.year, { year: row.year });
    }
    byYear.get(row.year)![row.albumSlug] = row.count;
  }

  const chartData = Array.from(byYear.values()).sort((a, b) => a.year - b.year);

  return { chartData, albums };
}

// ── Show recordings ───────────────────────────────────────────────────────────

export type ShowRecordingRow = {
  archiveOrgId: string;
  title: string;
  downloads: number;
};

export async function getShowRecordings(showId: string): Promise<{
  recordings: ShowRecordingRow[];
  totalCount: number;
}> {
  const all = await prisma.showRecording.findMany({
    where: { showId },
    orderBy: { downloads: "desc" },
    select: { archiveOrgId: true, title: true, downloads: true },
  });

  return {
    recordings: all.slice(0, 5),
    totalCount: all.length,
  };
}

// ── Song roles (opener / closer) ─────────────────────────────────────────────

export type SongRoleRow = {
  id: string;
  name: string;
  albumName: string | null;
  albumSlug: string | null;
  openerCount: number;
  closerCount: number;
  encoreOpenerCount: number;
  encoreCloserCount: number;
};

export async function getSongRoles(): Promise<SongRoleRow[]> {
  return prisma.$queryRaw<SongRoleRow[]>`
    WITH show_positions AS (
      SELECT
        "showId",
        MIN(CASE WHEN NOT "isEncore" THEN position END) AS first_main,
        MAX(CASE WHEN NOT "isEncore" THEN position END) AS last_main,
        MIN(CASE WHEN     "isEncore" THEN position END) AS first_encore,
        MAX(CASE WHEN     "isEncore" THEN position END) AS last_encore
      FROM "Performance"
      GROUP BY "showId"
    )
    SELECT
      s.id,
      s.name,
      s."albumName",
      s."albumSlug",
      COUNT(CASE WHEN NOT p."isEncore" AND p.position = sp.first_main   THEN 1 END)::int AS "openerCount",
      COUNT(CASE WHEN NOT p."isEncore" AND p.position = sp.last_main    THEN 1 END)::int AS "closerCount",
      COUNT(CASE WHEN     p."isEncore" AND p.position = sp.first_encore THEN 1 END)::int AS "encoreOpenerCount",
      COUNT(CASE WHEN     p."isEncore" AND p.position = sp.last_encore  THEN 1 END)::int AS "encoreCloserCount"
    FROM "Song" s
    JOIN "Performance" p  ON p."songId"  = s.id
    JOIN show_positions sp ON sp."showId" = p."showId"
    GROUP BY s.id, s.name, s."albumName", s."albumSlug"
    HAVING
      COUNT(CASE WHEN NOT p."isEncore" AND p.position = sp.first_main   THEN 1 END) > 0
      OR COUNT(CASE WHEN NOT p."isEncore" AND p.position = sp.last_main    THEN 1 END) > 0
      OR COUNT(CASE WHEN     p."isEncore" AND p.position = sp.first_encore THEN 1 END) > 0
      OR COUNT(CASE WHEN     p."isEncore" AND p.position = sp.last_encore  THEN 1 END) > 0
    ORDER BY "openerCount" DESC
  `;
}

// ── Search ────────────────────────────────────────────────────────────────────

export type SearchResults = {
  songs: Array<{
    name: string;
    albumName: string | null;
    albumSlug: string | null;
    playCount: number;
  }>;
  shows: Array<{
    id: string;
    eventDate: Date;
    venueName: string;
    venueCity: string;
    venueState: string | null;
    venueCountry: string;
    tourName: string | null;
    songCount: number;
  }>;
};

export async function search(query: string): Promise<SearchResults> {
  const q = query.trim();
  if (!q) return { songs: [], shows: [] };

  const [songs, shows] = await Promise.all([
    prisma.song.findMany({
      where: { name: { contains: q, mode: "insensitive" } },
      orderBy: { performances: { _count: "desc" } },
      take: 10,
      include: { _count: { select: { performances: true } } },
    }),
    prisma.show.findMany({
      where: {
        OR: [
          { venueName:    { contains: q, mode: "insensitive" } },
          { venueCity:    { contains: q, mode: "insensitive" } },
          { venueState:   { contains: q, mode: "insensitive" } },
          { tourName:     { contains: q, mode: "insensitive" } },
        ],
      },
      orderBy: { eventDate: "desc" },
      take: 20,
      include: { _count: { select: { performances: true } } },
    }),
  ]);

  return {
    songs: songs.map((s) => ({
      name: s.name,
      albumName: s.albumName,
      albumSlug: s.albumSlug,
      playCount: s._count.performances,
    })),
    shows: shows.map((s) => ({
      id: s.id,
      eventDate: s.eventDate,
      venueName: s.venueName,
      venueCity: s.venueCity,
      venueState: s.venueState,
      venueCountry: s.venueCountry,
      tourName: s.tourName,
      songCount: s._count.performances,
    })),
  };
}

// ── Homepage stats ────────────────────────────────────────────────────────────

export async function getHeroStats() {
  const [
    totalShows,
    totalSongs,
    totalPerformances,
    totalRecordings,
    topSongs,
    gapLeaders,
    recentShows,
    firstShow,
    lastShow,
  ] = await Promise.all([
    prisma.show.count(),

    prisma.song.count({ where: { performances: { some: {} } } }),

    prisma.performance.count(),

    prisma.show.count({ where: { recordings: { some: {} } } }),

    prisma.song.findMany({
      take: 5,
      orderBy: { performances: { _count: "desc" } },
      include: { _count: { select: { performances: true } } },
    }),

    prisma.$queryRaw<Array<{ name: string; gap: number }>>`
      WITH show_ranks AS (
        SELECT id, ROW_NUMBER() OVER (ORDER BY "eventDate" ASC) AS rank
        FROM "Show"
      ),
      total_shows AS (SELECT COUNT(*)::int AS total FROM "Show"),
      last_show_rank AS (
        SELECT DISTINCT ON (p."songId")
          p."songId",
          sr.rank AS last_rank
        FROM "Performance" p
        JOIN "Show" sh ON sh.id = p."showId"
        JOIN show_ranks sr ON sr.id = sh.id
        ORDER BY p."songId", sh."eventDate" DESC
      )
      SELECT s.name, (ts.total - lsr.last_rank)::int AS gap
      FROM "Song" s
      JOIN last_show_rank lsr ON lsr."songId" = s.id
      CROSS JOIN total_shows ts
      ORDER BY gap DESC
      LIMIT 5
    `,

    prisma.show.findMany({
      take: 5,
      orderBy: { eventDate: "desc" },
      include: { _count: { select: { performances: true } } },
    }),

    prisma.show.findFirst({ orderBy: { eventDate: "asc" }, select: { eventDate: true } }),
    prisma.show.findFirst({ orderBy: { eventDate: "desc" }, select: { eventDate: true, id: true } }),
  ]);

  return {
    totalShows,
    totalSongs,
    totalPerformances,
    totalRecordings,
    topSongs: topSongs.map((s) => ({
      name: s.name,
      plays: s._count.performances,
    })),
    gapLeaders,
    recentShows: recentShows.map((s) => ({
      id: s.id,
      eventDate: s.eventDate,
      venueName: s.venueName,
      venueCity: s.venueCity,
      venueState: s.venueState,
      venueCountry: s.venueCountry,
      tourName: s.tourName,
      songCount: s._count.performances,
    })),
    firstShow,
    lastShow,
  };
}
