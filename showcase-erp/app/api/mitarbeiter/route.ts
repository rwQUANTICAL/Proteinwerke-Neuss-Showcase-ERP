import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { sendWelcomeEmail } from "@/app/lib/send-emails/welcomeEmail";
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
      name: z.string().min(1, "Name ist erforderlich"),
    })
    .optional(),
});

async function requireAuth() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) return null;
  return session;
}

async function requireAdmin() {
  const session = await requireAuth();
  if (!session || session.user.role !== "admin") return null;
  return session;
}

export async function GET() {
  const session = await requireAuth();
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
    // Generate a secure random password
    const generatedPassword =
      crypto.randomBytes(12).toString("base64url").slice(0, 16) + "!A1";

    // Create user account via Better Auth admin API
    const created = await auth.api.createUser({
      body: {
        email: account.email,
        password: generatedPassword,
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

    // Send welcome email with credentials
    const baseUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
    await sendWelcomeEmail({
      to: account.email,
      name: account.name,
      password: generatedPassword,
      loginUrl: `${baseUrl}/sign-in`,
    });
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
