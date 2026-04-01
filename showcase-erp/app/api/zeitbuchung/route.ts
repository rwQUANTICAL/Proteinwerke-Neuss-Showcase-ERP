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

const createSchema = z
  .object({
    datum: z.string().date(),
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
      // For night shift bis can be < von (crosses midnight)
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
      const pauseMinutes =
        (toMinutes(d.pauseBis) - toMinutes(d.pauseVon) + 1440) % 1440;
      return pauseMinutes >= 30;
    },
    { message: "Pause muss mindestens 30 Minuten betragen", path: ["pauseBis"] },
  );

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function timeToDbValue(time: string): Date {
  return new Date(`1970-01-01T${time}:00Z`);
}

async function requireAuth() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) return null;
  return session;
}

export async function GET(request: NextRequest) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const isAdmin = session.user.role === "admin";
  const adminView = searchParams.get("admin") === "true";
  const vonParam = searchParams.get("von");
  const bisParam = searchParams.get("bis");

  const dateFilter: Record<string, unknown> = {};
  if (vonParam) dateFilter.gte = new Date(vonParam + "T00:00:00Z");
  if (bisParam) dateFilter.lte = new Date(bisParam + "T00:00:00Z");
  const datumWhere = Object.keys(dateFilter).length > 0 ? dateFilter : undefined;

  if (isAdmin && adminView) {
    const zeitbuchungen = await prisma.zeitbuchung.findMany({
      where: datumWhere ? { datum: datumWhere } : undefined,
      include: {
        mitarbeiter: {
          select: { id: true, name: true, weeklyWorkRequirement: true },
        },
      },
      orderBy: { datum: "desc" },
    });
    return NextResponse.json(zeitbuchungen);
  }

  const mitarbeiter = await prisma.mitarbeiter.findUnique({
    where: { userId: session.user.id },
  });
  if (!mitarbeiter) {
    return NextResponse.json([], { status: 200 });
  }

  const zeitbuchungen = await prisma.zeitbuchung.findMany({
    where: {
      mitarbeiterId: mitarbeiter.id,
      ...(datumWhere ? { datum: datumWhere } : {}),
    },
    include: {
      mitarbeiter: {
        select: { id: true, name: true, weeklyWorkRequirement: true },
      },
    },
    orderBy: { datum: "desc" },
  });
  return NextResponse.json(zeitbuchungen);
}

export async function POST(request: NextRequest) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
  }

  const mitarbeiter = await prisma.mitarbeiter.findUnique({
    where: { userId: session.user.id },
  });
  if (!mitarbeiter) {
    return NextResponse.json(
      { error: "Kein Mitarbeiter-Profil verknüpft" },
      { status: 400 },
    );
  }

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validierungsfehler", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { datum, von, bis, pauseVon, pauseBis, schicht } = parsed.data;

  // Check for duplicate entry on same date
  const existing = await prisma.zeitbuchung.findFirst({
    where: {
      mitarbeiterId: mitarbeiter.id,
      datum: new Date(datum + "T00:00:00Z"),
    },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Für dieses Datum existiert bereits ein Eintrag." },
      { status: 409 },
    );
  }

  const zeitbuchung = await prisma.zeitbuchung.create({
    data: {
      mitarbeiterId: mitarbeiter.id,
      datum: new Date(datum + "T00:00:00Z"),
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
