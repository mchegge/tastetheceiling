/**
 * Album seed script for Wilco
 *
 * Maps song names to their source album. Run after ingest.ts.
 * Safe to re-run — updates existing songs with album metadata.
 *
 * Usage (inside Docker):
 *   docker compose exec app npx tsx scripts/seed-albums.ts
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// ── Wilco discography ────────────────────────────────────────────────────────
// Format: [songName, albumName, albumSlug, albumYear, trackNumber]

const ALBUMS: Array<{
  name: string;
  slug: string;
  year: number;
  songs: Array<[string, number]>; // [songName, trackNumber]
}> = [
  {
    name: "A.M.",
    slug: "am",
    year: 1995,
    songs: [
      ["I Must Be High", 1],
      ["Casino Queen", 2],
      ["Box Full of Letters", 3],
      ["Passenger Side", 4],
      ["Dash 7", 5],
      ["Blue Eyed Soul", 6],
      ["Too Far Apart", 7],
      ["It's Just That Simple", 8],
      ["Should've Been in Love", 9],
      ["Forget the Flowers", 10],
      ["That's Not the Issue", 11],
      ["It's Just That Simple (Reprise)", 12],
    ],
  },
  {
    name: "Being There",
    slug: "being-there",
    year: 1996,
    songs: [
      ["Misunderstood", 1],
      ["Far, Far Away", 2],
      ["Monday", 3],
      ["Outta Mind (Outta Sight)", 4],
      ["Forget the Flowers", 5],
      ["Red-Eyed and Blue", 6],
      ["I Got You (At the End of the Century)", 7],
      ["What's the World Got in Store", 8],
      ["Hotel Arizona", 9],
      ["Say You Miss Me", 10],
      ["Sunken Treasure", 11],
      ["Someday Soon", 12],
      ["Dreamer in My Dreams", 13],
      ["Kingpin", 14],
      ["Why Would You Wanna Live", 15],
      ["The Lonely 1", 16],
      ["Theologians", 17],
      ["Someone Else's Song", 18],
      ["Sunken Treasure (Acoustic)", 19],
    ],
  },
  {
    name: "Mermaid Avenue",
    slug: "mermaid-avenue",
    year: 1998,
    songs: [
      ["Walt Whitman's Niece", 1],
      ["California Stars", 2],
      ["Way Over Yonder in the Minor Key", 3],
      ["Birds and Ships", 4],
      ["Hoodoo Voodoo", 5],
      ["She Came Along to Me", 6],
      ["At My Window Sad and Lonely", 7],
      ["Ingrid Bergman", 8],
      ["Christ for President", 9],
      ["I Guess I Planted", 10],
      ["One by One", 11],
      ["Airline to Heaven", 12],
    ],
  },
  {
    name: "Summerteeth",
    slug: "summerteeth",
    year: 1999,
    songs: [
      ["Nothing'severgonnastandinmyway(again)", 1],
      ["She's a Jar", 2],
      ["A Shot in the Arm", 3],
      ["We're Just Friends", 4],
      ["I'm Always in Love", 5],
      ["Nothing'severgonnastandinmyway(again) (Reprise)", 6],
      ["Pieholden Suite", 7],
      ["How to Fight Loneliness", 8],
      ["Via Chicago", 9],
      ["ELT", 10],
      ["My Darling", 11],
      ["When You Wake Up Feeling Old", 12],
      ["Summer Teeth", 13],
      ["In a Future Age", 14],
    ],
  },
  {
    name: "Mermaid Avenue Vol. II",
    slug: "mermaid-avenue-vol-ii",
    year: 2000,
    songs: [
      ["Airline to Heaven", 1],
      ["My Flying Saucer", 2],
      ["Feed of Man", 3],
      ["Hot Rod Hotel", 4],
      ["Remember the Mountain Bed", 5],
      ["Blood of the Lamb", 6],
      ["Against Th' Law", 7],
      ["All You Fascists", 8],
      ["Joe DiMaggio Done It Again", 9],
      ["Meanest Man", 10],
      ["Black Wind Blowing", 11],
      ["Someday Some Morning Sometime", 12],
    ],
  },
  {
    name: "Yankee Hotel Foxtrot",
    slug: "yankee-hotel-foxtrot",
    year: 2002,
    songs: [
      ["I Am Trying to Break Your Heart", 1],
      ["Kamera", 2],
      ["Radio Cure", 3],
      ["War on War", 4],
      ["Jesus, Etc.", 5],
      ["Ashes of American Flags", 6],
      ["Heavy Metal Drummer", 7],
      ["I'm the Man Who Loves You", 8],
      ["Pot Kettle Black", 9],
      ["Poor Places", 10],
      ["Reservations", 11],
    ],
  },
  {
    name: "A Ghost Is Born",
    slug: "a-ghost-is-born",
    year: 2004,
    songs: [
      ["At Least That's What You Said", 1],
      ["Hell Is Chrome", 2],
      ["Spiders (Kidsmoke)", 3],
      ["Muzzle of Bees", 4],
      ["Hummingbird", 5],
      ["Handshake Drugs", 6],
      ["Wishful Thinking", 7],
      ["Company in My Back", 8],
      ["I'm a Wheel", 9],
      ["Theologians", 10],
      ["Less Than You Think", 11],
      ["The Late Greats", 12],
    ],
  },
  {
    name: "Sky Blue Sky",
    slug: "sky-blue-sky",
    year: 2007,
    songs: [
      ["Either Way", 1],
      ["You Are My Face", 2],
      ["Impossible Germany", 3],
      ["Sky Blue Sky", 4],
      ["Side With the Seeds", 5],
      ["Shake It Off", 6],
      ["Please Be Patient with Me", 7],
      ["Hate It Here", 8],
      ["Leave Me (Like You Found Me)", 9],
      ["Walken", 10],
      ["What Light", 11],
      ["On and On and On", 12],
    ],
  },
  {
    name: "Wilco (The Album)",
    slug: "wilco-the-album",
    year: 2009,
    songs: [
      ["Wilco (The Song)", 1],
      ["Deeper Down", 2],
      ["One Wing", 3],
      ["Bull Black Nova", 4],
      ["You and I", 5],
      ["You Never Know", 6],
      ["Country Disappeared", 7],
      ["Solitaire", 8],
      ["I'll Fight", 9],
      ["Sonny Feeling", 10],
      ["Everlasting Everything", 11],
    ],
  },
  {
    name: "The Whole Love",
    slug: "the-whole-love",
    year: 2011,
    songs: [
      ["Art of Almost", 1],
      ["I Might", 2],
      ["Sunloathe", 3],
      ["Dawned on Me", 4],
      ["Black Moon", 5],
      ["Born Alone", 6],
      ["Open Mind", 7],
      ["Capitol City", 8],
      ["Standing O", 9],
      ["Rising Red Lung", 10],
      ["Whole Love", 11],
      ["One Sunday Morning (Song for Jane Smiley's Boyfriend)", 12],
    ],
  },
  {
    name: "Star Wars",
    slug: "star-wars",
    year: 2015,
    songs: [
      ["EKG", 1],
      ["More...", 2],
      ["Random Name Generator", 3],
      ["The Joke Explained", 4],
      ["You Satellite", 5],
      ["Taste the Ceiling", 6],
      ["Pickled Ginger", 7],
      ["Where Do I Begin", 8],
      ["Cold Slope", 9],
      ["King of You", 10],
    ],
  },
  {
    name: "Schmilco",
    slug: "schmilco",
    year: 2016,
    songs: [
      ["Normal American Kids", 1],
      ["If I Ever Was a Child", 2],
      ["Cry All Day", 3],
      ["Common Sense", 4],
      ["Nope", 5],
      ["Happiness", 6],
      ["Quarters", 7],
      ["Someone to Lose", 8],
      ["For What It's Worth", 9],
      ["Locator", 10],
      ["Shrug and Destroy", 11],
      ["We Aren't the World (Safety Girl)", 12],
      ["Just Say Goodbye", 13],
    ],
  },
  {
    name: "Ode to Joy",
    slug: "ode-to-joy",
    year: 2019,
    songs: [
      ["Bright Leaves", 1],
      ["Before Us", 2],
      ["One and a Half Stars", 3],
      ["Everyone Hides", 4],
      ["White Wooden Cross", 5],
      ["Love Is Everywhere (Beware)", 6],
      ["Rally Cap", 7],
      ["Quiet Amplifier", 8],
      ["Empty Corner", 9],
      ["Hold Me Anyway", 10],
      ["We Were Lucky", 11],
    ],
  },
  {
    name: "Cruel Country",
    slug: "cruel-country",
    year: 2022,
    songs: [
      ["I Am My Mother", 1],
      ["Tired of Taking It Out on You", 2],
      ["Hints", 3],
      ["The Empty Condor", 4],
      ["Falling Apart (Right Now)", 5],
      ["Cruel Country", 6],
      ["Ambulance", 7],
      ["Many Worlds", 8],
      ["Darkness Is Cheap", 9],
      ["Hearts Hard to Find", 10],
      ["All Across the World", 11],
      ["Grief", 12],
      ["The Universe", 13],
      ["Story to Tell", 14],
      ["Please", 15],
      ["Country Song Upside Down", 16],
      ["Magnet", 17],
      ["Evening Sun", 18],
      ["The Plains", 19],
      ["Pain and Love", 20],
      ["Bird Without a Tail / Base of My Skull", 21],
    ],
  },
];

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Seeding album data for Wilco songs...\n");

  let updated = 0;
  let notFound = 0;

  for (const album of ALBUMS) {
    for (const [songName, trackNumber] of album.songs) {
      const result = await prisma.song.updateMany({
        where: { name: songName },
        data: {
          albumName: album.name,
          albumSlug: album.slug,
          albumYear: album.year,
          albumTrack: trackNumber,
        },
      });

      if (result.count > 0) {
        updated++;
      } else {
        notFound++;
        // Only log songs that weren't found (likely not in DB yet or name mismatch)
        console.log(`  Not in DB: "${songName}" (${album.name})`);
      }
    }
  }

  const totalSongs = await prisma.song.count();
  const untagged = await prisma.song.count({ where: { albumSlug: null } });

  console.log(`\nDone.`);
  console.log(`  Songs updated with album data: ${updated}`);
  console.log(`  Songs not yet in DB: ${notFound}`);
  console.log(`  Total songs in DB: ${totalSongs}`);
  console.log(`  Songs without album assignment: ${untagged}`);

  if (untagged > 0) {
    const samples = await prisma.song.findMany({
      where: { albumSlug: null },
      take: 10,
      orderBy: { performances: { _count: "desc" } },
    });
    console.log(`\n  Most-played untagged songs (covers, B-sides, etc.):`);
    for (const s of samples) {
      console.log(`    - "${s.name}"`);
    }
  }
}

main()
  .catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
