import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import type { SchichtTyp } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({
  connectionString,
  ssl: { rejectUnauthorized: false },
});
const prisma = new PrismaClient({ adapter });

const SCHICHT_CONFIGS: Record<
  string,
  { von: string; bis: string; pauseVon: string; pauseBis: string }
> = {
  FRUEH: { von: "06:00", bis: "14:00", pauseVon: "09:30", pauseBis: "10:00" },
  SPAET: { von: "14:00", bis: "22:00", pauseVon: "17:30", pauseBis: "18:00" },
  NACHT: { von: "22:00", bis: "06:00", pauseVon: "01:30", pauseBis: "02:00" },
  SPRINGER: {
    von: "06:00",
    bis: "14:00",
    pauseVon: "09:30",
    pauseBis: "10:00",
  },
};

function timeToDb(time: string): Date {
  return new Date(`1970-01-01T${time}:00Z`);
}

/** Add random jitter of ±maxMin minutes to a time string "HH:MM". */
function jitter(time: string, maxMin: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + Math.floor(Math.random() * maxMin * 2) - maxMin;
  const clamped = ((total % 1440) + 1440) % 1440;
  const hh = String(Math.floor(clamped / 60)).padStart(2, "0");
  const mm = String(clamped % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() - day + 1);
  return d;
}

async function main() {
  const mitarbeiter = await prisma.mitarbeiter.findMany();
  if (mitarbeiter.length === 0) {
    console.error("Keine Mitarbeiter gefunden. Bitte erst seed-employees laufen lassen.");
    process.exit(1);
  }

  console.log(`Seeding Zeitbuchungen für ${mitarbeiter.length} Mitarbeiter...`);

  // Generate entries for the last 8 weeks (Mon-Fri)
  const today = new Date();
  const startMonday = getMonday(today);
  startMonday.setUTCDate(startMonday.getUTCDate() - 7 * 7); // 8 weeks ago

  const SCHICHT_CYCLE: SchichtTyp[] = ["FRUEH", "SPAET", "NACHT", "FRUEH", "SPAET"];
  let created = 0;

  for (const ma of mitarbeiter) {
    const current = new Date(startMonday);

    for (let week = 0; week < 8; week++) {
      // Randomly skip a few days to create realistic gaps
      const skipDay = Math.random() < 0.1 ? Math.floor(Math.random() * 5) : -1;

      for (let day = 0; day < 5; day++) {
        const datum = new Date(current);
        datum.setUTCDate(current.getUTCDate() + day);

        // Don't create entries in the future
        if (datum > today) continue;
        // Random skip
        if (day === skipDay) continue;

        const schichtIdx = (week + mitarbeiter.indexOf(ma)) % SCHICHT_CYCLE.length;
        const schicht = SCHICHT_CYCLE[schichtIdx];
        const config = SCHICHT_CONFIGS[schicht];

        const von = jitter(config.von, 10);
        const bis = jitter(config.bis, 15);
        const pauseVon = jitter(config.pauseVon, 5);
        const pauseBis = jitter(config.pauseBis, 10);

        try {
          await prisma.zeitbuchung.upsert({
            where: {
              mitarbeiterId_datum: {
                mitarbeiterId: ma.id,
                datum: new Date(datum.toISOString().split("T")[0] + "T00:00:00Z"),
              },
            },
            update: {},
            create: {
              mitarbeiterId: ma.id,
              datum: new Date(datum.toISOString().split("T")[0] + "T00:00:00Z"),
              von: timeToDb(von),
              bis: timeToDb(bis),
              pauseVon: timeToDb(pauseVon),
              pauseBis: timeToDb(pauseBis),
              schicht,
            },
          });
          created++;
        } catch (err) {
          // Skip duplicates silently
        }
      }

      current.setUTCDate(current.getUTCDate() + 7);
    }
  }

  console.log(`✓ ${created} Zeitbuchungen erstellt.`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
