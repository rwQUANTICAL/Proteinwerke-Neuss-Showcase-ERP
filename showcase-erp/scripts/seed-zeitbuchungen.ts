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
  FRUEH: { von: "06:00", bis: "14:30", pauseVon: "09:30", pauseBis: "10:00" },
  SPAET: { von: "14:00", bis: "22:30", pauseVon: "17:30", pauseBis: "18:00" },
  NACHT: { von: "22:00", bis: "06:30", pauseVon: "01:30", pauseBis: "02:00" },
  SPRINGER: {
    von: "06:00",
    bis: "14:30",
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

async function main() {
  const mitarbeiter = await prisma.mitarbeiter.findMany();
  if (mitarbeiter.length === 0) {
    console.error("Keine Mitarbeiter gefunden. Bitte erst seed-employees laufen lassen.");
    process.exit(1);
  }

  // Clear existing data
  await prisma.zeitbuchung.deleteMany();
  console.log(`Seeding Zeitbuchungen für ${mitarbeiter.length} Mitarbeiter (6-on/2-off, 4 Wochen)...`);

  const today = new Date();
  const startDate = new Date(today);
  startDate.setUTCDate(startDate.getUTCDate() - 28);

  const SCHICHT_CYCLE: SchichtTyp[] = ["FRUEH", "SPAET", "NACHT", "FRUEH", "SPAET", "NACHT"];
  let created = 0;

  for (const ma of mitarbeiter) {
    const maIdx = mitarbeiter.indexOf(ma);
    // Each employee starts at a different point in the 8-day cycle
    // The pattern is always: 6 work, 2 off, repeating continuously
    const cycleStart = (maIdx * 3) % 8;

    for (let dayNum = 0; dayNum < 28; dayNum++) {
      const datum = new Date(startDate);
      datum.setUTCDate(startDate.getUTCDate() + dayNum);
      if (datum > today) continue;

      // Continuous 8-day cycle: positions 0-5 = work, 6-7 = off
      const posInCycle = (dayNum + cycleStart) % 8;
      if (posInCycle >= 6) continue;

      // Rare random absence (~5%)
      if (Math.random() < 0.05) continue;

      const schichtIdx = (Math.floor(dayNum / 8) + maIdx) % SCHICHT_CYCLE.length;
      const schicht = SCHICHT_CYCLE[schichtIdx];
      const config = SCHICHT_CONFIGS[schicht];

      // Start on time (±3 min), end slightly late (+2 to +15 min) → majority > 8h
      const von = jitter(config.von, 3);
      const [bH, bM] = config.bis.split(":").map(Number);
      const extra = 2 + Math.floor(Math.random() * 14); // +2 to +15 min
      const bisTotal = ((bH * 60 + bM + extra) % 1440);
      const bis = `${String(Math.floor(bisTotal / 60)).padStart(2, "0")}:${String(bisTotal % 60).padStart(2, "0")}`;
      const pauseVon = config.pauseVon;
      const pauseBis = config.pauseBis;

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
      } catch {
        // Skip duplicates silently
      }
    }
  }

  console.log(`✓ ${created} Zeitbuchungen erstellt.`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
