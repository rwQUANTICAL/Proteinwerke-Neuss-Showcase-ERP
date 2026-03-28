import { prisma } from "@/app/lib/prisma";
import { TEILANLAGE_TO_SKILL } from "@/app/lib/entities/schichtplan/schichtplanConstants";

/**
 * Validates that an employee has the required skill for a given Teilanlage.
 * SPRINGER Teilanlage allows any employee.
 */
export function validateSkillForTeilanlage(
  mitarbeiterSkills: string[],
  teilanlage: string
): { valid: boolean; message?: string } {
  const requiredSkill = TEILANLAGE_TO_SKILL[teilanlage];
  if (requiredSkill === null) return { valid: true };

  if (!mitarbeiterSkills.includes(requiredSkill)) {
    return {
      valid: false,
      message: `Mitarbeiter hat nicht den erforderlichen Skill "${requiredSkill}" für Teilanlage "${teilanlage}"`,
    };
  }
  return { valid: true };
}

/**
 * Validates the 12-day consecutive work rule.
 * Employees must not work more than 12 consecutive days.
 * Non-working SchichtTyp values (URLAUB, KRANK, X_FREI) count as rest days.
 */
export async function validate12DayRule(
  mitarbeiterId: string,
  datum: Date,
  excludeZuteilungId?: string
): Promise<{ valid: boolean; message?: string }> {
  const NON_WORKING = ["URLAUB", "KRANK", "X_FREI"];

  // Check 12 days before and after the proposed date
  const startDate = new Date(datum);
  startDate.setUTCDate(startDate.getUTCDate() - 12);
  const endDate = new Date(datum);
  endDate.setUTCDate(endDate.getUTCDate() + 12);

  const zuteilungen = await prisma.zuteilung.findMany({
    where: {
      mitarbeiterId,
      datum: { gte: startDate, lte: endDate },
      ...(excludeZuteilungId ? { id: { not: excludeZuteilungId } } : {}),
    },
    select: { datum: true, schicht: true },
    orderBy: { datum: "asc" },
  });

  // Build a set of working dates
  const workingDates = new Set<string>();
  for (const z of zuteilungen) {
    if (!NON_WORKING.includes(z.schicht)) {
      workingDates.add(z.datum.toISOString().split("T")[0]);
    }
  }
  // Add the proposed date itself as a working day
  workingDates.add(datum.toISOString().split("T")[0]);

  // Check for consecutive sequences longer than 12
  const sortedDates = Array.from(workingDates)
    .sort()
    .map((d) => new Date(d + "T00:00:00Z"));

  let consecutive = 1;
  for (let i = 1; i < sortedDates.length; i++) {
    const diff =
      (sortedDates[i].getTime() - sortedDates[i - 1].getTime()) / 86400000;
    if (diff === 1) {
      consecutive++;
      if (consecutive > 12) {
        return {
          valid: false,
          message:
            "Mitarbeiter darf nicht länger als 12 Tage am Stück arbeiten",
        };
      }
    } else {
      consecutive = 1;
    }
  }

  return { valid: true };
}
