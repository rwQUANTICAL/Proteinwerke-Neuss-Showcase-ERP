import { prisma } from "@/app/lib/prisma";
import { ARBEITSTAGE_PRO_WOCHE } from "@/app/lib/entities/zeitbuchung/zeitbuchungHooks";

interface AbwesenheitRange {
  von: Date;
  bis: Date;
}

function timeToMinutes(d: Date): number {
  return d.getUTCHours() * 60 + d.getUTCMinutes();
}

function calcNettoStundenRaw(
  von: Date,
  bis: Date,
  pauseVon: Date | null,
  pauseBis: Date | null,
): number {
  const vonMin = timeToMinutes(von);
  const bisMin = timeToMinutes(bis);
  const grossMinutes = (bisMin - vonMin + 1440) % 1440;
  let pauseMinutes = 30;
  if (pauseVon && pauseBis) {
    const diff = (timeToMinutes(pauseBis) - timeToMinutes(pauseVon) + 1440) % 1440;
    pauseMinutes = Math.max(diff, 30);
  }
  return Math.max((grossMinutes - pauseMinutes) / 60, 0);
}

function countAbwesenheitDays(
  ranges: AbwesenheitRange[],
  allDates: Set<string>,
  workedDates: Set<string>,
): number {
  let count = 0;
  for (const r of ranges) {
    const start = new Date(r.von);
    const end = new Date(r.bis);
    for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
      const key = d.toISOString().split("T")[0];
      if (allDates.has(key) && !workedDates.has(key)) count++;
    }
  }
  return count;
}

/**
 * Compute the hour balance (Stundensaldo) for a given employee.
 * Replicates the ArbeitszeitenRinge client-side logic on the server.
 */
export async function berechneStundensaldo(mitarbeiterId: string): Promise<{
  saldo: number;
  weeklyWork: number;
  sollProTag: number;
}> {
  const mitarbeiter = await prisma.mitarbeiter.findUniqueOrThrow({
    where: { id: mitarbeiterId },
    select: { weeklyWorkRequirement: true },
  });

  const weeklyWork = Number(mitarbeiter.weeklyWorkRequirement);
  const sollProTag = weeklyWork / ARBEITSTAGE_PRO_WOCHE;

  const zeitbuchungen = await prisma.zeitbuchung.findMany({
    where: { mitarbeiterId },
    select: { datum: true, von: true, bis: true, pauseVon: true, pauseBis: true },
    orderBy: { datum: "asc" },
  });

  if (zeitbuchungen.length === 0) {
    return { saldo: 0, weeklyWork, sollProTag };
  }

  // All worked dates
  const workedDates = new Set<string>(
    zeitbuchungen.map((z) => z.datum.toISOString().split("T")[0]),
  );

  // Calendar range: first Zeitbuchung → today
  const sortedDates = [...workedDates].sort();
  const start = new Date(sortedDates[0] + "T00:00:00Z");
  const end = new Date();

  const totalCalendarDays =
    Math.round((end.getTime() - start.getTime()) / 86400000) + 1;

  // All dates in range
  const allDates = new Set<string>();
  for (
    let d = new Date(start);
    d <= end;
    d.setUTCDate(d.getUTCDate() + 1)
  ) {
    allDates.add(d.toISOString().split("T")[0]);
  }

  // Total worked hours
  let totalIst = 0;
  for (const z of zeitbuchungen) {
    totalIst += calcNettoStundenRaw(z.von, z.bis, z.pauseVon, z.pauseBis);
  }

  // Absence ranges (approved vacation + sick leave)
  // NOTE: FZA is intentionally excluded — FZA consumes overtime,
  // so those days should reduce saldo (not be neutralized).
  const [urlaubsantraege, krankmeldungen] = await Promise.all([
    prisma.urlaubsantrag.findMany({
      where: { mitarbeiterId, status: "GENEHMIGT" },
      select: { von: true, bis: true },
    }),
    prisma.krankmeldung.findMany({
      where: { mitarbeiterId },
      select: { von: true, bis: true },
    }),
  ]);

  const totalAbw =
    countAbwesenheitDays(urlaubsantraege, allDates, workedDates) +
    countAbwesenheitDays(krankmeldungen, allDates, workedDates);
  totalIst += totalAbw * sollProTag;

  const totalSoll = weeklyWork * (totalCalendarDays / 7);
  const saldo = totalIst - totalSoll;

  return { saldo, weeklyWork, sollProTag };
}
