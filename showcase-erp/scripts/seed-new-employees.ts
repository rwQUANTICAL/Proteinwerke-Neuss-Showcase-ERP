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

const NEW_EMPLOYEES = [
  {
    email: "peter.hoffmann@proteinwerke.de",
    name: "Peter Hoffmann",
    password: "Passwort1234!",
    referenzNummer: "MA-009",
    skills: ["MUEHLE", "EXTRAKTION", "LECITHIN"] as MitarbeiterSkill[],
    weeklyWorkRequirement: 40,
    urlaubsAnspruch: 28,
  },
  {
    email: "lisa.neumann@proteinwerke.de",
    name: "Lisa Neumann",
    password: "Passwort1234!",
    referenzNummer: "MA-010",
    skills: ["WALZE", "EXTRAKTION"] as MitarbeiterSkill[],
    weeklyWorkRequirement: 38,
    urlaubsAnspruch: 30,
  },
];

async function main() {
  for (const emp of NEW_EMPLOYEES) {
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

  console.log("New employee seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
