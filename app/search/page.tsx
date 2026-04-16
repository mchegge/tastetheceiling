import Link from "next/link";
import { search } from "@/lib/queries";
import { albumColor } from "@/lib/album-colors";
import { SearchInput } from "./SearchInput";

export const metadata = { title: "Search — Wilco Stats" };

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const results = q.trim() ? await search(q) : null;
  const hasResults =
    results && (results.songs.length > 0 || results.shows.length > 0);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-6">Search</h1>

      {/* Search form */}
      <form method="GET" action="/search" className="mb-8">
        <div className="flex gap-3">
          <div className="flex-1">
            <SearchInput defaultValue={q} />
          </div>
          <button
            type="submit"
            className="px-5 py-3 bg-white text-zinc-900 font-semibold rounded-lg hover:bg-zinc-200 transition-colors shrink-0"
          >
            Search
          </button>
        </div>
      </form>

      {/* No query yet */}
      {!q.trim() && (
        <p className="text-zinc-500">
          Search across songs, venues, cities, and tour names.
        </p>
      )}

      {/* Query with no results */}
      {q.trim() && results && !hasResults && (
        <p className="text-zinc-500">
          No results for <span className="text-zinc-300">&ldquo;{q}&rdquo;</span>.
        </p>
      )}

      {/* Results */}
      {hasResults && (
        <div className="space-y-8">
          {/* Songs */}
          {results.songs.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-3">
                Songs
                <span className="ml-2 font-normal text-zinc-600 normal-case tracking-normal">
                  {results.songs.length} match{results.songs.length !== 1 ? "es" : ""}
                </span>
              </h2>
              <div className="rounded-lg border border-zinc-800 overflow-hidden">
                <ul className="divide-y divide-zinc-800/60">
                  {results.songs.map((song) => {
                    const color = albumColor(song.albumSlug);
                    return (
                      <li key={song.name} className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-900/60 transition-colors">
                        <Link
                          href={`/songs/${encodeURIComponent(song.name)}`}
                          className="flex-1 font-medium text-zinc-200 hover:text-white transition-colors"
                        >
                          {song.name}
                        </Link>
                        {song.albumName && (
                          <span className={`hidden sm:inline-flex shrink-0 items-center px-2 py-0.5 rounded text-sm font-medium border ${color.bg} ${color.text} ${color.border}`}>
                            {song.albumName}
                          </span>
                        )}
                        <span className="text-zinc-500 tabular-nums text-sm shrink-0">
                          {song.playCount.toLocaleString()} plays
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </section>
          )}

          {/* Shows */}
          {results.shows.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-3">
                Shows
                <span className="ml-2 font-normal text-zinc-600 normal-case tracking-normal">
                  {results.shows.length} match{results.shows.length !== 1 ? "es" : ""}
                  {results.shows.length === 20 && " (showing first 20)"}
                </span>
              </h2>
              <div className="rounded-lg border border-zinc-800 overflow-hidden">
                <ul className="divide-y divide-zinc-800/60">
                  {results.shows.map((show) => (
                    <li key={show.id}>
                      <Link
                        href={`/shows/${show.id}`}
                        className="flex items-center gap-4 px-4 py-3 hover:bg-zinc-900/60 transition-colors group"
                      >
                        <span className="text-zinc-500 tabular-nums text-sm w-28 shrink-0">
                          {formatDate(new Date(show.eventDate))}
                        </span>
                        <div className="flex-1 min-w-0">
                          <span className="text-zinc-200 group-hover:text-white transition-colors">
                            {show.venueName}
                          </span>
                          <span className="text-zinc-500 ml-2">
                            {show.venueCity}
                            {show.venueState ? `, ${show.venueState}` : ""}
                            {show.venueCountry !== "United States" ? `, ${show.venueCountry}` : ""}
                          </span>
                        </div>
                        {show.tourName && (
                          <span className="hidden md:block text-zinc-600 text-sm shrink-0 truncate max-w-[200px]">
                            {show.tourName}
                          </span>
                        )}
                        <span className="text-zinc-600 text-sm shrink-0">
                          {show.songCount} songs
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
