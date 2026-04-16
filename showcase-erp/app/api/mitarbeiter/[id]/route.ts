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

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  skills: z.array(z.enum(MITARBEITER_SKILLS)).min(1).optional(),
  weeklyWorkRequirement: z.number().positive().optional(),
  urlaubsAnspruch: z.number().int().positive().optional(),
});

async function requireAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user || session.user.role !== "admin") return null;
  return session;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validierungsfehler", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const existing = await prisma.mitarbeiter.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(
      { error: "Mitarbeiter nicht gefunden" },
      { status: 404 }
    );
  }

  const updated = await prisma.mitarbeiter.update({
    where: { id },
    data: parsed.data,
    include: { user: { select: { id: true, email: true, name: true } } },
  });

  return NextResponse.json(updated);
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

  const existing = await prisma.mitarbeiter.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(
      { error: "Mitarbeiter nicht gefunden" },
      { status: 404 }
    );
  }

  await prisma.mitarbeiter.delete({ where: { id } });

  // Also delete the linked Better Auth user account
  if (existing.userId) {
    await auth.api.removeUser({ body: { userId: existing.userId } });
  }

  return NextResponse.json({ success: true });
}
