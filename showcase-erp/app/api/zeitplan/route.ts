import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { headers } from "next/headers";

const querySchema = z.object({
  jahr: z.coerce.number().int().min(2020).max(2100),
  kw: z.coerce.number().int().min(1).max(53),
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
  const parsed = querySchema.safeParse({
    jahr: searchParams.get("jahr"),
    kw: searchParams.get("kw"),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Ungültige Parameter", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { jahr, kw } = parsed.data;

  // Upsert: auto-create Zeitplan if it doesn't exist
  const zeitplan = await prisma.zeitplan.upsert({
    where: { jahr_kalenderwoche: { jahr, kalenderwoche: kw } },
    create: { jahr, kalenderwoche: kw },
    update: {},
    include: {
      zuteilungen: {
        include: {
          mitarbeiter: {
            select: {
              id: true,
              referenzNummer: true,
              name: true,
              skills: true,
            },
          },
          erstelltVon: {
            select: { id: true, name: true },
          },
        },
        orderBy: { datum: "asc" },
      },
    },
  });

  return NextResponse.json(zeitplan);
}
