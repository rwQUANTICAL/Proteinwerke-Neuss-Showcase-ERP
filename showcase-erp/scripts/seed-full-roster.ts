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

/**
 * Roster calculation:
 *
 *   4 facilities × 3 shifts      = 12 slots/day
 *   + 2 floaters (SPRINGER)      = 14 workers/day
 *   8-day rotation (6 work, 2 off) → need 24 total employees
 *
 * Existing employees: MA-001 – MA-010 (10)
 * New employees needed: 14 (MA-011 – MA-024)
 *
 * Skill distribution targets (≥14 per skill across 24 employees):
 *   MUEHLE:     7 existing + 8 new = 15
 *   WALZE:      7 existing + 8 new = 15
 *   EXTRAKTION: 5 existing + 9 new = 14
 *   LECITHIN:   5 existing + 9 new = 14
 */
const NEW_EMPLOYEES: {
  email: string;
  name: string;
  password: string;
  referenzNummer: string;
  skills: MitarbeiterSkill[];
  weeklyWorkRequirement: number;
  urlaubsAnspruch: number;
}[] = [
  {
    email: "markus.bauer@proteinwerke.de",
    name: "Markus Bauer",
    password: "Passwort1234!",
    referenzNummer: "MA-011",
    skills: ["MUEHLE", "WALZE", "EXTRAKTION"],
    weeklyWorkRequirement: 40,
    urlaubsAnspruch: 28,
  },
  {
    email: "sabine.koch@proteinwerke.de",
    name: "Sabine Koch",
    password: "Passwort1234!",
    referenzNummer: "MA-012",
    skills: ["EXTRAKTION", "LECITHIN"],
    weeklyWorkRequirement: 38,
    urlaubsAnspruch: 30,
  },
  {
    email: "andreas.wagner@proteinwerke.de",
    name: "Andreas Wagner",
    password: "Passwort1234!",
    referenzNummer: "MA-013",
    skills: ["MUEHLE", "WALZE"],
    weeklyWorkRequirement: 40,
    urlaubsAnspruch: 26,
  },
  {
    email: "monika.becker@proteinwerke.de",
    name: "Monika Becker",
    password: "Passwort1234!",
    referenzNummer: "MA-014",
    skills: ["WALZE", "EXTRAKTION", "LECITHIN"],
    weeklyWorkRequirement: 40,
    urlaubsAnspruch: 28,
  },
  {
    email: "christian.schulz@proteinwerke.de",
    name: "Christian Schulz",
    password: "Passwort1234!",
    referenzNummer: "MA-015",
    skills: ["MUEHLE", "LECITHIN"],
    weeklyWorkRequirement: 38.5,
    urlaubsAnspruch: 30,
  },
  {
    email: "karin.richter@proteinwerke.de",
    name: "Karin Richter",
    password: "Passwort1234!",
    referenzNummer: "MA-016",
    skills: ["WALZE", "EXTRAKTION"],
    weeklyWorkRequirement: 40,
    urlaubsAnspruch: 28,
  },
  {
    email: "stefan.wolf@proteinwerke.de",
    name: "Stefan Wolf",
    password: "Passwort1234!",
    referenzNummer: "MA-017",
    skills: ["MUEHLE", "WALZE", "LECITHIN"],
    weeklyWorkRequirement: 40,
    urlaubsAnspruch: 26,
  },
  {
    email: "claudia.schaefer@proteinwerke.de",
    name: "Claudia Schäfer",
    password: "Passwort1234!",
    referenzNummer: "MA-018",
    skills: ["EXTRAKTION", "LECITHIN"],
    weeklyWorkRequirement: 38,
    urlaubsAnspruch: 30,
  },
  {
    email: "michael.zimmermann@proteinwerke.de",
    name: "Michael Zimmermann",
    password: "Passwort1234!",
    referenzNummer: "MA-019",
    skills: ["MUEHLE", "WALZE", "EXTRAKTION"],
    weeklyWorkRequirement: 40,
    urlaubsAnspruch: 28,
  },
  {
    email: "petra.krueger@proteinwerke.de",
    name: "Petra Krüger",
    password: "Passwort1234!",
    referenzNummer: "MA-020",
    skills: ["WALZE", "LECITHIN"],
    weeklyWorkRequirement: 40,
    urlaubsAnspruch: 26,
  },
  {
    email: "henrik.lange@proteinwerke.de",
    name: "Henrik Lange",
    password: "Passwort1234!",
    referenzNummer: "MA-021",
    skills: ["MUEHLE", "EXTRAKTION", "LECITHIN"],
    weeklyWorkRequirement: 38.5,
    urlaubsAnspruch: 28,
  },
  {
    email: "eva.friedrich@proteinwerke.de",
    name: "Eva Friedrich",
    password: "Passwort1234!",
    referenzNummer: "MA-022",
    skills: ["WALZE", "EXTRAKTION", "LECITHIN"],
    weeklyWorkRequirement: 40,
    urlaubsAnspruch: 30,
  },
  {
    email: "joerg.hartmann@proteinwerke.de",
    name: "Jörg Hartmann",
    password: "Passwort1234!",
    referenzNummer: "MA-023",
    skills: ["MUEHLE", "EXTRAKTION"],
    weeklyWorkRequirement: 40,
    urlaubsAnspruch: 28,
  },
  {
    email: "nicole.werner@proteinwerke.de",
    name: "Nicole Werner",
    password: "Passwort1234!",
    referenzNummer: "MA-024",
    skills: ["MUEHLE", "LECITHIN"],
    weeklyWorkRequirement: 38,
    urlaubsAnspruch: 30,
  },
];

async function main() {
  // Check how many employees already exist
  const existingCount = await prisma.mitarbeiter.count();
  console.log(`Found ${existingCount} existing employees.`);

  let created = 0;
  let skipped = 0;

  for (const emp of NEW_EMPLOYEES) {
    // Check if already exists by referenzNummer or email
    const existingMa = await prisma.mitarbeiter.findUnique({
      where: { referenzNummer: emp.referenzNummer },
    });
    if (existingMa) {
      console.log(`${emp.referenzNummer} (${emp.name}) already exists — skipped.`);
      skipped++;
      continue;
    }

    let userId: string | undefined;

    // Create user account
    try {
      const signUpRes = await auth.api.signUpEmail({
        body: { email: emp.email, password: emp.password, name: emp.name },
      });
      userId = signUpRes?.user?.id;
      if (userId) console.log(`Created user: ${emp.email}`);
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
    console.log(
      `Created ${mitarbeiter.referenzNummer} (${mitarbeiter.name}) — Skills: ${emp.skills.join(", ")}`,
    );
    created++;
  }

  const totalCount = await prisma.mitarbeiter.count();
  console.log(`\nDone. Created: ${created}, Skipped: ${skipped}. Total employees: ${totalCount}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
