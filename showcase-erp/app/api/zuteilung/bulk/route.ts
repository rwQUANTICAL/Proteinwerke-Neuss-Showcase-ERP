import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { headers } from "next/headers";
import { validateSkillForTeilanlage } from "@/app/lib/entities/zuteilung/zuteilungValidation";

const TEILANLAGEN = [
  "MUEHLE", "WALZE", "EXTRAKTION", "LECITHIN", "SPRINGER",
] as const;

const SCHICHT_TYPEN = [
  "FRUEH", "SPAET", "NACHT", "SPRINGER", "URLAUB", "KRANK", "X_FREI",
] as const;

const bulkItemSchema = z.object({
  mitarbeiterId: z.string().min(1),
  teilanlage: z.enum(TEILANLAGEN),
  datum: z.string().date(),
  schicht: z.enum(SCHICHT_TYPEN),
});

const bulkSchema = z.object({
  zeitplanId: z.string().min(1),
  zuteilungen: z.array(bulkItemSchema).min(1).max(200),
});

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = bulkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validierungsfehler", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { zeitplanId, zuteilungen } = parsed.data;

  // Fetch all referenced employees in one query
  const empIds = [...new Set(zuteilungen.map((z) => z.mitarbeiterId))];
  const employees = await prisma.mitarbeiter.findMany({
    where: { id: { in: empIds } },
    select: { id: true, skills: true },
  });
  const empMap = new Map(employees.map((e) => [e.id, e]));

  const created: string[] = [];
  const skipped: { datum: string; mitarbeiterId: string; reason: string }[] = [];

  // Use a transaction for atomicity
  await prisma.$transaction(async (tx) => {
    for (const item of zuteilungen) {
      const emp = empMap.get(item.mitarbeiterId);
      if (!emp) {
        skipped.push({ datum: item.datum, mitarbeiterId: item.mitarbeiterId, reason: "Mitarbeiter nicht gefunden" });
        continue;
      }

      const skillCheck = validateSkillForTeilanlage(emp.skills as string[], item.teilanlage);
      if (!skillCheck.valid) {
        skipped.push({ datum: item.datum, mitarbeiterId: item.mitarbeiterId, reason: skillCheck.message! });
        continue;
      }

      try {
        const z = await tx.zuteilung.create({
          data: {
            mitarbeiterId: item.mitarbeiterId,
            teilanlage: item.teilanlage,
            datum: new Date(item.datum + "T00:00:00Z"),
            schicht: item.schicht,
            zeitplanId,
            erstelltVonId: session.user.id,
          },
        });
        created.push(z.id);
      } catch (err: unknown) {
        if (
          typeof err === "object" && err !== null && "code" in err &&
          (err as { code: string }).code === "P2002"
        ) {
          skipped.push({ datum: item.datum, mitarbeiterId: item.mitarbeiterId, reason: "Bereits zugewiesen" });
        } else {
          throw err;
        }
      }
    }
  });

  return NextResponse.json({
    created: created.length,
    skipped,
  }, { status: 201 });
}
