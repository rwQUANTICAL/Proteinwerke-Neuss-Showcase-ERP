import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { headers } from "next/headers";
import { sendSickReportEmail } from "@/app/lib/send-emails/sickReportEmail";

const createSchema = z
  .object({
    von: z.string().date(),
    bis: z.string().date(),
  })
  .refine((d) => d.von <= d.bis, {
    message: "Das Startdatum muss vor oder gleich dem Enddatum liegen",
    path: ["von"],
  });

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

  // Admin management view: return all Krankmeldungen
  if (isAdmin && adminView) {
    const krankmeldungen = await prisma.krankmeldung.findMany({
      include: { mitarbeiter: { select: { id: true, name: true } } },
      orderBy: { von: "desc" },
    });
    return NextResponse.json(krankmeldungen);
  }

  // Default view: return only own Krankmeldungen
  const mitarbeiter = await prisma.mitarbeiter.findUnique({
    where: { userId: session.user.id },
  });
  if (!mitarbeiter) {
    return NextResponse.json([], { status: 200 });
  }

  const krankmeldungen = await prisma.krankmeldung.findMany({
    where: { mitarbeiterId: mitarbeiter.id },
    include: { mitarbeiter: { select: { id: true, name: true } } },
    orderBy: { von: "desc" },
  });
  return NextResponse.json(krankmeldungen);
}

/** Returns an array of ISO date strings for each day in [von, bis]. */
function getDateRange(von: string, bis: string): string[] {
  const dates: string[] = [];
  const start = new Date(von + "T00:00:00Z");
  const end = new Date(bis + "T00:00:00Z");
  const current = new Date(start);
  while (current <= end) {
    dates.push(current.toISOString().split("T")[0]);
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return dates;
}

/** Returns ISO year and calendar week for a UTC date. */
function getISOWeek(dateStr: string): { jahr: number; kw: number } {
  const d = new Date(dateStr + "T00:00:00Z");
  const dayOfWeek = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayOfWeek);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  );
  return { jahr: d.getUTCFullYear(), kw: weekNo };
}

export async function POST(request: NextRequest) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
  }

  // Find user's linked Mitarbeiter
  const mitarbeiter = await prisma.mitarbeiter.findUnique({
    where: { userId: session.user.id },
  });
  if (!mitarbeiter) {
    return NextResponse.json(
      { error: "Kein Mitarbeiter-Profil verknüpft" },
      { status: 400 }
    );
  }

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validierungsfehler", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { von, bis } = parsed.data;

  // Check for overlapping Krankmeldungen
  const overlap = await prisma.krankmeldung.findFirst({
    where: {
      mitarbeiterId: mitarbeiter.id,
      von: { lte: new Date(bis + "T00:00:00Z") },
      bis: { gte: new Date(von + "T00:00:00Z") },
    },
  });
  if (overlap) {
    return NextResponse.json(
      {
        error:
          "Es gibt bereits eine Krankmeldung in diesem Zeitraum. Krankmeldungen dürfen sich nicht überschneiden.",
      },
      { status: 409 }
    );
  }

  const dates = getDateRange(von, bis);

  // Collect affected shifts info for email
  const affectedShifts: {
    datum: string;
    originalSchicht: string | null;
    originalTeilanlage: string | null;
  }[] = [];

  const krankmeldung = await prisma.$transaction(async (tx) => {
    // 1. Create Krankmeldung
    const km = await tx.krankmeldung.create({
      data: {
        mitarbeiterId: mitarbeiter.id,
        von: new Date(von + "T00:00:00Z"),
        bis: new Date(bis + "T00:00:00Z"),
      },
      include: { mitarbeiter: { select: { id: true, name: true } } },
    });

    // 2. For each day, upsert Zeitplan + upsert/update Zuteilung
    for (const dateStr of dates) {
      const { jahr, kw } = getISOWeek(dateStr);
      const datumUTC = new Date(dateStr + "T00:00:00Z");

      // Upsert Zeitplan for this week
      const zeitplan = await tx.zeitplan.upsert({
        where: { jahr_kalenderwoche: { jahr, kalenderwoche: kw } },
        create: { jahr, kalenderwoche: kw },
        update: {},
      });

      // Check existing Zuteilung
      const existing = await tx.zuteilung.findUnique({
        where: {
          mitarbeiterId_datum: {
            mitarbeiterId: mitarbeiter.id,
            datum: datumUTC,
          },
        },
      });

      if (existing) {
        // Already KRANK or X_FREI? Skip — don't override days off
        if (existing.schicht === "KRANK" || existing.schicht === "X_FREI") {
          if (existing.schicht === "KRANK") {
            affectedShifts.push({
              datum: dateStr,
              originalSchicht: existing.originalSchicht,
              originalTeilanlage: existing.originalTeilanlage,
            });
          }
          continue;
        }

        // Store original and override with KRANK
        affectedShifts.push({
          datum: dateStr,
          originalSchicht: existing.schicht,
          originalTeilanlage: existing.teilanlage,
        });

        await tx.zuteilung.update({
          where: { id: existing.id },
          data: {
            originalSchicht: existing.schicht,
            originalTeilanlage: existing.teilanlage,
            schicht: "KRANK",
            teilanlage: "SPRINGER",
          },
        });
      } else {
        // No existing shift — create KRANK Zuteilung
        affectedShifts.push({
          datum: dateStr,
          originalSchicht: null,
          originalTeilanlage: null,
        });

        await tx.zuteilung.create({
          data: {
            mitarbeiterId: mitarbeiter.id,
            teilanlage: "SPRINGER",
            datum: datumUTC,
            schicht: "KRANK",
            erstelltVonId: session.user.id,
            zeitplanId: zeitplan.id,
          },
        });
      }
    }

    return km;
  });

  // Send email notification (fire-and-forget, don't block response)
  const firstWeek = getISOWeek(von);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const schichtplanUrl = `${baseUrl}/schichtplan`;

  sendSickReportEmail({
    employeeName: mitarbeiter.name,
    von,
    bis,
    affectedShifts,
    schichtplanUrl: `${schichtplanUrl}?kw=${firstWeek.kw}&jahr=${firstWeek.jahr}`,
  }).catch((err) => {
    console.error("Fehler beim Senden der Krankmeldungs-E-Mail:", err);
  });

  return NextResponse.json(krankmeldung, { status: 201 });
}
