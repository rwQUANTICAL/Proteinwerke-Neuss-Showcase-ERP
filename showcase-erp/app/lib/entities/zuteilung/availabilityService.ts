import { prisma } from "@/app/lib/prisma";

/**
 * Returns a map of mitarbeiterId → Set of unavailable ISO date strings
 * by querying approved vacations, sick leave, approved comp time,
 * and existing Zuteilungen for the given date range.
 */
export async function getUnavailableDates(
  mitarbeiterIds: string[],
  startDate: Date,
  endDate: Date
): Promise<Map<string, Set<string>>> {
  const unavailable = new Map<string, Set<string>>();
  for (const id of mitarbeiterIds) {
    unavailable.set(id, new Set());
  }

  // Approved vacation
  const vacations = await prisma.urlaubsantrag.findMany({
    where: {
      mitarbeiterId: { in: mitarbeiterIds },
      status: "GENEHMIGT",
      von: { lte: endDate },
      bis: { gte: startDate },
    },
    select: { mitarbeiterId: true, von: true, bis: true },
  });

  for (const v of vacations) {
    addDateRange(unavailable, v.mitarbeiterId, v.von, v.bis, endDate);
  }

  // Sick leave
  const sickLeaves = await prisma.krankmeldung.findMany({
    where: {
      mitarbeiterId: { in: mitarbeiterIds },
      von: { lte: endDate },
      bis: { gte: startDate },
    },
    select: { mitarbeiterId: true, von: true, bis: true },
  });

  for (const s of sickLeaves) {
    addDateRange(unavailable, s.mitarbeiterId, s.von, s.bis, endDate);
  }

  // Approved comp time
  const compTime = await prisma.freizeitausgleichAntrag.findMany({
    where: {
      mitarbeiterId: { in: mitarbeiterIds },
      status: "GENEHMIGT",
      von: { lte: endDate },
      bis: { gte: startDate },
    },
    select: { mitarbeiterId: true, von: true, bis: true },
  });

  for (const c of compTime) {
    addDateRange(unavailable, c.mitarbeiterId, c.von, c.bis, endDate);
  }

  return unavailable;
}

/**
 * Returns a set of "mitarbeiterId:datum" keys for existing Zuteilungen in the range.
 */
export async function getExistingAssignments(
  startDate: Date,
  endDate: Date
): Promise<Set<string>> {
  const existing = await prisma.zuteilung.findMany({
    where: { datum: { gte: startDate, lte: endDate } },
    select: { mitarbeiterId: true, datum: true },
  });

  const keys = new Set<string>();
  for (const z of existing) {
    keys.add(`${z.mitarbeiterId}:${z.datum.toISOString().split("T")[0]}`);
  }
  return keys;
}

function addDateRange(
  map: Map<string, Set<string>>,
  mitarbeiterId: string,
  von: Date,
  bis: Date,
  clampEnd: Date
) {
  const set = map.get(mitarbeiterId);
  if (!set) return;
  const current = new Date(von);
  const end = bis < clampEnd ? bis : clampEnd;
  while (current <= end) {
    set.add(current.toISOString().split("T")[0]);
    current.setUTCDate(current.getUTCDate() + 1);
  }
}
