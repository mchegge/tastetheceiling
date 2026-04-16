import Image from "next/image";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getShowById, getShowRecordings } from "@/lib/queries";
import { albumColor, ALBUM_ART } from "@/lib/album-colors";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const show = await getShowById(id);
  if (!show) return { title: "Show Not Found — Wilco Stats" };
  const date = new Date(show.eventDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  return { title: `${date} · ${show.venueCity} — Wilco Stats` };
}

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

function formatDateShort(d: Date) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function ShowPage({ params }: Props) {
  const { id } = await params;
  const [show, { recordings, totalCount }] = await Promise.all([
    getShowById(id),
    getShowRecordings(id),
  ]);

  if (!show) notFound();

  const mainSet = show.setlist.filter((p) => !p.isEncore);
  const encores = show.setlist.filter((p) => p.isEncore);

  const albumCounts = show.setlist.reduce<Record<string, number>>((acc, p) => {
    const key = p.song.albumSlug ?? "__other";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const albumBreakdown = Object.entries(albumCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([slug, count]) => {
      const perf = show.setlist.find((p) => (p.song.albumSlug ?? "__other") === slug);
      return { slug, albumName: perf?.song.albumName ?? "Covers / Other", count };
    });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="text-sm text-zinc-600 mb-6">
        <Link href="/shows" className="hover:text-zinc-400 transition-colors">Shows</Link>
        <span className="mx-2">›</span>
        <span className="text-zinc-400">{formatDateShort(new Date(show.eventDate))}</span>
      </div>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">
          {formatDate(new Date(show.eventDate))}
        </h1>
        <p className="text-zinc-400 text-lg">
          {show.venueName}
          <span className="text-zinc-600 mx-2">·</span>
          {show.venueCity}
          {show.venueState ? `, ${show.venueState}` : ""}
          {show.venueCountry !== "United States" ? `, ${show.venueCountry}` : ""}
        </p>
        {show.tourName && (
          <p className="text-zinc-500 mt-1">{show.tourName}</p>
        )}
      </div>

      {/* Stats + album breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5 space-y-2.5">
          <div className="flex justify-between">
            <span className="text-zinc-500">Total songs</span>
            <span className="text-white font-medium">{show.setlist.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Main set</span>
            <span className="text-zinc-300">{mainSet.length}</span>
          </div>
          {encores.length > 0 && (
            <div className="flex justify-between">
              <span className="text-zinc-500">Encore</span>
              <span className="text-zinc-300">{encores.length}</span>
            </div>
          )}
          {show.setlistFmUrl && (
            <a
              href={show.setlistFmUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-sm text-zinc-600 hover:text-zinc-400 transition-colors pt-1"
            >
              View on setlist.fm ↗
            </a>
          )}
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5">
          <h3 className="text-sm text-zinc-500 font-medium mb-3">Songs by Album</h3>
          <div className="space-y-2.5">
            {albumBreakdown.map(({ slug, albumName, count }) => {
              const color = albumColor(slug === "__other" ? null : slug);
              const pct = Math.round((count / show.setlist.length) * 100);
              const artUrl = slug !== "__other" ? ALBUM_ART[slug] : undefined;
              return (
                <div key={slug} className="flex items-center gap-2 text-sm">
                  {artUrl ? (
                    <Image
                      src={artUrl}
                      alt={albumName}
                      width={28}
                      height={28}
                      className="rounded shrink-0 object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-7 h-7 rounded bg-zinc-800 shrink-0" />
                  )}
                  <div className="w-24 shrink-0 truncate">
                    <span className={color.text}>{albumName}</span>
                  </div>
                  <div className="flex-1 bg-zinc-800 rounded-full h-1.5">
                    <div className={`h-1.5 rounded-full ${color.bg}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-zinc-500 w-6 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recordings */}
      {recordings.length > 0 && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-5 mb-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
              Recordings
            </h3>
            {totalCount > 5 && (
              <a
                href={`https://archive.org/search?query=creator%3A%22Wilco%22+${new Date(show.eventDate).toISOString().split("T")[0]}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-zinc-600 hover:text-zinc-400 transition-colors"
              >
                {totalCount - 5} more on Archive.org ↗
              </a>
            )}
          </div>
          <ul className="space-y-2">
            {recordings.map((rec) => (
              <li key={rec.archiveOrgId}>
                <a
                  href={`https://archive.org/details/${rec.archiveOrgId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-4 group"
                >
                  <span className="text-zinc-300 group-hover:text-white transition-colors text-sm truncate">
                    {rec.title}
                  </span>
                  <span className="text-zinc-600 text-xs shrink-0 tabular-nums">
                    {rec.downloads.toLocaleString()} downloads
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Setlist */}
      <SetSection title="Set" songs={mainSet} />
      {encores.length > 0 && <SetSection title="Encore" songs={encores} className="mt-6" />}

      {/* Prev / Next navigation */}
      <div className="flex justify-between mt-10 pt-6 border-t border-zinc-800">
        {show.prevShow ? (
          <Link href={`/shows/${show.prevShow.id}`} className="text-zinc-500 hover:text-white transition-colors">
            ← {formatDateShort(new Date(show.prevShow.eventDate))}
          </Link>
        ) : <span />}
        {show.nextShow ? (
          <Link href={`/shows/${show.nextShow.id}`} className="text-zinc-500 hover:text-white transition-colors">
            {formatDateShort(new Date(show.nextShow.eventDate))} →
          </Link>
        ) : <span />}
      </div>
    </div>
  );
}

function SetSection({
  title, songs, className = "",
}: {
  title: string;
  songs: Array<{
    position: number;
    notes: string | null;
    song: { name: string; albumName: string | null; albumSlug: string | null; albumYear: number | null };
  }>;
  className?: string;
}) {
  return (
    <div className={className}>
      <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-2">{title}</h2>
      <div className="rounded-lg border border-zinc-800 overflow-hidden">
        <ol className="divide-y divide-zinc-800/60">
          {songs.map((p, i) => {
            const color = albumColor(p.song.albumSlug);
            return (
              <li key={p.position} className="flex items-center gap-4 px-4 py-3 hover:bg-zinc-900/60 transition-colors group">
                <span className="text-zinc-700 tabular-nums w-5 shrink-0 text-right">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/songs/${encodeURIComponent(p.song.name)}`}
                    className="font-medium text-white group-hover:text-zinc-300 transition-colors"
                  >
                    {p.song.name}
                  </Link>
                  {p.notes && <span className="ml-2 text-sm text-zinc-600">{p.notes}</span>}
                </div>
                {p.song.albumName && (
                  <span className={`hidden sm:inline-flex shrink-0 items-center px-2 py-0.5 rounded text-sm font-medium border ${color.bg} ${color.text} ${color.border}`}>
                    {p.song.albumName}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
