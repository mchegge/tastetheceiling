"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ALBUM_HEX, albumColor } from "@/lib/album-colors";
import type { EraChartPoint } from "@/lib/queries";

type Album = { slug: string; name: string; year: number };

type Props = {
  chartData: EraChartPoint[];
  albums: Album[];
};

const OTHER_COLOR = "#52525b"; // zinc-600

function pct(value: number, total: number) {
  return total === 0 ? 0 : Math.round((value / total) * 100);
}

// Custom tooltip
function CustomTooltip({
  active,
  payload,
  label,
  mode,
  albums,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; fill: string }>;
  label?: number;
  mode: "absolute" | "percent";
  albums: Album[];
}) {
  if (!active || !payload?.length) return null;

  const total = payload.reduce((s, p) => s + (p.value ?? 0), 0);
  const items = [...payload]
    .filter((p) => p.value > 0)
    .sort((a, b) => b.value - a.value);

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-xs shadow-xl min-w-[180px]">
      <p className="font-semibold text-white mb-2">{label}</p>
      {items.map((p) => {
        const album = albums.find((a) => a.slug === p.name);
        return (
          <div key={p.name} className="flex items-center justify-between gap-3 py-0.5">
            <div className="flex items-center gap-1.5">
              <div
                className="w-2 h-2 rounded-sm shrink-0"
                style={{ backgroundColor: p.fill }}
              />
              <span className="text-zinc-300 truncate max-w-[120px]">
                {album?.name ?? "Covers / Other"}
              </span>
            </div>
            <span className="text-zinc-400 tabular-nums">
              {mode === "percent" ? `${pct(p.value, total)}%` : p.value}
            </span>
          </div>
        );
      })}
      <div className="mt-2 pt-2 border-t border-zinc-700 flex justify-between text-zinc-500">
        <span>Total</span>
        <span className="tabular-nums">{total}</span>
      </div>
    </div>
  );
}

export function ErasChart({ chartData, albums }: Props) {
  const [mode, setMode] = useState<"absolute" | "percent">("absolute");
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  // Normalise to percentages when in percent mode
  const data =
    mode === "percent"
      ? chartData.map((point) => {
          const total = albums.reduce((s, a) => s + (point[a.slug] ?? 0), 0);
          const norm: EraChartPoint = { year: point.year };
          for (const a of albums) {
            norm[a.slug] = total === 0 ? 0 : Math.round(((point[a.slug] ?? 0) / total) * 100);
          }
          return norm;
        })
      : chartData;

  function toggleAlbum(slug: string) {
    setHidden((prev) => {
      const next = new Set(prev);
      next.has(slug) ? next.delete(slug) : next.add(slug);
      return next;
    });
  }

  return (
    <div>
      {/* Mode toggle */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-sm text-zinc-500">View as:</span>
        {(["absolute", "percent"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              mode === m
                ? "bg-white text-zinc-900"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
            }`}
          >
            {m === "absolute" ? "Song count" : "Percentage"}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="w-full h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
            barCategoryGap="20%"
          >
            <XAxis
              dataKey="year"
              tick={{ fill: "#71717a", fontSize: 11 }}
              axisLine={{ stroke: "#3f3f46" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#71717a", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              unit={mode === "percent" ? "%" : ""}
            />
            <Tooltip
              content={
                <CustomTooltip mode={mode} albums={albums} />
              }
              cursor={{ fill: "rgba(255,255,255,0.03)" }}
            />
            {albums.map((album) => {
              const color =
                album.slug === "__other"
                  ? OTHER_COLOR
                  : (ALBUM_HEX[album.slug] ?? OTHER_COLOR);
              return (
                <Bar
                  key={album.slug}
                  dataKey={album.slug}
                  stackId="a"
                  fill={color}
                  hide={hidden.has(album.slug)}
                  name={album.slug}
                />
              );
            })}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend — clickable to toggle */}
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
        {albums.map((album) => {
          const color =
            album.slug === "__other"
              ? OTHER_COLOR
              : (ALBUM_HEX[album.slug] ?? OTHER_COLOR);
          const isHidden = hidden.has(album.slug);
          return (
            <button
              key={album.slug}
              onClick={() => toggleAlbum(album.slug)}
              className={`flex items-center gap-1.5 text-sm transition-opacity ${
                isHidden ? "opacity-30" : "opacity-100"
              }`}
            >
              <div
                className="w-2.5 h-2.5 rounded-sm shrink-0"
                style={{ backgroundColor: color }}
              />
              <span className="text-zinc-400 hover:text-zinc-200 transition-colors">
                {album.name}
                {album.year > 0 && (
                  <span className="text-zinc-600 ml-1">{album.year}</span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
