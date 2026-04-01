import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { headers } from "next/headers";

const SCHICHT_TYPEN = [
  "FRUEH",
  "SPAET",
  "NACHT",
  "SPRINGER",
  "URLAUB",
  "KRANK",
  "X_FREI",
] as const;

const timeRegex = /^\d{2}:\d{2}$/;

const updateSchema = z
  .object({
    von: z.string().regex(timeRegex, "Format HH:MM erwartet"),
    bis: z.string().regex(timeRegex, "Format HH:MM erwartet"),
    pauseVon: z
      .string()
      .regex(timeRegex, "Format HH:MM erwartet")
      .optional()
      .nullable(),
    pauseBis: z
      .string()
      .regex(timeRegex, "Format HH:MM erwartet")
      .optional()
      .nullable(),
    schicht: z.enum(SCHICHT_TYPEN),
  })
  .refine(
    (d) => {
      if (d.schicht === "NACHT") return true;
      return d.von < d.bis;
    },
    { message: "Arbeitsende muss nach Arbeitsbeginn liegen", path: ["bis"] },
  )
  .refine(
    (d) => {
      if (!d.pauseVon || !d.pauseBis) return true;
      return d.pauseVon < d.pauseBis;
    },
    { message: "Pausenende muss nach Pausenbeginn liegen", path: ["pauseBis"] },
  )
  .refine(
    (d) => {
      if (!d.pauseVon || !d.pauseBis) return true;
      const toMin = (t: string) => {
        const [h, m] = t.split(":").map(Number);
        return h * 60 + m;
      };
      const pauseMinutes =
        (toMin(d.pauseBis) - toMin(d.pauseVon) + 1440) % 1440;
      return pauseMinutes >= 30;
    },
    { message: "Pause muss mindestens 30 Minuten betragen", path: ["pauseBis"] },
  );

function timeToDbValue(time: string): Date {
  return new Date(`1970-01-01T${time}:00Z`);
}

async function requireAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user || session.user.role !== "admin") return null;
  return session;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
  }

  const { id } = await params;

  const existing = await prisma.zeitbuchung.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(
      { error: "Zeitbuchung nicht gefunden" },
      { status: 404 },
    );
  }

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validierungsfehler", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { von, bis, pauseVon, pauseBis, schicht } = parsed.data;

  const zeitbuchung = await prisma.zeitbuchung.update({
    where: { id },
    data: {
      von: timeToDbValue(von),
      bis: timeToDbValue(bis),
      pauseVon: pauseVon ? timeToDbValue(pauseVon) : null,
      pauseBis: pauseBis ? timeToDbValue(pauseBis) : null,
      schicht,
    },
    include: {
      mitarbeiter: {
        select: { id: true, name: true, weeklyWorkRequirement: true },
      },
    },
  });

  return NextResponse.json(zeitbuchung);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
  }

  const { id } = await params;

  const existing = await prisma.zeitbuchung.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(
      { error: "Zeitbuchung nicht gefunden" },
      { status: 404 },
    );
  }

  await prisma.zeitbuchung.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
