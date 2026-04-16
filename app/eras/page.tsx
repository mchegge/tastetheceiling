import Image from "next/image";
import { getErasData } from "@/lib/queries";
import { albumColor, ALBUM_ART } from "@/lib/album-colors";
import { ErasChart } from "./ErasChart";

export const metadata = { title: "Eras — Wilco Stats" };

export default async function ErasPage() {
  const { chartData, albums } = await getErasData();

  const albumTotals = albums.map((album) => {
    const total = chartData.reduce((sum, point) => sum + (point[album.slug] ?? 0), 0);
    return { ...album, total };
  });

  const grandTotal = albumTotals.reduce((s, a) => s + a.total, 0);

  const albumYearRange = albums.map((album) => {
    const years = chartData.filter((p) => (p[album.slug] ?? 0) > 0).map((p) => p.year);
    return { slug: album.slug, first: years[0] ?? null, last: years[years.length - 1] ?? null };
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-1">Eras</h1>
        <p className="text-zinc-400">
          How Wilco&apos;s setlists have drawn from each album across 30+ years of shows
        </p>
      </div>

      {/* Chart */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-6 mb-8">
        <h2 className="text-base font-medium text-zinc-400 mb-1">
          Songs Played per Year by Album Era
        </h2>
        <p className="text-sm text-zinc-600 mb-4">
          Click any album in the legend to hide/show it. Toggle between raw count and percentage.
        </p>
        <ErasChart chartData={chartData} albums={albums} />
      </div>

      {/* Era breakdown table */}
      <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">
        All-Time Era Breakdown
      </h2>
      <div className="rounded-lg border border-zinc-800 overflow-hidden mb-8">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900 text-sm">
              <th className="text-left px-4 py-3 text-zinc-500 font-medium">Album</th>
              <th className="text-right px-4 py-3 text-zinc-500 font-medium">Total Plays</th>
              <th className="text-right px-4 py-3 text-zinc-500 font-medium hidden sm:table-cell">Share</th>
              <th className="text-right px-4 py-3 text-zinc-500 font-medium hidden md:table-cell">First Played</th>
              <th className="text-right px-4 py-3 text-zinc-500 font-medium hidden md:table-cell">Last Played</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {albumTotals.map((album) => {
              const color = albumColor(album.slug === "__other" ? null : album.slug);
              const share = grandTotal > 0 ? (album.total / grandTotal) * 100 : 0;
              const range = albumYearRange.find((r) => r.slug === album.slug);
              return (
                <tr key={album.slug} className="hover:bg-zinc-900/60 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {ALBUM_ART[album.slug] ? (
                        <Image
                          src={ALBUM_ART[album.slug]}
                          alt={album.name}
                          width={40}
                          height={40}
                          className="rounded shrink-0 object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="w-10 h-10 rounded bg-zinc-800 shrink-0" />
                      )}
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-sm font-medium border ${color.bg} ${color.text} ${color.border}`}>
                          {album.name}
                        </span>
                        {album.year > 0 && <span className="text-zinc-600 text-sm">{album.year}</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-zinc-300 tabular-nums font-medium">
                    {album.total.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right hidden sm:table-cell">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 bg-zinc-800 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full bg-zinc-400" style={{ width: `${share}%` }} />
                      </div>
                      <span className="text-zinc-500 tabular-nums text-sm w-10 text-right">
                        {share.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-zinc-500 text-sm hidden md:table-cell tabular-nums">
                    {range?.first ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-right text-zinc-500 text-sm hidden md:table-cell tabular-nums">
                    {range?.last ?? "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Observations */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-5">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">
          Notable Patterns
        </h2>
        <ul className="space-y-3 text-zinc-400">
          <li className="flex gap-2">
            <span className="text-zinc-600 shrink-0">→</span>
            <span>
              <span className="text-zinc-200">Yankee Hotel Foxtrot</span> and{" "}
              <span className="text-zinc-200">Being There</span> songs have remained
              setlist staples across nearly every era of the band&apos;s touring life.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-zinc-600 shrink-0">→</span>
            <span>
              The arrival of <span className="text-zinc-200">A Ghost Is Born</span> in
              2004 coincides with Nels Cline joining the band — look for the shift in
              setlist density around that year.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-zinc-600 shrink-0">→</span>
            <span>
              <span className="text-zinc-200">Covers / Other</span> (Uncle Tupelo songs,
              B-sides, one-offs) have remained a consistent presence, rarely dropping
              below 10% of any given year&apos;s performances.
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}
