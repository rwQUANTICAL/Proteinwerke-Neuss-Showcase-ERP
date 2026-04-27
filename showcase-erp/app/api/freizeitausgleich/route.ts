import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { headers } from "next/headers";
import { berechneStundensaldo } from "@/app/lib/entities/zeitbuchung/saldoBerechnung";
import { sendCompTimeRequestEmail } from "@/app/lib/send-emails/compTimeRequestEmail";

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

  if (isAdmin && adminView) {
    const antraege = await prisma.freizeitausgleichAntrag.findMany({
      include: { mitarbeiter: { select: { id: true, name: true } } },
      orderBy: { von: "desc" },
    });
    return NextResponse.json(antraege);
  }

  const mitarbeiter = await prisma.mitarbeiter.findUnique({
    where: { userId: session.user.id },
  });
  if (!mitarbeiter) {
    return NextResponse.json([], { status: 200 });
  }

  const antraege = await prisma.freizeitausgleichAntrag.findMany({
    where: { mitarbeiterId: mitarbeiter.id },
    include: { mitarbeiter: { select: { id: true, name: true } } },
    orderBy: { von: "desc" },
  });
  return NextResponse.json(antraege);
}

/** Count calendar days between two dates (inclusive). */
function dayCount(von: Date, bis: Date): number {
  return Math.round((bis.getTime() - von.getTime()) / 86400000) + 1;
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

  const { von, bis } = parsed.data;
  const vonDate = new Date(von + "T00:00:00Z");
  const bisDate = new Date(bis + "T00:00:00Z");
  const requestedDays = dayCount(vonDate, bisDate);

  // Check overlap with Urlaubsanträge (BEANTRAGT or GENEHMIGT)
  const overlapUrlaub = await prisma.urlaubsantrag.findFirst({
    where: {
      mitarbeiterId: mitarbeiter.id,
      status: { in: ["BEANTRAGT", "GENEHMIGT"] },
      von: { lte: bisDate },
      bis: { gte: vonDate },
    },
  });
  if (overlapUrlaub) {
    return NextResponse.json(
      { error: "Es gibt bereits einen Urlaubsantrag in diesem Zeitraum." },
      { status: 409 },
    );
  }

  // Check overlap with Krankmeldungen
  const overlapKrank = await prisma.krankmeldung.findFirst({
    where: {
      mitarbeiterId: mitarbeiter.id,
      von: { lte: bisDate },
      bis: { gte: vonDate },
    },
  });
  if (overlapKrank) {
    return NextResponse.json(
      { error: "Es gibt bereits eine Krankmeldung in diesem Zeitraum." },
      { status: 409 },
    );
  }

  // Check overlap with other FreizeitausgleichAnträge (BEANTRAGT or GENEHMIGT)
  const overlapFZA = await prisma.freizeitausgleichAntrag.findFirst({
    where: {
      mitarbeiterId: mitarbeiter.id,
      status: { in: ["BEANTRAGT", "GENEHMIGT"] },
      von: { lte: bisDate },
      bis: { gte: vonDate },
    },
  });
  if (overlapFZA) {
    return NextResponse.json(
      { error: "Es gibt bereits einen Freizeitausgleich-Antrag in diesem Zeitraum." },
      { status: 409 },
    );
  }

  // Check hour balance (saldo) — FZA is not counted as absence,
  // so past approved FZA days have already reduced the saldo.
  const { saldo } = await berechneStundensaldo(mitarbeiter.id);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Pending FZA hours (not yet reflected in saldo)
  const pendingAntraege = await prisma.freizeitausgleichAntrag.findMany({
    where: {
      mitarbeiterId: mitarbeiter.id,
      status: "BEANTRAGT",
    },
  });
  const pendingDays = pendingAntraege.reduce(
    (sum: number, a) => sum + dayCount(a.von, a.bis),
    0,
  );

  // Future approved FZA days (saldo hasn't dropped for these yet)
  const approvedAntraege = await prisma.freizeitausgleichAntrag.findMany({
    where: {
      mitarbeiterId: mitarbeiter.id,
      status: "GENEHMIGT",
      bis: { gte: tomorrow },
    },
  });
  const approvedFutureDays = approvedAntraege.reduce((sum, a) => {
    const start = a.von >= tomorrow ? a.von : tomorrow;
    return sum + Math.round((a.bis.getTime() - start.getTime()) / 86400000) + 1;
  }, 0);

  const reservedHours = (pendingDays + approvedFutureDays) * 8;
  const availableHours = saldo - reservedHours;
  const requiredHours = requestedDays * 8;

  if (availableHours < requiredHours) {
    const verfuegbareTage = Math.floor(Math.max(availableHours, 0) / 8);
    return NextResponse.json(
      {
        error: `Nicht genügend Überstunden. Verfügbar: ${verfuegbareTage} Tage (${Math.round(availableHours * 10) / 10}h), Angefragt: ${requestedDays} Tage (${requiredHours}h).`,
      },
      { status: 400 },
    );
  }

  // Collect affected shifts for email
  const dates = getDateRange(von, bis);
  const affectedShifts: {
    datum: string;
    originalSchicht: string | null;
    originalTeilanlage: string | null;
  }[] = [];

  for (const dateStr of dates) {
    const datumUTC = new Date(dateStr + "T00:00:00Z");
    const existing = await prisma.zuteilung.findUnique({
      where: {
        mitarbeiterId_datum: {
          mitarbeiterId: mitarbeiter.id,
          datum: datumUTC,
        },
      },
    });
    if (existing && !["URLAUB", "KRANK", "X_FREI"].includes(existing.schicht)) {
      affectedShifts.push({
        datum: dateStr,
        originalSchicht: existing.schicht,
        originalTeilanlage: existing.teilanlage,
      });
    } else {
      affectedShifts.push({
        datum: dateStr,
        originalSchicht: null,
        originalTeilanlage: null,
      });
    }
  }

  const antrag = await prisma.freizeitausgleichAntrag.create({
    data: {
      mitarbeiterId: mitarbeiter.id,
      von: vonDate,
      bis: bisDate,
    },
    include: { mitarbeiter: { select: { id: true, name: true } } },
  });

  // Send email notification (fire-and-forget)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://protein-und-oelwerke-neuss-showcase.vercel.app";
  sendCompTimeRequestEmail({
    employeeName: mitarbeiter.name,
    von,
    bis,
    days: requestedDays,
    saldo,
    affectedShifts,
    abwesenheitUrl: `${baseUrl}/abwesenheit`,
  }).catch((err) => console.error("Comp time request email failed:", err));

  return NextResponse.json(antrag, { status: 201 });
}
