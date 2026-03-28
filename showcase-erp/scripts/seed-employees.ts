import "dotenv/config";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins";
import { PrismaClient } from "../generated/prisma/client";
import type { MitarbeiterSkill } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString, ssl: { rejectUnauthorized: false } });
const prisma = new PrismaClient({ adapter });

const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: { enabled: true },
  plugins: [admin()],
  trustedOrigins: ["http://localhost:3000"],
});

const EMPLOYEES = [
  {
    email: "tobias.hustedt@quantical.com",
    name: "Tobias Hustedt",
    password: "Passwort1234!",
    referenzNummer: "MA-002",
    skills: ["MUEHLE", "WALZE"] as MitarbeiterSkill[],
    weeklyWorkRequirement: 42,
    urlaubsAnspruch: 30,
    isAdmin: true,
  },
  {
    email: "max.mueller@proteinwerke.de",
    name: "Max Müller",
    password: "Passwort1234!",
    referenzNummer: "MA-003",
    skills: ["MUEHLE", "WALZE", "EXTRAKTION", "LECITHIN"] as MitarbeiterSkill[],
    weeklyWorkRequirement: 40,
    urlaubsAnspruch: 30,
  },
  {
    email: "anna.schmidt@proteinwerke.de",
    name: "Anna Schmidt",
    password: "Passwort1234!",
    referenzNummer: "MA-004",
    skills: ["MUEHLE", "WALZE", "EXTRAKTION"] as MitarbeiterSkill[],
    weeklyWorkRequirement: 40,
    urlaubsAnspruch: 28,
  },
  {
    email: "lars.weber@proteinwerke.de",
    name: "Lars Weber",
    password: "Passwort1234!",
    referenzNummer: "MA-005",
    skills: ["LECITHIN"] as MitarbeiterSkill[],
    weeklyWorkRequirement: 38,
    urlaubsAnspruch: 26,
  },
  {
    email: "sarah.braun@proteinwerke.de",
    name: "Sarah Braun",
    password: "Passwort1234!",
    referenzNummer: "MA-006",
    skills: ["MUEHLE", "EXTRAKTION"] as MitarbeiterSkill[],
    weeklyWorkRequirement: 40,
    urlaubsAnspruch: 30,
  },
  {
    email: "thomas.fischer@proteinwerke.de",
    name: "Thomas Fischer",
    password: "Passwort1234!",
    referenzNummer: "MA-007",
    skills: ["WALZE", "LECITHIN"] as MitarbeiterSkill[],
    weeklyWorkRequirement: 38.5,
    urlaubsAnspruch: 28,
  },
  {
    email: "julia.klein@proteinwerke.de",
    name: "Julia Klein",
    password: "Passwort1234!",
    referenzNummer: "MA-008",
    skills: ["MUEHLE", "WALZE", "LECITHIN"] as MitarbeiterSkill[],
    weeklyWorkRequirement: 40,
    urlaubsAnspruch: 30,
  },
];

async function main() {
  for (const emp of EMPLOYEES) {
    let userId: string | undefined;

    // Create user account
    try {
      const signUpRes = await auth.api.signUpEmail({
        body: { email: emp.email, password: emp.password, name: emp.name },
      });
      userId = signUpRes?.user?.id;
      if (userId) console.log(`Created user: ${emp.email} (id: ${userId})`);
    } catch {
      console.log(`User ${emp.email} may already exist. Trying sign-in...`);
    }

    if (!userId) {
      try {
        const signInRes = await auth.api.signInEmail({
          body: { email: emp.email, password: emp.password },
        });
        userId = signInRes?.user?.id;
      } catch {
        console.error(`Could not sign in ${emp.email}. Skipping.`);
        continue;
      }
    }

    if (!userId) {
      console.error(`Could not create/sign in ${emp.email}. Skipping.`);
      continue;
    }

    // Set admin role if needed
    if ("isAdmin" in emp && emp.isAdmin) {
      await prisma.user.update({
        where: { id: userId },
        data: { role: "admin" },
      });
      console.log(`Set role to admin for ${emp.email}`);
    }

    // Create or update Mitarbeiter record
    const existing = await prisma.mitarbeiter.findFirst({
      where: {
        OR: [{ userId }, { referenzNummer: emp.referenzNummer }],
      },
    });

    if (existing) {
      await prisma.mitarbeiter.update({
        where: { id: existing.id },
        data: {
          name: emp.name,
          skills: emp.skills,
          weeklyWorkRequirement: emp.weeklyWorkRequirement,
          urlaubsAnspruch: emp.urlaubsAnspruch,
          userId,
        },
      });
      console.log(`Mitarbeiter ${emp.referenzNummer} already exists — updated.`);
    } else {
      const mitarbeiter = await prisma.mitarbeiter.create({
        data: {
          referenzNummer: emp.referenzNummer,
          name: emp.name,
          skills: emp.skills,
          weeklyWorkRequirement: emp.weeklyWorkRequirement,
          urlaubsAnspruch: emp.urlaubsAnspruch,
          userId,
        },
      });
      console.log(`Created Mitarbeiter: ${mitarbeiter.referenzNummer} (${mitarbeiter.name}) — Skills: ${emp.skills.join(", ")}`);
    }
  }

  console.log("Employee seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
