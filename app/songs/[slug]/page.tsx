import Image from "next/image";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getSongBySlug } from "@/lib/queries";
import { albumColor, ALBUM_ART } from "@/lib/album-colors";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const song = await getSongBySlug(slug);
  if (!song) return { title: "Song Not Found — Wilco Stats" };
  return { title: `${song.name} — Wilco Stats` };
}

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function formatDateShort(d: Date) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function SongPage({ params }: Props) {
  const { slug } = await params;
  const song = await getSongBySlug(slug);

  if (!song) notFound();

  const color = albumColor(song.albumSlug);
  const perfs = song.performances;
  const playCount = perfs.length;
  const firstPlayed = perfs[perfs.length - 1];
  const lastPlayed = perfs[0];

  const byYear = perfs.reduce<Record<number, number>>((acc, p) => {
    const y = new Date(p.eventDate).getFullYear();
    acc[y] = (acc[y] ?? 0) + 1;
    return acc;
  }, {});

  const allYears = Object.keys(byYear).map(Number).sort((a, b) => a - b);
  const maxYearCount = Math.max(...Object.values(byYear));

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="text-sm text-zinc-600 mb-6">
        <Link href="/songs" className="hover:text-zinc-400 transition-colors">Songs</Link>
        <span className="mx-2">›</span>
        <span className="text-zinc-400">{song.name}</span>
      </div>

      {/* Header */}
      <div className="mb-8 flex items-start gap-4">
        {song.albumSlug && ALBUM_ART[song.albumSlug] && (
          <Image
            src={ALBUM_ART[song.albumSlug]}
            alt={song.albumName ?? "Album art"}
            width={80}
            height={80}
            className="rounded-lg shrink-0 object-cover shadow-lg"
            unoptimized
          />
        )}
        <div>
          <h1 className="text-3xl font-bold text-white mb-3">{song.name}</h1>
          {song.albumName && (
            <span className={`inline-flex items-center px-3 py-1 rounded text-base font-medium border ${color.bg} ${color.text} ${color.border}`}>
              {song.albumName}
              {song.albumYear && <span className="ml-1.5 opacity-60">{song.albumYear}</span>}
            </span>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard label="Times Played" value={playCount} />
        <StatCard
          label="First Played"
          value={firstPlayed ? new Date(firstPlayed.eventDate).getFullYear().toString() : "—"}
          sub={firstPlayed ? formatDateShort(new Date(firstPlayed.eventDate)) : undefined}
        />
        <StatCard
          label="Last Played"
          value={lastPlayed ? new Date(lastPlayed.eventDate).getFullYear().toString() : "—"}
          sub={lastPlayed ? formatDateShort(new Date(lastPlayed.eventDate)) : undefined}
        />
        <StatCard
          label="Years Active"
          value={allYears.length > 0 ? `${allYears[0]}–${allYears[allYears.length - 1]}` : "—"}
        />
      </div>

      {/* Year-by-year bar chart */}
      {allYears.length > 1 && (
        <div className="mb-8 rounded-lg border border-zinc-800 bg-zinc-900/50 p-5">
          <h2 className="text-base font-medium text-zinc-400 mb-4">Plays per Year</h2>
          <div className="flex items-end gap-1 h-24">
            {allYears.map((year) => {
              const count = byYear[year] ?? 0;
              const heightPct = (count / maxYearCount) * 100;
              return (
                <div key={year} className="flex flex-col items-center flex-1 min-w-0 group">
                  <div className="relative w-full flex items-end" style={{ height: "72px" }}>
                    <div
                      className="w-full bg-zinc-600 group-hover:bg-zinc-400 transition-colors rounded-sm"
                      style={{ height: `${heightPct}%`, minHeight: "2px" }}
                      title={`${year}: ${count} plays`}
                    />
                    <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {count}
                    </span>
                  </div>
                  <span className="text-zinc-600 mt-1 text-xs leading-none">
                    {String(year).slice(2)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Performance history */}
      <div>
        <h2 className="text-base font-medium text-zinc-400 mb-3">
          Performance History
          <span className="ml-2 text-zinc-600 font-normal">({playCount} shows)</span>
        </h2>
        <div className="rounded-lg border border-zinc-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900">
                <th className="text-left px-4 py-3 text-zinc-500 font-medium">Date</th>
                <th className="text-left px-4 py-3 text-zinc-500 font-medium hidden sm:table-cell">Venue</th>
                <th className="text-left px-4 py-3 text-zinc-500 font-medium">City</th>
                <th className="text-left px-4 py-3 text-zinc-500 font-medium hidden md:table-cell">Tour</th>
                <th className="text-left px-4 py-3 text-zinc-500 font-medium hidden sm:table-cell">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {perfs.map((p) => (
                <tr key={p.showId} className="hover:bg-zinc-900/60 transition-colors">
                  <td className="px-4 py-3 text-zinc-300 tabular-nums whitespace-nowrap">
                    {p.setlistFmUrl ? (
                      <a
                        href={p.setlistFmUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-white underline decoration-zinc-600 transition-colors"
                      >
                        {formatDate(new Date(p.eventDate))}
                      </a>
                    ) : (
                      formatDate(new Date(p.eventDate))
                    )}
                    {p.isEncore && (
                      <span className="ml-2 text-sm text-zinc-600">(encore)</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-zinc-400 hidden sm:table-cell">{p.venueName}</td>
                  <td className="px-4 py-3 text-zinc-400 whitespace-nowrap">
                    {p.venueCity}{p.venueState ? `, ${p.venueState}` : ""}
                  </td>
                  <td className="px-4 py-3 text-zinc-500 text-sm hidden md:table-cell">{p.tourName ?? "—"}</td>
                  <td className="px-4 py-3 text-zinc-500 text-sm hidden sm:table-cell">{p.notes ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3">
      <div className="text-sm text-zinc-500 mb-1">{label}</div>
      <div className="text-2xl font-bold text-white tabular-nums">{value}</div>
      {sub && <div className="text-sm text-zinc-600 mt-0.5">{sub}</div>}
    </div>
  );
}
