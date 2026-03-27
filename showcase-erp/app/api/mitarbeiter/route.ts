import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { headers } from "next/headers";

const MITARBEITER_SKILLS = [
  "MUEHLE",
  "WALZE",
  "EXTRAKTION",
  "LECITHIN",
] as const;

const createMitarbeiterSchema = z.object({
  referenzNummer: z.string().min(1, "Referenznummer ist erforderlich"),
  name: z.string().min(1, "Name ist erforderlich"),
  skills: z.array(z.enum(MITARBEITER_SKILLS)).min(1, "Mindestens ein Skill"),
  weeklyWorkRequirement: z.number().positive(),
  urlaubsAnspruch: z.number().int().positive(),
  account: z
    .object({
      email: z.string().email("Ungültige E-Mail"),
      password: z.string().min(8, "Passwort muss mindestens 8 Zeichen haben"),
      name: z.string().min(1, "Name ist erforderlich"),
    })
    .optional(),
});

async function requireAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user || session.user.role !== "admin") {
    return null;
  }

  return session;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
  }

  const mitarbeiter = await prisma.mitarbeiter.findMany({
    include: { user: { select: { id: true, email: true, name: true } } },
    orderBy: { referenzNummer: "asc" },
  });

  return NextResponse.json(mitarbeiter);
}

export async function POST(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = createMitarbeiterSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validierungsfehler", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { account, ...mitarbeiterData } = parsed.data;

  let userId: string | undefined;

  if (account) {
    // Create user account via Better Auth admin API
    const created = await auth.api.createUser({
      body: {
        email: account.email,
        password: account.password,
        name: account.name,
        role: "user",
      },
    });

    if (!created?.user) {
      return NextResponse.json(
        { error: "Benutzerkonto konnte nicht erstellt werden" },
        { status: 500 }
      );
    }

    userId = created.user.id;
  }

  const mitarbeiter = await prisma.mitarbeiter.create({
    data: {
      ...mitarbeiterData,
      userId,
    },
    include: { user: { select: { id: true, email: true, name: true } } },
  });

  return NextResponse.json(mitarbeiter, { status: 201 });
}
