// Color mappings for each Wilco album era
// Used for badges and chart series throughout the app

export const ALBUM_COLORS: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  "am":                   { bg: "bg-amber-100",   text: "text-amber-800",   border: "border-amber-300" },
  "being-there":          { bg: "bg-blue-100",    text: "text-blue-800",    border: "border-blue-300" },
  "mermaid-avenue":       { bg: "bg-teal-100",    text: "text-teal-800",    border: "border-teal-300" },
  "mermaid-avenue-vol-ii":{ bg: "bg-cyan-100",    text: "text-cyan-800",    border: "border-cyan-300" },
  "summerteeth":          { bg: "bg-pink-100",    text: "text-pink-800",    border: "border-pink-300" },
  "yankee-hotel-foxtrot": { bg: "bg-orange-100",  text: "text-orange-800",  border: "border-orange-300" },
  "a-ghost-is-born":      { bg: "bg-slate-100",   text: "text-slate-700",   border: "border-slate-300" },
  "sky-blue-sky":         { bg: "bg-sky-100",     text: "text-sky-800",     border: "border-sky-300" },
  "wilco-the-album":      { bg: "bg-red-100",     text: "text-red-800",     border: "border-red-300" },
  "the-whole-love":       { bg: "bg-green-100",   text: "text-green-800",   border: "border-green-300" },
  "star-wars":            { bg: "bg-yellow-100",  text: "text-yellow-800",  border: "border-yellow-300" },
  "schmilco":             { bg: "bg-purple-100",  text: "text-purple-800",  border: "border-purple-300" },
  "ode-to-joy":           { bg: "bg-rose-100",    text: "text-rose-800",    border: "border-rose-300" },
  "cruel-country":        { bg: "bg-stone-100",   text: "text-stone-800",   border: "border-stone-300" },
};

export const DEFAULT_COLOR = {
  bg: "bg-zinc-100",
  text: "text-zinc-600",
  border: "border-zinc-300",
};

export function albumColor(slug: string | null) {
  if (!slug) return DEFAULT_COLOR;
  return ALBUM_COLORS[slug] ?? DEFAULT_COLOR;
}

// Cover Art Archive URLs (release-group front art, 250px)
export const ALBUM_ART: Record<string, string> = {
  "am":                    "https://coverartarchive.org/release-group/ec8bd9c3-bf0a-30ce-96a2-0a51f4a86e1b/front-250",
  "being-there":           "https://coverartarchive.org/release-group/5aed5f2c-4b8a-35a7-9655-906e3ea72fa1/front-250",
  "mermaid-avenue":        "https://coverartarchive.org/release-group/9ae4e54c-ec74-3f15-823a-8302fc9a832d/front-250",
  "mermaid-avenue-vol-ii": "https://coverartarchive.org/release-group/bc5b68df-a929-3979-ac3b-a2af0ca56757/front-250",
  "summerteeth":           "https://coverartarchive.org/release-group/bb7b90b8-bdb5-455c-9c8e-f87aeaf5d156/front-250",
  "yankee-hotel-foxtrot":  "https://coverartarchive.org/release-group/95f2ba4b-2dd9-38d1-8158-a416a391489c/front-250",
  "a-ghost-is-born":       "https://coverartarchive.org/release-group/355ed2eb-2b61-335c-b3e4-10ca26a17c88/front-250",
  "sky-blue-sky":          "https://coverartarchive.org/release-group/1aa7ce82-1b74-3f83-b426-531edf4d4284/front-250",
  "wilco-the-album":       "https://coverartarchive.org/release-group/c61adfc2-3488-3e14-9f91-5f904e577bc5/front-250",
  "the-whole-love":        "https://coverartarchive.org/release-group/760f9d8c-3465-497f-9186-a63b1270d9fb/front-250",
  "star-wars":             "https://coverartarchive.org/release-group/c4391e76-d64b-4cf8-8a6f-77874438430c/front-250",
  "schmilco":              "https://coverartarchive.org/release-group/90bda0c6-4f34-44c4-a829-e44956693430/front-250",
  "ode-to-joy":            "https://coverartarchive.org/release-group/ff16aeb5-f7f8-4987-94a1-bac0bd574f2e/front-250",
  "cruel-country":         "https://coverartarchive.org/release-group/e03fbefb-4b8f-4c14-974d-5e93d8a71f8c/front-250",
};

// For Recharts — hex values per album slug
export const ALBUM_HEX: Record<string, string> = {
  "am":                    "#f59e0b",
  "being-there":           "#3b82f6",
  "mermaid-avenue":        "#14b8a6",
  "mermaid-avenue-vol-ii": "#06b6d4",
  "summerteeth":           "#ec4899",
  "yankee-hotel-foxtrot":  "#f97316",
  "a-ghost-is-born":       "#64748b",
  "sky-blue-sky":          "#0ea5e9",
  "wilco-the-album":       "#ef4444",
  "the-whole-love":        "#22c55e",
  "star-wars":             "#eab308",
  "schmilco":              "#a855f7",
  "ode-to-joy":            "#f43f5e",
  "cruel-country":         "#78716c",
};
