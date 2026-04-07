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
 * - Each production facility gets 1 employee per active shift.
 * - Overflow employees go to SPRINGER.
 * - Respects skill constraints.
 */
export function assignFacilities(
  rotationPlan: Map<string, RotationEntry[]>,
  employees: Employee[],
  unavailable: Map<string, Set<string>>,
  alreadyAssigned: Set<string>
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
    const facilityAssigned = new Set<string>();

    // First pass: assign one employee per production facility
    for (const facility of PRODUCTION_TEILANLAGEN) {
      const requiredSkill = TEILANLAGE_TO_SKILL[facility];
      // Find an unassigned employee with the required skill
      const candidate = empIds.find(
        (id) =>
          !assigned.has(id) &&
          empById.get(id)!.skills.includes(requiredSkill!)
      );
      if (candidate) {
        assigned.add(candidate);
        facilityAssigned.add(facility);
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

    // Second pass: remaining employees go to SPRINGER
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
