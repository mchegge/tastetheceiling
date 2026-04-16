/**
 * Next.js instrumentation hook — runs once when the server starts.
 *
 * Schedules a monthly refresh of recent Wilco setlists from setlist.fm.
 * Only active in the Node.js runtime (not Edge).
 */

export async function register() {
  // Only schedule in Node.js runtime, not Edge
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  // Avoid double-scheduling in dev hot-reload by using a module-level guard
  if ((globalThis as Record<string, unknown>).__refreshCronScheduled) return;
  (globalThis as Record<string, unknown>).__refreshCronScheduled = true;

  const { default: cron } = await import("node-cron");
  const { refreshRecentShows } = await import("@/lib/refresh");

  // Run on the 1st of every month at 3:00 AM
  cron.schedule("0 3 1 * *", async () => {
    console.log("[refresh] Monthly cron triggered");
    try {
      await refreshRecentShows();
    } catch (err) {
      console.error("[refresh] Cron job failed:", err);
    }
  });

  console.log("[refresh] Monthly setlist refresh scheduled (1st of each month at 3am)");
}
