import {
  TEILANLAGE_TO_SKILL,
  PRODUCTION_TEILANLAGEN,
} from "@/app/lib/entities/schichtplan/schichtplanConstants";
import type { RotationEntry } from "./rotationEngine";
import type { VorschlagItem } from "./vorschlagTypes";

interface Employee {
  id: string;
  name: string;
  skills: string[];
}

/**
 * Assigns employees to facilities for each day+shift based on skills.
 * - Uses most-constrained-first: facilities with fewer qualified candidates
 *   are assigned first so rare skills (e.g. LECITHIN) aren't stolen by
 *   facilities that have many candidates (e.g. MUEHLE).
 * - Respects already-covered facility slots from existing assignments.
 * - Overflow employees go to SPRINGER.
 */
export function assignFacilities(
  rotationPlan: Map<string, RotationEntry[]>,
  employees: Employee[],
  unavailable: Map<string, Set<string>>,
  alreadyAssigned: Set<string>,
  existingFacilityCoverage: Map<string, Set<string>>
): VorschlagItem[] {
  const empById = new Map(employees.map((e) => [e.id, e]));
  const results: VorschlagItem[] = [];

  // Group working employees by (datum, schicht)
  const dayShiftMap = new Map<string, string[]>(); // "datum:schicht" → empIds

  const NON_WORKING = ["X_FREI", "URLAUB", "KRANK"];

  for (const [empId, entries] of rotationPlan) {
    for (const entry of entries) {
      const empUnavail = unavailable.get(empId);
      if (empUnavail?.has(entry.datum)) continue;
      if (alreadyAssigned.has(`${empId}:${entry.datum}`)) continue;

      // X_FREI entries get added directly as SPRINGER, not grouped for facility assignment
      if (NON_WORKING.includes(entry.schicht)) {
        const emp = empById.get(empId)!;
        results.push({
          mitarbeiterId: empId,
          mitarbeiterName: emp.name,
          mitarbeiterSkills: emp.skills,
          datum: entry.datum,
          schicht: entry.schicht,
          teilanlage: "SPRINGER",
          confidence: "high",
          conflicts: [],
        });
        continue;
      }

      const key = `${entry.datum}:${entry.schicht}`;
      if (!dayShiftMap.has(key)) dayShiftMap.set(key, []);
      dayShiftMap.get(key)!.push(empId);
    }
  }

  for (const [key, empIds] of dayShiftMap) {
    const [datum, schicht] = key.split(":");
    const assigned = new Set<string>();

    // Check which facilities already have coverage from existing assignments
    const coveredKey = `${datum}:${schicht}`;
    const coveredFacilities = existingFacilityCoverage.get(coveredKey) ?? new Set();

    // Only assign to facilities that don't already have someone
    const uncoveredFacilities = PRODUCTION_TEILANLAGEN.filter(
      (f) => !coveredFacilities.has(f)
    );

    // Sort by most-constrained-first: facilities with fewer qualified candidates first
    const sortedFacilities = [...uncoveredFacilities].sort((a, b) => {
      const skillA = TEILANLAGE_TO_SKILL[a]!;
      const skillB = TEILANLAGE_TO_SKILL[b]!;
      const countA = empIds.filter((id) => empById.get(id)!.skills.includes(skillA)).length;
      const countB = empIds.filter((id) => empById.get(id)!.skills.includes(skillB)).length;
      return countA - countB;
    });

    // Assign one employee per uncovered production facility
    for (const facility of sortedFacilities) {
      const requiredSkill = TEILANLAGE_TO_SKILL[facility]!;
      // Prefer employees whose only remaining unassigned-facility match is this one
      // (i.e., don't waste a specialist on a facility that has many candidates)
      const candidate = empIds.find(
        (id) =>
          !assigned.has(id) &&
          empById.get(id)!.skills.includes(requiredSkill)
      );
      if (candidate) {
        assigned.add(candidate);
        const emp = empById.get(candidate)!;
        results.push({
          mitarbeiterId: candidate,
          mitarbeiterName: emp.name,
          mitarbeiterSkills: emp.skills,
          datum,
          schicht,
          teilanlage: facility,
          confidence: "high",
          conflicts: [],
        });
      }
    }

    // Remaining employees go to SPRINGER
    for (const empId of empIds) {
      if (assigned.has(empId)) continue;
      const emp = empById.get(empId)!;
      results.push({
        mitarbeiterId: empId,
        mitarbeiterName: emp.name,
        mitarbeiterSkills: emp.skills,
        datum,
        schicht,
        teilanlage: "SPRINGER",
        confidence: "medium",
        conflicts: [],
      });
    }
  }

  return results;
}
