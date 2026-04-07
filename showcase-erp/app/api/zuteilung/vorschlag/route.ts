import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { headers } from "next/headers";
import { getWeekDates } from "@/app/lib/entities/schichtplan/schichtplanConstants";
import {
  getUnavailableDates,
  getExistingAssignments,
} from "@/app/lib/entities/zuteilung/availabilityService";
import {
  detectCycleOffset,
  calculateRotationForWeek,
} from "@/app/lib/entities/zuteilung/rotationEngine";
import { assignFacilities } from "@/app/lib/entities/zuteilung/facilityAssigner";
import { validateSkillForTeilanlage } from "@/app/lib/entities/zuteilung/zuteilungValidation";
import type { VorschlagItem } from "@/app/lib/entities/zuteilung/vorschlagTypes";

const requestSchema = z.object({
  jahr: z.number().int().min(2020).max(2100),
  kw: z.number().int().min(1).max(53),
});

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validierungsfehler", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { jahr, kw } = parsed.data;
  const weekDates = getWeekDates(jahr, kw);
  const startDate = weekDates[0];
  const endDate = weekDates[6];

  // Fetch all employees
  const employees = await prisma.mitarbeiter.findMany({
    select: { id: true, name: true, skills: true },
  });

  if (employees.length === 0) {
    return NextResponse.json({ vorschlaege: [] });
  }

  const mitarbeiterIds = employees.map((e) => e.id);

  // Get unavailable dates and existing assignments
  const unavailable = await getUnavailableDates(mitarbeiterIds, startDate, endDate);
  const alreadyAssigned = await getExistingAssignments(startDate, endDate);

  // Build existing facility coverage: which facilities already have someone per day+shift
  const existingZuteilungen = await prisma.zuteilung.findMany({
    where: { datum: { gte: startDate, lte: endDate } },
    select: { datum: true, schicht: true, teilanlage: true },
  });
  const existingFacilityCoverage = new Map<string, Set<string>>();
  for (const z of existingZuteilungen) {
    const dateStr = z.datum.toISOString().split("T")[0];
    const key = `${dateStr}:${z.schicht}`;
    if (!existingFacilityCoverage.has(key)) existingFacilityCoverage.set(key, new Set());
    existingFacilityCoverage.get(key)!.add(z.teilanlage);
  }

  // Detect cycle offsets from previous week
  const prevWeekDates = getWeekDates(
    kw > 1 ? jahr : jahr - 1,
    kw > 1 ? kw - 1 : 52
  );
  const prevStart = prevWeekDates[0];
  const prevEnd = prevWeekDates[6];
  const prevDateStrings = prevWeekDates.map((d) => d.toISOString().split("T")[0]);

  const prevZuteilungen = await prisma.zuteilung.findMany({
    where: {
      mitarbeiterId: { in: mitarbeiterIds },
      datum: { gte: prevStart, lte: prevEnd },
    },
    select: { mitarbeiterId: true, datum: true, schicht: true },
  });

  // Group previous assignments by employee
  const prevByEmployee = new Map<string, { datum: string; schicht: string }[]>();
  for (const z of prevZuteilungen) {
    const dateStr = z.datum.toISOString().split("T")[0];
    if (!prevByEmployee.has(z.mitarbeiterId)) {
      prevByEmployee.set(z.mitarbeiterId, []);
    }
    prevByEmployee.get(z.mitarbeiterId)!.push({ datum: dateStr, schicht: z.schicht });
  }

  // Calculate offsets
  const offsets = new Map<string, number>();
  for (const emp of employees) {
    const prevAssignments = prevByEmployee.get(emp.id) ?? [];
    offsets.set(emp.id, detectCycleOffset(prevAssignments, prevDateStrings));
  }

  // Generate rotation plan
  const rotationPlan = calculateRotationForWeek(employees, jahr, kw, offsets);

  // Assign facilities
  const vorschlaege = assignFacilities(
    rotationPlan,
    employees.map((e) => ({ id: e.id, name: e.name, skills: e.skills as string[] })),
    unavailable,
    alreadyAssigned,
    existingFacilityCoverage
  );

  // Post-validate: check skills and mark confidence
  for (const v of vorschlaege) {
    const skillCheck = validateSkillForTeilanlage(v.mitarbeiterSkills, v.teilanlage);
    if (!skillCheck.valid) {
      v.confidence = "low";
      v.conflicts.push(skillCheck.message!);
    }
  }

  // Filter out low-confidence items with real skill violations
  const validVorschlaege = vorschlaege.filter(
    (v) => !v.conflicts.some((c) => c.includes("Skill"))
  );

  return NextResponse.json({ vorschlaege: validVorschlaege });
}
