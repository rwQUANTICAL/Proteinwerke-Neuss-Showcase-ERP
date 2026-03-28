import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { headers } from "next/headers";
import {
  validateSkillForTeilanlage,
  validate12DayRule,
} from "@/app/lib/entities/zuteilung/zuteilungValidation";

const TEILANLAGEN = [
  "MUEHLE",
  "WALZE",
  "EXTRAKTION",
  "LECITHIN",
  "SPRINGER",
] as const;

const SCHICHT_TYPEN = [
  "FRUEH",
  "SPAET",
  "NACHT",
  "SPRINGER",
  "URLAUB",
  "KRANK",
  "X_FREI",
] as const;

const createSchema = z.object({
  mitarbeiterId: z.string().min(1),
  teilanlage: z.enum(TEILANLAGEN),
  datum: z.string().date(),
  schicht: z.enum(SCHICHT_TYPEN),
  zeitplanId: z.string().min(1),
});

async function requireAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user || session.user.role !== "admin") return null;
  return session;
}

export async function POST(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = createSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validierungsfehler", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { mitarbeiterId, teilanlage, datum, schicht, zeitplanId } =
    parsed.data;
  const datumDate = new Date(datum + "T00:00:00Z");

  // Fetch employee to validate skills
  const mitarbeiter = await prisma.mitarbeiter.findUnique({
    where: { id: mitarbeiterId },
    select: { skills: true },
  });

  if (!mitarbeiter) {
    return NextResponse.json(
      { error: "Mitarbeiter nicht gefunden" },
      { status: 404 }
    );
  }

  // Validate skill for Teilanlage
  const skillCheck = validateSkillForTeilanlage(mitarbeiter.skills, teilanlage);
  if (!skillCheck.valid) {
    return NextResponse.json(
      { error: skillCheck.message },
      { status: 400 }
    );
  }

  // Validate 12-day rule (only for working shifts)
  const NON_WORKING = ["URLAUB", "KRANK", "X_FREI"];
  if (!NON_WORKING.includes(schicht)) {
    const dayRule = await validate12DayRule(mitarbeiterId, datumDate);
    if (!dayRule.valid) {
      return NextResponse.json({ error: dayRule.message }, { status: 400 });
    }
  }

  // Create the Zuteilung
  try {
    const zuteilung = await prisma.zuteilung.create({
      data: {
        mitarbeiterId,
        teilanlage,
        datum: datumDate,
        schicht,
        zeitplanId,
        erstelltVonId: session.user.id,
      },
      include: {
        mitarbeiter: {
          select: {
            id: true,
            referenzNummer: true,
            name: true,
            skills: true,
          },
        },
        erstelltVon: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(zuteilung, { status: 201 });
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: string }).code === "P2002"
    ) {
      return NextResponse.json(
        {
          error:
            "Für diesen Mitarbeiter existiert bereits eine Zuteilung an diesem Datum",
        },
        { status: 409 }
      );
    }
    throw err;
  }
}
