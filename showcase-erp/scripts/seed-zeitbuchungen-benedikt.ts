import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import type { SchichtTyp } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString, ssl: { rejectUnauthorized: false } });
const prisma = new PrismaClient({ adapter });

const SCHICHT_CONFIGS: Record<string, { von: string; bis: string; pauseVon: string; pauseBis: string }> = {
  FRUEH:    { von: "06:00", bis: "14:30", pauseVon: "09:30", pauseBis: "10:00" },
  SPAET:    { von: "14:00", bis: "22:30", pauseVon: "17:30", pauseBis: "18:00" },
  NACHT:    { von: "22:00", bis: "06:30", pauseVon: "01:30", pauseBis: "02:00" },
  SPRINGER: { von: "06:00", bis: "14:30", pauseVon: "09:30", pauseBis: "10:00" },
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
  // Find Benedikt's Mitarbeiter record (name in DB is "Hans Dieter")
  const benedikt = await prisma.mitarbeiter.findFirst({
    where: { name: "Hans Dieter" },
  });

  if (!benedikt) {
    console.error("Mitarbeiter Hans Dieter nicht gefunden!");
    process.exit(1);
  }

  console.log(`Mitarbeiter gefunden: ${benedikt.referenzNummer} (${benedikt.name})`);

  // Get all Zuteilungen for Benedikt up to 2026-04-30
  const endDate = new Date("2026-04-30T23:59:59Z");
  const today = new Date("2026-04-27T23:59:59Z"); // Don't create future entries beyond today

  const zuteilungen = await prisma.zuteilung.findMany({
    where: {
      mitarbeiterId: benedikt.id,
      datum: { lte: today },
      schicht: { in: ["FRUEH", "SPAET", "NACHT", "SPRINGER"] as SchichtTyp[] },
    },
    orderBy: { datum: "asc" },
  });

  console.log(`${zuteilungen.length} Arbeitstage im Schichtplan bis ${today.toISOString().split("T")[0]} gefunden.`);

  if (zuteilungen.length === 0) {
    console.log("Keine Zuteilungen gefunden. Prüfe ob Benedikt einem Schichtplan zugewiesen ist.");
    // Fallback: Show all Zuteilungen for debugging
    const allZut = await prisma.zuteilung.findMany({
      where: { mitarbeiterId: benedikt.id },
      take: 5,
      orderBy: { datum: "desc" },
    });
    console.log("Letzte Zuteilungen:", allZut.map(z => `${z.datum.toISOString().split("T")[0]} ${z.schicht}`));
    process.exit(0);
  }

  // Delete existing Zeitbuchungen for Benedikt to re-seed
  const deleted = await prisma.zeitbuchung.deleteMany({
    where: { mitarbeiterId: benedikt.id },
  });
  console.log(`${deleted.count} bestehende Zeitbuchungen gelöscht.`);

  let created = 0;

  for (const zut of zuteilungen) {
    const schicht = zut.schicht as string;
    const config = SCHICHT_CONFIGS[schicht];
    if (!config) {
      continue;
    }

    // Mostly over 8:30h (~85%), occasionally under (~15%)
    const datumStr = zut.datum.toISOString().split("T")[0];

    const von = jitter(config.von, 5);
    const [vH, vM] = von.split(":").map(Number);
    const startMin = vH * 60 + vM;
    // 85% chance: 520-545 min (8:40-9:05), 15% chance: 490-510 min (8:10-8:30)
    const isOver = Math.random() < 0.85;
    const totalMin = isOver
      ? 520 + Math.floor(Math.random() * 26)   // 520–545 min (8h40 – 9h05)
      : 490 + Math.floor(Math.random() * 21);  // 490–510 min (8h10 – 8h30)
    const endMin = (startMin + totalMin) % 1440;
    const bis = `${String(Math.floor(endMin / 60)).padStart(2, "0")}:${String(endMin % 60).padStart(2, "0")}`;

    // 30 min pause roughly in the middle of the shift
    const pauseStartMin = startMin + Math.floor(totalMin / 2) - 15 + Math.floor(Math.random() * 10);
    const pauseEndMin = pauseStartMin + 30;
    const pauseVon = `${String(Math.floor((pauseStartMin % 1440) / 60)).padStart(2, "0")}:${String(pauseStartMin % 60).padStart(2, "0")}`;
    const pauseBis = `${String(Math.floor((pauseEndMin % 1440) / 60)).padStart(2, "0")}:${String(pauseEndMin % 60).padStart(2, "0")}`;

    try {
      await prisma.zeitbuchung.upsert({
        where: {
          mitarbeiterId_datum: {
            mitarbeiterId: benedikt.id,
            datum: new Date(datumStr + "T00:00:00Z"),
          },
        },
        update: {},
        create: {
          mitarbeiterId: benedikt.id,
          datum: new Date(datumStr + "T00:00:00Z"),
          von: timeToDb(von),
          bis: timeToDb(bis),
          pauseVon: timeToDb(pauseVon),
          pauseBis: timeToDb(pauseBis),
          schicht: zut.schicht,
        },
      });
      created++;
      const totalH = Math.floor(totalMin / 60);
      const totalM = totalMin % 60;
      console.log(`  ${datumStr} ${schicht}: ${von} - ${bis} (${totalH}h${String(totalM).padStart(2,"0")}${isOver ? " ▲" : " ▼"})`);
    } catch (e: any) {
      console.error(`  Fehler für ${datumStr}: ${e.message}`);
    }
  }

  console.log(`\n✓ ${created} Zeitbuchungen erstellt.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
