import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { headers } from "next/headers";
import { sendVacationRequestEmail } from "@/app/lib/send-emails/vacationRequestEmail";

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

  // Admin view: return all Urlaubsanträge with mitarbeiter info
  if (isAdmin && adminView) {
    const antraege = await prisma.urlaubsantrag.findMany({
      include: { mitarbeiter: { select: { id: true, name: true } } },
      orderBy: { von: "desc" },
    });
    return NextResponse.json(antraege);
  }

  // Default: return own Urlaubsanträge
  const mitarbeiter = await prisma.mitarbeiter.findUnique({
    where: { userId: session.user.id },
  });
  if (!mitarbeiter) {
    return NextResponse.json([], { status: 200 });
  }

  const antraege = await prisma.urlaubsantrag.findMany({
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
  const vonDate = new Date(von + "T00:00:00Z");
  const bisDate = new Date(bis + "T00:00:00Z");
  const requestedDays = dayCount(vonDate, bisDate);

  // Check overlap with existing Urlaubsanträge (BEANTRAGT or GENEHMIGT)
  const overlap = await prisma.urlaubsantrag.findFirst({
    where: {
      mitarbeiterId: mitarbeiter.id,
      status: { in: ["BEANTRAGT", "GENEHMIGT"] },
      von: { lte: bisDate },
      bis: { gte: vonDate },
    },
  });
  if (overlap) {
    return NextResponse.json(
      { error: "Es gibt bereits einen Urlaubsantrag in diesem Zeitraum." },
      { status: 409 }
    );
  }

  // Calculate remaining vacation days
  const approvedAntraege = await prisma.urlaubsantrag.findMany({
    where: {
      mitarbeiterId: mitarbeiter.id,
      status: "GENEHMIGT",
    },
  });
  const pendingAntraege = await prisma.urlaubsantrag.findMany({
    where: {
      mitarbeiterId: mitarbeiter.id,
      status: "BEANTRAGT",
    },
  });

  const usedDays = approvedAntraege.reduce(
    (sum: number, a) => sum + dayCount(a.von, a.bis),
    0
  );
  const pendingDays = pendingAntraege.reduce(
    (sum: number, a) => sum + dayCount(a.von, a.bis),
    0
  );
  const remaining = mitarbeiter.urlaubsAnspruch - usedDays - pendingDays;

  if (requestedDays > remaining) {
    return NextResponse.json(
      {
        error: `Nicht genügend Urlaubstage verfügbar. Verfügbar: ${remaining}, Angefragt: ${requestedDays}.`,
      },
      { status: 400 }
    );
  }

  const antrag = await prisma.urlaubsantrag.create({
    data: {
      mitarbeiterId: mitarbeiter.id,
      von: vonDate,
      bis: bisDate,
    },
    include: { mitarbeiter: { select: { id: true, name: true } } },
  });

  // Send notification email (fire-and-forget)
  const origin = (await headers()).get("origin") ?? "";
  sendVacationRequestEmail({
    employeeName: mitarbeiter.name,
    von,
    bis,
    days: requestedDays,
    abwesenheitUrl: `${origin}/abwesenheit`,
  }).catch((err) => console.error("Vacation request email failed:", err));

  return NextResponse.json(antrag, { status: 201 });
}
