"use client";

import { useRef, useEffect } from "react";

export function SearchInput({ defaultValue }: { defaultValue: string }) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <input
      ref={inputRef}
      type="search"
      name="q"
      defaultValue={defaultValue}
      placeholder="Song, venue, city, or tour…"
      autoComplete="off"
      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 text-lg"
    />
  );
}
