import Link from "next/link";
import { getSongRoles } from "@/lib/queries";
import { albumColor } from "@/lib/album-colors";
import type { SongRoleRow } from "@/lib/queries";

export const metadata = { title: "Openers & Closers — Wilco Stats" };

function RoleLeaderboard({
  title,
  description,
  songs,
  countKey,
}: {
  title: string;
  description: string;
  songs: SongRoleRow[];
  countKey: keyof SongRoleRow;
}) {
  const sorted = [...songs]
    .filter((s) => (s[countKey] as number) > 0)
    .sort((a, b) => (b[countKey] as number) - (a[countKey] as number))
    .slice(0, 15);

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 overflow-hidden">
      <div className="px-5 py-4 border-b border-zinc-800">
        <h2 className="text-base font-semibold text-white">{title}</h2>
        <p className="text-sm text-zinc-500 mt-0.5">{description}</p>
      </div>
      <ol className="divide-y divide-zinc-800/60">
        {sorted.map((song, i) => {
          const color = albumColor(song.albumSlug);
          const count = song[countKey] as number;
          const maxCount = sorted[0][countKey] as number;
          const pct = Math.round((count / maxCount) * 100);
          return (
            <li key={song.id} className="flex items-center gap-3 px-5 py-3 hover:bg-zinc-900/60 transition-colors">
              <span className="text-zinc-600 tabular-nums w-5 text-right shrink-0">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <Link
                  href={`/songs/${encodeURIComponent(song.name)}`}
                  className="text-zinc-200 hover:text-white transition-colors font-medium"
                >
                  {song.name}
                </Link>
                {song.albumName && (
                  <span className={`ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium border ${color.bg} ${color.text} ${color.border}`}>
                    {song.albumName}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="w-20 bg-zinc-800 rounded-full h-1.5 hidden sm:block">
                  <div className="h-1.5 rounded-full bg-zinc-500" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-zinc-300 tabular-nums font-medium w-8 text-right">{count}</span>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export default async function RolesPage() {
  const roles = await getSongRoles();

  const totalOpeners = roles.reduce((s, r) => s + r.openerCount, 0);
  const totalClosers = roles.reduce((s, r) => s + r.closerCount, 0);
  const totalEncoreOpeners = roles.reduce((s, r) => s + r.encoreOpenerCount, 0);
  const totalEncoreClosers = roles.reduce((s, r) => s + r.encoreCloserCount, 0);

  const uniqueOpeners = roles.filter((r) => r.openerCount > 0).length;
  const uniqueClosers = roles.filter((r) => r.closerCount > 0).length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="text-sm text-zinc-600 mb-6">
        <Link href="/songs" className="hover:text-zinc-400 transition-colors">Songs</Link>
        <span className="mx-2">›</span>
        <span className="text-zinc-400">Openers &amp; Closers</span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Openers &amp; Closers</h1>
        <p className="text-zinc-400">
          Which songs Wilco has used to open and close sets across {totalOpeners.toLocaleString()} shows.
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <StatCard value={uniqueOpeners} label="Unique Set Openers" />
        <StatCard value={uniqueClosers} label="Unique Set Closers" />
        <StatCard value={roles.filter((r) => r.encoreOpenerCount > 0).length} label="Unique Encore Openers" />
        <StatCard value={roles.filter((r) => r.encoreCloserCount > 0).length} label="Unique Encore Closers" />
      </div>

      {/* Four leaderboards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <RoleLeaderboard
          title="Set Openers"
          description="First song of the main set"
          songs={roles}
          countKey="openerCount"
        />
        <RoleLeaderboard
          title="Set Closers"
          description="Last song of the main set"
          songs={roles}
          countKey="closerCount"
        />
        <RoleLeaderboard
          title="Encore Openers"
          description="First song of the encore"
          songs={roles}
          countKey="encoreOpenerCount"
        />
        <RoleLeaderboard
          title="Encore Closers"
          description="Last song of the encore"
          songs={roles}
          countKey="encoreCloserCount"
        />
      </div>
    </div>
  );
}

function StatCard({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-4">
      <div className="text-2xl font-bold text-white tabular-nums">{value}</div>
      <div className="text-sm text-zinc-500 mt-1">{label}</div>
    </div>
  );
}
