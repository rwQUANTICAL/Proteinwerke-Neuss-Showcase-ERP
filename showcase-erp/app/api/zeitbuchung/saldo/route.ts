import { NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { headers } from "next/headers";
import { berechneStundensaldo } from "@/app/lib/entities/zeitbuchung/saldoBerechnung";

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
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

  // Saldo now naturally drops for past approved FZA days (not counted as absence).
  // We only need to deduct pending + future approved days for availability.
  const { saldo } = await berechneStundensaldo(mitarbeiter.id);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Pending (BEANTRAGT) FZA — not yet in saldo
  const pendingAntraege = await prisma.freizeitausgleichAntrag.findMany({
    where: { mitarbeiterId: mitarbeiter.id, status: "BEANTRAGT" },
  });
  const beantragtDays = pendingAntraege.reduce((sum, a) => {
    return sum + Math.round((a.bis.getTime() - a.von.getTime()) / 86400000) + 1;
  }, 0);

  // Future approved FZA days (tomorrow+) — saldo hasn't dropped for these yet
  const approvedAntraege = await prisma.freizeitausgleichAntrag.findMany({
    where: {
      mitarbeiterId: mitarbeiter.id,
      status: "GENEHMIGT",
      bis: { gte: tomorrow },
    },
  });
  const genehmigtFutureDays = approvedAntraege.reduce((sum, a) => {
    const start = a.von >= tomorrow ? a.von : tomorrow;
    return sum + Math.round((a.bis.getTime() - start.getTime()) / 86400000) + 1;
  }, 0);

  // Total approved FZA days (all time) — for display
  const allApprovedAntraege = await prisma.freizeitausgleichAntrag.findMany({
    where: { mitarbeiterId: mitarbeiter.id, status: "GENEHMIGT" },
  });
  const genehmigtTotalDays = allApprovedAntraege.reduce((sum, a) => {
    return sum + Math.round((a.bis.getTime() - a.von.getTime()) / 86400000) + 1;
  }, 0);

  const beantragtStunden = beantragtDays * 8;
  const genehmigtStunden = genehmigtTotalDays * 8;
  const reservedHours = (beantragtDays + genehmigtFutureDays) * 8;
  const availableHours = saldo - reservedHours;
  const verfuegbareTage = Math.floor(Math.max(availableHours, 0) / 8);

  return NextResponse.json({
    saldo: Math.round(saldo * 100) / 100,
    genehmigtStunden,
    beantragtStunden,
    verfuegbareStunden: Math.round(availableHours * 100) / 100,
    verfuegbareTage,
  });
}
