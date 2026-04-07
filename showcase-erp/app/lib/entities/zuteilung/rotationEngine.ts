import { getWeekDates } from "@/app/lib/entities/schichtplan/schichtplanConstants";

/**
 * 8-day rotation cycle:
 *   0,1 = FRUEH | 2,3 = SPAET | 4,5 = NACHT | 6,7 = OFF
 */
const CYCLE_SHIFTS: string[] = [
  "FRUEH", "FRUEH", "SPAET", "SPAET", "NACHT", "NACHT", "X_FREI", "X_FREI",
];

interface PrevAssignment {
  datum: string; // ISO date
  schicht: string;
}

/**
 * Detects where an employee is in the 8-day rotation cycle based on
 * their assignments in the previous week. Returns offset 0-7.
 *
 * Uses the same epoch reference as calculateRotationForWeek so the
 * offset is consistent across weeks.
 */
export function detectCycleOffset(
  prevWeekAssignments: PrevAssignment[],
  _prevWeekDates: string[]
): number {
  if (prevWeekAssignments.length === 0) return 0;

  const epoch = new Date(Date.UTC(2024, 0, 1));

  // Score each possible offset (0-7) by how many assignments it explains
  const scores = new Array(8).fill(0);

  for (const a of prevWeekAssignments) {
    const d = new Date(a.datum + "T00:00:00Z");
    const daysSinceEpoch = Math.floor(
      (d.getTime() - epoch.getTime()) / 86400000
    );

    for (let pos = 0; pos < 8; pos++) {
      if (CYCLE_SHIFTS[pos] === a.schicht) {
        const offset = ((pos - daysSinceEpoch) % 8 + 8) % 8;
        scores[offset]++;
      }
    }
  }

  let bestOffset = 0;
  let bestScore = 0;
  for (let i = 0; i < 8; i++) {
    if (scores[i] > bestScore) {
      bestScore = scores[i];
      bestOffset = i;
    }
  }

  return bestOffset;
}

export interface RotationEntry {
  datum: string;
  schicht: string; // work shift or X_FREI for off days
}

/**
 * Calculates the rotation plan for a given week.
 * Returns a map of mitarbeiterId → array of 7 RotationEntry (Mon-Sun).
 */
export function calculateRotationForWeek(
  employees: { id: string }[],
  jahr: number,
  kw: number,
  offsets: Map<string, number>
): Map<string, RotationEntry[]> {
  const weekDates = getWeekDates(jahr, kw);
  const result = new Map<string, RotationEntry[]>();

  // We need to know how many days since an epoch for the cycle
  const monday = weekDates[0];
  const epoch = new Date(Date.UTC(2024, 0, 1)); // fixed reference point
  const daysSinceEpoch = Math.floor(
    (monday.getTime() - epoch.getTime()) / 86400000
  );

  for (const emp of employees) {
    const offset = offsets.get(emp.id) ?? 0;
    const entries: RotationEntry[] = [];

    for (let i = 0; i < 7; i++) {
      const dateStr = weekDates[i].toISOString().split("T")[0];
      const cyclePos = ((daysSinceEpoch + i + offset) % 8 + 8) % 8;
      const schicht = CYCLE_SHIFTS[cyclePos];
      entries.push({ datum: dateStr, schicht });
    }

    result.set(emp.id, entries);
  }

  return result;
}
