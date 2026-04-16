"use client";

export function YearSelect({
  years,
  currentYear,
}: {
  years: number[];
  currentYear?: number;
}) {
  return (
    <select
      className="bg-zinc-800 text-zinc-300 text-sm rounded px-2 py-1.5 border border-zinc-700"
      value={currentYear ?? ""}
      onChange={(e) => {
        const params = new URLSearchParams();
        if (e.target.value) params.set("year", e.target.value);
        const qs = params.toString();
        window.location.href = `/shows${qs ? `?${qs}` : ""}`;
      }}
    >
      <option value="">All years</option>
      {years.map((y) => (
        <option key={y} value={y}>
          {y}
        </option>
      ))}
    </select>
  );
}
