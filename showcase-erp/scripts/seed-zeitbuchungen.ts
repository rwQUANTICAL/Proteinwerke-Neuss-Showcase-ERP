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

async function main() {
  const mitarbeiter = await prisma.mitarbeiter.findMany();
  if (mitarbeiter.length === 0) {
    console.error("Keine Mitarbeiter gefunden. Bitte erst seed-employees laufen lassen.");
    process.exit(1);
  }

  // Clear existing data
  await prisma.zeitbuchung.deleteMany();
  console.log(`Seeding Zeitbuchungen für ${mitarbeiter.length} Mitarbeiter (6-on/2-off, 4 Wochen)...`);

  // Generate entries for the last 4 weeks using a 6-on/2-off rotation
  const today = new Date();
  const startDate = new Date(today);
  startDate.setUTCDate(startDate.getUTCDate() - 28);

  const SCHICHT_CYCLE: SchichtTyp[] = ["FRUEH", "SPAET", "NACHT", "FRUEH", "SPAET", "NACHT"];
  let created = 0;

  // Some employees get overtime (longer shifts / extra days), some get deficit
  const overtimeEmployees = new Set(
    mitarbeiter.slice(0, Math.ceil(mitarbeiter.length * 0.4)).map((m) => m.id),
  );
  const deficitEmployees = new Set(
    mitarbeiter.slice(Math.ceil(mitarbeiter.length * 0.7)).map((m) => m.id),
  );

  for (const ma of mitarbeiter) {
    const maIdx = mitarbeiter.indexOf(ma);
    // Each employee starts their 6-on/2-off cycle on a different offset
    const cycleOffset = maIdx * 2;

    const current = new Date(startDate);

    for (let dayNum = 0; dayNum < 28; dayNum++) {
      const datum = new Date(current);
      datum.setUTCDate(current.getUTCDate() + dayNum);

      // Don't create entries in the future
      if (datum > today) continue;

      // 6-on/2-off: position in 8-day cycle
      const cycleDay = ((dayNum + cycleOffset) % 8);
      const isWorkDay = cycleDay < 6;
      if (!isWorkDay) continue;

      // Random absence (~8% chance)
      if (Math.random() < 0.08) continue;

      const schichtIdx = (Math.floor((dayNum + cycleOffset) / 8) + maIdx) % SCHICHT_CYCLE.length;
      const schicht = SCHICHT_CYCLE[schichtIdx];
      const config = SCHICHT_CONFIGS[schicht];

      let von = jitter(config.von, 10);
      let bis = jitter(config.bis, 15);
      const pauseVon = jitter(config.pauseVon, 5);
      const pauseBis = jitter(config.pauseBis, 10);

      // Overtime employees: ~30% of shifts run 30-60 min longer
      if (overtimeEmployees.has(ma.id) && Math.random() < 0.3) {
        const extraMin = 30 + Math.floor(Math.random() * 31);
        const [bH, bM] = bis.split(":").map(Number);
        const total = ((bH * 60 + bM + extraMin) % 1440);
        bis = `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
      }

      // Deficit employees: ~20% of shifts start late (15-40 min)
      if (deficitEmployees.has(ma.id) && Math.random() < 0.2) {
        const lateMin = 15 + Math.floor(Math.random() * 26);
        const [vH, vM] = von.split(":").map(Number);
        const total = ((vH * 60 + vM + lateMin) % 1440);
        von = `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
      }

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
  }

  console.log(`✓ ${created} Zeitbuchungen erstellt.`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
