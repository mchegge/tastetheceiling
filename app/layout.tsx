import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Taste the Ceiling — Wilco Live Stats",
  description: "Deep stats on every Wilco show, every song, every era.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-100">
        <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur sticky top-0 z-10">
          <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link
              href="/"
              className="font-semibold text-lg tracking-tight text-white hover:text-zinc-300 transition-colors"
            >
              Taste the Ceiling — Wilco Live Stats
            </Link>
            <div className="flex items-center gap-6">
              <nav className="hidden sm:flex items-center gap-6 text-base text-zinc-400">
                <Link href="/songs" className="hover:text-white transition-colors">
                  Songs
                </Link>
                <Link href="/shows" className="hover:text-white transition-colors">
                  Shows
                </Link>
                <Link href="/eras" className="hover:text-white transition-colors">
                  Eras
                </Link>
              </nav>
              <form method="GET" action="/search">
                <input
                  type="search"
                  name="q"
                  placeholder="Search…"
                  autoComplete="off"
                  className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 w-36 focus:w-52 transition-all"
                />
              </form>
            </div>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-zinc-800 py-6 text-center text-sm text-zinc-600">
          Data from{" "}
          <a
            href="https://www.setlist.fm"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-zinc-400 transition-colors"
          >
            setlist.fm
          </a>
        </footer>
      </body>
    </html>
  );
}
