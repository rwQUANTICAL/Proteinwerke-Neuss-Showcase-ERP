import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { headers } from "next/headers";

async function requireAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user || session.user.role !== "admin") return null;
  return session;
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

  const krankmeldung = await prisma.krankmeldung.findUnique({
    where: { id },
  });
  if (!krankmeldung) {
    return NextResponse.json(
      { error: "Krankmeldung nicht gefunden" },
      { status: 404 }
    );
  }

  // Generate all dates in range
  const dates: Date[] = [];
  const current = new Date(krankmeldung.von);
  const end = new Date(krankmeldung.bis);
  while (current <= end) {
    dates.push(new Date(current));
    current.setUTCDate(current.getUTCDate() + 1);
  }

  await prisma.$transaction(async (tx) => {
    for (const datumUTC of dates) {
      const zuteilung = await tx.zuteilung.findUnique({
        where: {
          mitarbeiterId_datum: {
            mitarbeiterId: krankmeldung.mitarbeiterId,
            datum: datumUTC,
          },
        },
      });

      if (!zuteilung || zuteilung.schicht !== "KRANK") continue;

      if (zuteilung.originalSchicht) {
        // Restore original shift
        await tx.zuteilung.update({
          where: { id: zuteilung.id },
          data: {
            schicht: zuteilung.originalSchicht,
            teilanlage: zuteilung.originalTeilanlage ?? zuteilung.teilanlage,
            originalSchicht: null,
            originalTeilanlage: null,
          },
        });
      } else {
        // Was created by sick report — delete it
        await tx.zuteilung.delete({
          where: { id: zuteilung.id },
        });
      }
    }

    await tx.krankmeldung.delete({ where: { id } });
  });

  return NextResponse.json({ success: true });
}
