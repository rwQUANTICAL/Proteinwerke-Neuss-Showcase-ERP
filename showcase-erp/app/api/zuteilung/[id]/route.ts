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

const updateSchema = z.object({
  teilanlage: z.enum(TEILANLAGEN).optional(),
  schicht: z.enum(SCHICHT_TYPEN).optional(),
});

async function requireAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user || session.user.role !== "admin") return null;
  return session;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
  }

  const { id } = await params;

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validierungsfehler", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Fetch existing Zuteilung with mitarbeiter
  const existing = await prisma.zuteilung.findUnique({
    where: { id },
    include: {
      mitarbeiter: { select: { id: true, skills: true } },
    },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Zuteilung nicht gefunden" },
      { status: 404 }
    );
  }

  const newTeilanlage = parsed.data.teilanlage ?? existing.teilanlage;
  const newSchicht = parsed.data.schicht ?? existing.schicht;

  // Validate skill if Teilanlage changed
  if (parsed.data.teilanlage) {
    const skillCheck = validateSkillForTeilanlage(
      existing.mitarbeiter.skills,
      newTeilanlage
    );
    if (!skillCheck.valid) {
      return NextResponse.json(
        { error: skillCheck.message },
        { status: 400 }
      );
    }
  }

  // Validate 12-day rule if shift changed to a working shift
  const NON_WORKING = ["URLAUB", "KRANK", "X_FREI"];
  if (parsed.data.schicht && !NON_WORKING.includes(newSchicht)) {
    const dayRule = await validate12DayRule(
      existing.mitarbeiterId,
      existing.datum,
      id
    );
    if (!dayRule.valid) {
      return NextResponse.json({ error: dayRule.message }, { status: 400 });
    }
  }

  const updated = await prisma.zuteilung.update({
    where: { id },
    data: {
      ...(parsed.data.teilanlage && { teilanlage: newTeilanlage }),
      ...(parsed.data.schicht && { schicht: newSchicht }),
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

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
  }

  const { id } = await params;

  const existing = await prisma.zuteilung.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(
      { error: "Zuteilung nicht gefunden" },
      { status: 404 }
    );
  }

  await prisma.zuteilung.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
