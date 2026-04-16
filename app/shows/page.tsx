import Link from "next/link";
import { getShows, getShowFilters } from "@/lib/queries";
import { YearSelect } from "./YearSelect";

export const metadata = { title: "Shows — Wilco Stats" };

const PAGE_SIZE = 50;

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric", year: "numeric",
  });
}

function formatDateShort(d: Date) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function ShowsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; tour?: string; page?: string }>;
}) {
  const { year: rawYear, tour, page: rawPage } = await searchParams;
  const year = rawYear ? parseInt(rawYear, 10) : undefined;
  const page = rawPage ? Math.max(1, parseInt(rawPage, 10)) : 1;

  const [{ shows, total }, { years, tours }] = await Promise.all([
    getShows({ year, tour, page }),
    getShowFilters(),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  function buildHref(overrides: { year?: number | null; tour?: string | null; page?: number }) {
    const params = new URLSearchParams();
    const y = "year" in overrides ? overrides.year : year;
    const t = "tour" in overrides ? overrides.tour : tour;
    const p = overrides.page ?? 1;
    if (y) params.set("year", String(y));
    if (t) params.set("tour", t);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return `/shows${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-1">Shows</h1>
        <p className="text-zinc-400">
          {total.toLocaleString()} shows
          {year ? ` in ${year}` : ""}
          {tour ? ` · ${tour}` : ""}
        </p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar filters */}
        <aside className="hidden lg:block w-52 shrink-0">
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-2">Year</h3>
            <div className="space-y-0.5">
              <Link
                href={buildHref({ year: null })}
                className={`block px-2 py-1.5 rounded transition-colors ${
                  !year ? "text-white bg-zinc-700" : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                }`}
              >
                All years
              </Link>
              {years.map((y) => (
                <Link
                  key={y}
                  href={buildHref({ year: y })}
                  className={`block px-2 py-1.5 rounded transition-colors ${
                    year === y ? "text-white bg-zinc-700" : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                  }`}
                >
                  {y}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-2">Tour</h3>
            <div className="space-y-0.5">
              <Link
                href={buildHref({ tour: null })}
                className={`block px-2 py-1.5 rounded transition-colors ${
                  !tour ? "text-white bg-zinc-700" : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                }`}
              >
                All tours
              </Link>
              {tours.map((t) => (
                <Link
                  key={t}
                  href={buildHref({ tour: t })}
                  className={`block px-2 py-1.5 rounded truncate transition-colors ${
                    tour === t ? "text-white bg-zinc-700" : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                  }`}
                  title={t}
                >
                  {t}
                </Link>
              ))}
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Mobile filters */}
          <div className="flex gap-2 mb-4 lg:hidden">
            <YearSelect years={years} currentYear={year} />
          </div>

          {/* Shows table */}
          <div className="rounded-lg border border-zinc-800 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900 text-sm">
                  <th className="text-left px-4 py-3 text-zinc-500 font-medium">Date</th>
                  <th className="text-left px-4 py-3 text-zinc-500 font-medium hidden sm:table-cell">Venue</th>
                  <th className="text-left px-4 py-3 text-zinc-500 font-medium">City</th>
                  <th className="text-left px-4 py-3 text-zinc-500 font-medium hidden md:table-cell">Tour</th>
                  <th className="text-right px-4 py-3 text-zinc-500 font-medium">Songs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {shows.map((show) => (
                  <tr key={show.id} className="hover:bg-zinc-900/60 transition-colors group">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Link
                        href={`/shows/${show.id}`}
                        className="font-medium text-white group-hover:text-zinc-300 transition-colors tabular-nums"
                      >
                        <span className="hidden sm:inline">{formatDate(new Date(show.eventDate))}</span>
                        <span className="sm:hidden">{formatDateShort(new Date(show.eventDate))}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-zinc-400 hidden sm:table-cell max-w-[200px] truncate">
                      {show.venueName}
                    </td>
                    <td className="px-4 py-3 text-zinc-400 whitespace-nowrap">
                      {show.venueCity}
                      {show.venueState ? `, ${show.venueState}` : ""}
                      {show.venueCountry !== "United States" && (
                        <span className="text-zinc-600 ml-1 text-sm">{show.venueCountry}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell max-w-[200px]">
                      {show.tourName ? (
                        <span className="text-zinc-500 text-sm truncate block">{show.tourName}</span>
                      ) : (
                        <span className="text-zinc-700 text-sm">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-400 tabular-nums">
                      {show.songCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-zinc-500">Page {page} of {totalPages}</span>
              <div className="flex gap-2">
                {page > 1 && (
                  <Link href={buildHref({ page: page - 1 })} className="px-4 py-2 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors">
                    ← Prev
                  </Link>
                )}
                {page < totalPages && (
                  <Link href={buildHref({ page: page + 1 })} className="px-4 py-2 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors">
                    Next →
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
