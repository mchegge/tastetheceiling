import Link from "next/link";
import { getHeroStats } from "@/lib/queries";

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function yearsSpanned(first: Date, last: Date) {
  return new Date(last).getFullYear() - new Date(first).getFullYear() + 1;
}

export default async function HomePage() {
  const stats = await getHeroStats();
  const years =
    stats.firstShow && stats.lastShow
      ? yearsSpanned(stats.firstShow.eventDate, stats.lastShow.eventDate)
      : null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      {/* Hero */}
      <div className="mb-12">
        <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-4">
          Every Wilco show,<br />
          <span className="text-zinc-400">every song, every era.</span>
        </h1>
        <p className="text-zinc-500 text-xl max-w-xl">
          Deep stats on {stats.totalShows.toLocaleString()} concerts spanning{" "}
          {years ?? "30+"} years — setlist history, song gaps, era breakdowns, and more.
        </p>
      </div>

      {/* Big stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
        <BigStat value={stats.totalShows.toLocaleString()} label="Shows" href="/shows" />
        <BigStat value={stats.totalSongs.toLocaleString()} label="Unique Songs" href="/songs" />
        <BigStat value={stats.totalPerformances.toLocaleString()} label="Total Songs Played" href="/songs" />
        <BigStat
          value={years ? `${years}` : "30+"}
          label="Years"
          href="/shows"
          sub={
            stats.firstShow
              ? `${new Date(stats.firstShow.eventDate).getFullYear()}–${new Date(stats.lastShow!.eventDate).getFullYear()}`
              : undefined
          }
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        {/* Most played */}
        <div className="md:col-span-1 rounded-lg border border-zinc-800 bg-zinc-900/40 p-5">
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-3">
            Most Played Songs
          </h2>
          <ol className="space-y-2.5">
            {stats.topSongs.map((song, i) => (
              <li key={song.name} className="flex items-center gap-3">
                <span className="text-zinc-700 tabular-nums w-4 shrink-0">{i + 1}</span>
                <Link
                  href={`/songs/${encodeURIComponent(song.name)}`}
                  className="flex-1 text-zinc-200 hover:text-white transition-colors truncate"
                >
                  {song.name}
                </Link>
                <span className="text-zinc-500 tabular-nums shrink-0">
                  {song.plays.toLocaleString()}
                </span>
              </li>
            ))}
          </ol>
          <Link href="/songs" className="mt-4 block text-sm text-zinc-600 hover:text-zinc-400 transition-colors">
            All songs →
          </Link>
        </div>

        {/* Gap leaders */}
        <div className="md:col-span-1 rounded-lg border border-zinc-800 bg-zinc-900/40 p-5">
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-1">
            Longest Current Gaps
          </h2>
          <p className="text-sm text-zinc-600 mb-3">Shows since last played</p>
          <ol className="space-y-2.5">
            {stats.gapLeaders.map((song, i) => (
              <li key={song.name} className="flex items-center gap-3">
                <span className="text-zinc-700 tabular-nums w-4 shrink-0">{i + 1}</span>
                <Link
                  href={`/songs/${encodeURIComponent(song.name)}`}
                  className="flex-1 text-zinc-200 hover:text-white transition-colors truncate"
                >
                  {song.name}
                </Link>
                <span
                  className={`tabular-nums shrink-0 font-medium ${
                    song.gap > 200 ? "text-red-400" : song.gap > 100 ? "text-orange-400" : "text-yellow-400"
                  }`}
                >
                  {song.gap}
                </span>
              </li>
            ))}
          </ol>
          <Link href="/songs?sort=gap" className="mt-4 block text-sm text-zinc-600 hover:text-zinc-400 transition-colors">
            Full gap tracker →
          </Link>
        </div>

        {/* Recent shows */}
        <div className="md:col-span-1 rounded-lg border border-zinc-800 bg-zinc-900/40 p-5">
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-3">
            Recent Shows
          </h2>
          <ol className="space-y-3">
            {stats.recentShows.map((show) => (
              <li key={show.id}>
                <Link href={`/shows/${show.id}`} className="block group">
                  <div className="text-zinc-200 group-hover:text-white transition-colors">
                    {show.venueCity}
                    {show.venueState ? `, ${show.venueState}` : ""}
                    {show.venueCountry !== "United States" ? `, ${show.venueCountry}` : ""}
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-sm text-zinc-600">{formatDate(new Date(show.eventDate))}</span>
                    <span className="text-sm text-zinc-600">{show.songCount} songs</span>
                  </div>
                </Link>
              </li>
            ))}
          </ol>
          <Link href="/shows" className="mt-4 block text-sm text-zinc-600 hover:text-zinc-400 transition-colors">
            All shows →
          </Link>
        </div>
      </div>

      {/* Nav cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <NavCard href="/songs" title="Songs" description="Play counts, gaps, and full performance histories for every song in Wilco's live catalog." />
        <NavCard href="/shows" title="Shows" description="Browse all 1,900+ shows by year or tour. Every setlist, every venue." />
        <NavCard href="/eras" title="Eras" description="See how Wilco's setlists have drawn from each album era across 30 years of touring." />
      </div>
    </div>
  );
}

function BigStat({ value, label, href, sub }: { value: string; label: string; href: string; sub?: string }) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-4 hover:border-zinc-600 hover:bg-zinc-900 transition-colors group"
    >
      <div className="text-2xl sm:text-3xl font-bold text-white tabular-nums">{value}</div>
      <div className="text-base text-zinc-500 mt-1">{label}</div>
      {sub && <div className="text-base text-zinc-700 mt-0.5">{sub}</div>}
    </Link>
  );
}

function NavCard({ href, title, description }: { href: string; title: string; description: string }) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-zinc-800 bg-zinc-900/20 p-5 hover:border-zinc-600 hover:bg-zinc-900/60 transition-colors group"
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-lg text-white">{title}</h3>
        <span className="text-zinc-600 group-hover:text-zinc-400 transition-colors text-xl leading-none">→</span>
      </div>
      <p className="text-sm text-zinc-500 leading-relaxed">{description}</p>
    </Link>
  );
}
