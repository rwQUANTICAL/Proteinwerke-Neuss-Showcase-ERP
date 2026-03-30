import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { headers } from "next/headers";

async function requireAuth() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) return null;
  return session;
}

function requireAdmin(session: { user: { role?: string | null } }) {
  return session.user.role === "admin";
}

const patchSchema = z.object({
  status: z.enum(["GENEHMIGT", "ABGELEHNT"]),
});

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

/** Returns an array of ISO date strings for each day in [von, bis]. */
function getDateRange(von: Date, bis: Date): string[] {
  const dates: string[] = [];
  const current = new Date(von);
  while (current <= bis) {
    dates.push(current.toISOString().split("T")[0]);
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return dates;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth();
  if (!session || !requireAdmin(session)) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
  }

  const { id } = await params;

  const antrag = await prisma.urlaubsantrag.findUnique({
    where: { id },
  });
  if (!antrag) {
    return NextResponse.json(
      { error: "Urlaubsantrag nicht gefunden" },
      { status: 404 }
    );
  }
  if (antrag.status !== "BEANTRAGT") {
    return NextResponse.json(
      { error: "Nur offene Anträge können bearbeitet werden" },
      { status: 400 }
    );
  }

  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validierungsfehler", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { status } = parsed.data;

  // Approval: write URLAUB into shift plan
  if (status === "GENEHMIGT") {
    const dates = getDateRange(antrag.von, antrag.bis);

    await prisma.$transaction(async (tx) => {
      await tx.urlaubsantrag.update({
        where: { id },
        data: { status: "GENEHMIGT", genehmigtVonId: session.user.id },
      });

      for (const dateStr of dates) {
        const { jahr, kw } = getISOWeek(dateStr);
        const datumUTC = new Date(dateStr + "T00:00:00Z");

        const zeitplan = await tx.zeitplan.upsert({
          where: { jahr_kalenderwoche: { jahr, kalenderwoche: kw } },
          create: { jahr, kalenderwoche: kw },
          update: {},
        });

        const existing = await tx.zuteilung.findUnique({
          where: {
            mitarbeiterId_datum: {
              mitarbeiterId: antrag.mitarbeiterId,
              datum: datumUTC,
            },
          },
        });

        if (existing) {
          // Skip if already URLAUB, KRANK, or X_FREI
          if (
            existing.schicht === "URLAUB" ||
            existing.schicht === "KRANK" ||
            existing.schicht === "X_FREI"
          ) {
            continue;
          }

          await tx.zuteilung.update({
            where: { id: existing.id },
            data: {
              originalSchicht: existing.schicht,
              originalTeilanlage: existing.teilanlage,
              schicht: "URLAUB",
              teilanlage: "SPRINGER",
            },
          });
        } else {
          await tx.zuteilung.create({
            data: {
              mitarbeiterId: antrag.mitarbeiterId,
              teilanlage: "SPRINGER",
              datum: datumUTC,
              schicht: "URLAUB",
              erstelltVonId: session.user.id,
              zeitplanId: zeitplan.id,
            },
          });
        }
      }
    });
  } else {
    // Rejection: just update status
    await prisma.urlaubsantrag.update({
      where: { id },
      data: { status: "ABGELEHNT" },
    });
  }

  const updated = await prisma.urlaubsantrag.findUnique({
    where: { id },
    include: { mitarbeiter: { select: { id: true, name: true } } },
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
  }

  const { id } = await params;
  const antrag = await prisma.urlaubsantrag.findUnique({
    where: { id },
  });
  if (!antrag) {
    return NextResponse.json(
      { error: "Urlaubsantrag nicht gefunden" },
      { status: 404 }
    );
  }

  const isAdmin = session.user.role === "admin";
  const isOwner = await prisma.mitarbeiter.findFirst({
    where: { id: antrag.mitarbeiterId, userId: session.user.id },
  });

  // Only admin or owner (if still BEANTRAGT) can delete
  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
  }
  if (!isAdmin && antrag.status !== "BEANTRAGT") {
    return NextResponse.json(
      { error: "Nur offene Anträge können zurückgezogen werden" },
      { status: 400 }
    );
  }

  // If approved, restore original shifts before deleting
  if (antrag.status === "GENEHMIGT") {
    const dates: Date[] = [];
    const current = new Date(antrag.von);
    const end = new Date(antrag.bis);
    while (current <= end) {
      dates.push(new Date(current));
      current.setUTCDate(current.getUTCDate() + 1);
    }

    await prisma.$transaction(async (tx) => {
      for (const datumUTC of dates) {
        const zuteilung = await tx.zuteilung.findUnique({
          where: {
            mitarbeiterId_datum: {
              mitarbeiterId: antrag.mitarbeiterId,
              datum: datumUTC,
            },
          },
        });
        if (!zuteilung || zuteilung.schicht !== "URLAUB") continue;

        if (zuteilung.originalSchicht) {
          await tx.zuteilung.update({
            where: { id: zuteilung.id },
            data: {
              schicht: zuteilung.originalSchicht,
              teilanlage:
                zuteilung.originalTeilanlage ?? zuteilung.teilanlage,
              originalSchicht: null,
              originalTeilanlage: null,
            },
          });
        } else {
          await tx.zuteilung.delete({ where: { id: zuteilung.id } });
        }
      }
      await tx.urlaubsantrag.delete({ where: { id } });
    });
  } else {
    await prisma.urlaubsantrag.delete({ where: { id } });
  }

  return NextResponse.json({ success: true });
}
