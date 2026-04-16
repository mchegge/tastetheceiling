import Link from "next/link";
import { getSongs, SongSort } from "@/lib/queries";
import { albumColor } from "@/lib/album-colors";

export const metadata = { title: "Songs — Wilco Stats" };

const SORTS: { key: SongSort; label: string }[] = [
  { key: "plays",       label: "Most Played" },
  { key: "gap",         label: "Longest Gap" },
  { key: "lastPlayed",  label: "Recently Played" },
  { key: "firstPlayed", label: "First Played" },
  { key: "name",        label: "A–Z" },
  { key: "album",       label: "By Album" },
];

function formatDate(d: Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function SongsPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const { sort: rawSort } = await searchParams;
  const validSorts = SORTS.map((s) => s.key);
  const sort: SongSort = validSorts.includes(rawSort as SongSort) ? (rawSort as SongSort) : "plays";

  const songs = await getSongs(sort);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-1">Songs</h1>
        <p className="text-zinc-400">
          {songs.length} songs played across all Wilco shows
        </p>
      </div>

      {/* Sort tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {SORTS.map((s) => (
          <Link
            key={s.key}
            href={`/songs?sort=${s.key}`}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              sort === s.key
                ? "bg-white text-zinc-900"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
            }`}
          >
            {s.label}
          </Link>
        ))}
        <Link
          href="/songs/roles"
          className="ml-auto px-4 py-2 rounded-full text-sm font-medium bg-zinc-800/50 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-200 transition-colors border border-zinc-700"
        >
          Openers &amp; Closers →
        </Link>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-zinc-800 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900 text-sm">
              <th className="text-left px-4 py-3 text-zinc-500 font-medium w-8">#</th>
              <th className="text-left px-4 py-3 text-zinc-500 font-medium">Song</th>
              <th className="text-left px-4 py-3 text-zinc-500 font-medium hidden md:table-cell">Album</th>
              <th className="text-right px-4 py-3 text-zinc-500 font-medium">Plays</th>
              <th className="text-right px-4 py-3 text-zinc-500 font-medium hidden sm:table-cell">First Played</th>
              <th className="text-right px-4 py-3 text-zinc-500 font-medium hidden sm:table-cell">Last Played</th>
              <th className="text-right px-4 py-3 text-zinc-500 font-medium">Gap</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {songs.map((song, i) => {
              const color = albumColor(song.albumSlug);
              return (
                <tr key={song.id} className="hover:bg-zinc-900/60 transition-colors group">
                  <td className="px-4 py-3 text-zinc-600 tabular-nums text-sm">{i + 1}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/songs/${encodeURIComponent(song.name)}`}
                      className="font-medium text-white group-hover:text-zinc-300 transition-colors"
                    >
                      {song.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {song.albumName ? (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-sm font-medium border ${color.bg} ${color.text} ${color.border}`}>
                        {song.albumName}
                        {song.albumYear ? <span className="ml-1 opacity-60">{song.albumYear}</span> : null}
                      </span>
                    ) : (
                      <span className="text-zinc-600 text-sm">Cover / Other</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-zinc-300">
                    {song.playCount}
                  </td>
                  <td className="px-4 py-3 text-right text-zinc-500 text-sm hidden sm:table-cell tabular-nums">
                    {formatDate(song.firstPlayed)}
                  </td>
                  <td className="px-4 py-3 text-right text-zinc-400 text-sm hidden sm:table-cell tabular-nums">
                    {formatDate(song.lastPlayed)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {song.gap === null ? (
                      <span className="text-zinc-600">—</span>
                    ) : song.gap === 0 ? (
                      <span className="text-green-400 text-sm font-medium">Last show</span>
                    ) : (
                      <span className={`text-sm font-medium ${
                        song.gap > 100 ? "text-red-400" : song.gap > 50 ? "text-orange-400" : song.gap > 20 ? "text-yellow-400" : "text-zinc-400"
                      }`}>
                        {song.gap}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-sm text-zinc-600">
        Gap = number of shows since the song was last performed.
      </p>
    </div>
  );
}
